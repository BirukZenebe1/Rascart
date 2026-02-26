from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import datetime
from collections import defaultdict
from models import create_order
from email_utils import send_email

orders_bp = Blueprint('orders', __name__)


def _safe_object_id(value):
    try:
        if isinstance(value, ObjectId):
            return value
        return ObjectId(value)
    except Exception:
        return None

@orders_bp.route('', methods=['POST'])
@jwt_required()
def create_order_route():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        items = data.get('items', [])
        total = data.get('total')
        payment_method = data.get('payment_method')
        promo_code = data.get('promo_code')
        discount = data.get('discount', 0)
        customer_email = (data.get('customer_email') or '').strip().lower()

        if not items or total is None or not payment_method:
            return jsonify({"error": "Missing order fields"}), 400

        order = create_order(
            user_id=ObjectId(current_user_id),
            items=items,
            total=float(total),
            payment_method=payment_method,
            promo_code=promo_code,
            discount=float(discount)
        )
        result = orders_bp.mongo.db.orders.insert_one(order)

        if promo_code:
            orders_bp.mongo.db.promo_codes.update_one(
                {'code': promo_code.upper()},
                {'$inc': {'used_count': 1}}
            )

        seller_item_groups = defaultdict(list)
        seller_ids = set()
        sold_out_types = set()

        # decrement stock and auto-unlist when sold out
        for item in items:
            product_id = item.get('_id') or item.get('id')
            qty = int(item.get('quantity', 1))
            product_oid = _safe_object_id(product_id)
            if not product_oid:
                continue

            product_filter = {'_id': product_oid, 'is_active': True}
            product_doc = orders_bp.mongo.db.products.find_one(product_filter)
            if not product_doc:
                continue

            seller_oid = _safe_object_id(product_doc.get('seller_id'))
            product_type = (product_doc.get('product_type') or '').strip()
            before_same_type = 0
            if seller_oid and product_type:
                before_same_type = orders_bp.mongo.db.products.count_documents({
                    'seller_id': seller_oid,
                    'product_type': product_type,
                    'is_active': True,
                    'stock': {'$gt': 0}
                })

            current_stock = int(product_doc.get('stock', 0))
            new_stock = max(0, current_stock - qty)
            updates = {
                'stock': new_stock,
                'updated_at': datetime.datetime.utcnow()
            }
            if new_stock <= 0:
                updates['is_active'] = False

            orders_bp.mongo.db.products.update_one(
                product_filter,
                {
                    '$set': updates,
                    '$inc': {'sales_count': qty}
                }
            )

            if seller_oid:
                seller_ids.add(seller_oid)
                if product_type:
                    remaining_same_type = orders_bp.mongo.db.products.count_documents({
                        'seller_id': seller_oid,
                        'product_type': product_type,
                        'is_active': True,
                        'stock': {'$gt': 0}
                    })
                    if before_same_type > 2 and remaining_same_type == 0:
                        sold_out_types.add(product_type)
                seller_item_groups[str(seller_oid)].append({
                    "name": item.get('name') or product_doc.get('name') or 'Item',
                    "quantity": qty,
                    "unit_price": float(item.get('price', product_doc.get('price', 0)) or 0),
                    "line_total": float(item.get('price', product_doc.get('price', 0)) or 0) * qty
                })

        orders_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$push': {'orders': result.inserted_id}}
        )

        user = orders_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        email_notice = None
        seller_email_failures = []
        seller_email_sent_count = 0
        recipient_email = customer_email or (user.get('email') if user else None)

        subtotal = float(total) + float(discount)
        order_id = str(result.inserted_id)
        readable_payment_method = str(payment_method).replace('_', ' ').title()
        item_lines = []
        for item in items:
            item_name = item.get('name', 'Item')
            qty = int(item.get('quantity', 1))
            price = float(item.get('price', 0))
            item_lines.append(f"- {item_name} x{qty}: ${price * qty:.2f}")

        if recipient_email:
            subject = "merkatoAI Order Confirmation"
            body = (
                f"Hi {user.get('username', 'there') if user else 'there'},\n\n"
                f"Your order has been confirmed successfully.\n\n"
                f"Order ID: {order_id}\n"
                f"Order Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
                f"Payment Method: {readable_payment_method}\n"
                f"Subtotal: ${subtotal:.2f}\n"
                f"Discount: -${float(discount):.2f}\n"
                f"Total Paid: ${float(total):.2f}\n\n"
                f"Items:\n" + "\n".join(item_lines) + "\n\n"
                f"We will notify sellers right away.\n"
                f"Thank you for shopping on merkatoAI."
            )
            try:
                send_email(recipient_email, subject, body)
            except Exception as email_error:
                email_notice = str(email_error)

        # Notify each seller with only their sold items.
        if seller_ids:
            seller_docs = list(orders_bp.mongo.db.users.find({'_id': {'$in': list(seller_ids)}}))
            for seller in seller_docs:
                seller_email = (seller.get('email') or '').strip().lower()
                if not seller_email:
                    continue
                seller_lines_data = seller_item_groups.get(str(seller['_id']), [])
                if not seller_lines_data:
                    continue

                seller_lines = [
                    f"- {line['name']} x{line['quantity']}: ${line['line_total']:.2f}"
                    for line in seller_lines_data
                ]
                seller_total = sum(line['line_total'] for line in seller_lines_data)
                seller_subject = f"New Order Received | {order_id}"
                seller_body = (
                    f"Hi {seller.get('username', 'Seller')},\n\n"
                    f"You received a new order on merkatoAI.\n\n"
                    f"Order ID: {order_id}\n"
                    f"Order Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
                    f"Buyer: {user.get('username', 'Customer') if user else 'Customer'}\n"
                    f"Buyer Email: {recipient_email or 'N/A'}\n\n"
                    f"Items sold by you:\n" + "\n".join(seller_lines) + "\n\n"
                    f"Seller Subtotal: ${seller_total:.2f}\n"
                    f"Please prepare fulfillment."
                )
                try:
                    send_email(seller_email, seller_subject, seller_body)
                    seller_email_sent_count += 1
                except Exception as seller_email_error:
                    seller_email_failures.append(str(seller_email_error))

        response_payload = {
            "message": "Order placed successfully",
            "order_id": str(result.inserted_id),
            "buyer_email_sent": email_notice is None and bool(recipient_email),
            "seller_emails_sent": seller_email_sent_count,
            "seller_emails_failed": len(seller_email_failures),
            "sold_out_types": sorted(list(sold_out_types))
        }
        if email_notice:
            response_payload["email_notice"] = "Order placed but confirmation email could not be sent."
            response_payload["email_error"] = email_notice
        else:
            response_payload["email_notice"] = "Order confirmation email sent."
        if seller_email_failures:
            response_payload["seller_email_errors"] = seller_email_failures[:3]
        return jsonify(response_payload), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route('/my', methods=['GET'])
@jwt_required()
def my_orders():
    try:
        current_user_id = get_jwt_identity()
        orders = list(orders_bp.mongo.db.orders.find({'user_id': ObjectId(current_user_id)}).sort('created_at', -1))
        for order in orders:
            order['_id'] = str(order['_id'])
            order['user_id'] = str(order['user_id'])
            if order.get('created_at'):
                order['created_at'] = order['created_at'].isoformat()
            if order.get('updated_at'):
                order['updated_at'] = order['updated_at'].isoformat()
        return jsonify({"orders": orders}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
