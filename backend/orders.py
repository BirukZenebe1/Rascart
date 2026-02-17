from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import datetime
from models import create_order
from email_utils import send_email

orders_bp = Blueprint('orders', __name__)

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

        # decrement stock and auto-unlist when sold out
        for item in items:
            product_id = item.get('_id') or item.get('id')
            qty = int(item.get('quantity', 1))
            if product_id:
                product_filter = {'_id': ObjectId(product_id), 'is_active': True}
                product_doc = orders_bp.mongo.db.products.find_one(product_filter)
                if not product_doc:
                    continue

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

        orders_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$push': {'orders': result.inserted_id}}
        )

        user = orders_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        email_notice = None
        if user and user.get('email'):
            subject = "merkatoAI Order Confirmation"
            body = f"Thanks for your order! Order ID: {result.inserted_id}"
            try:
                send_email(user['email'], subject, body)
            except Exception as email_error:
                email_notice = str(email_error)

        response_payload = {
            "message": "Order placed",
            "order_id": str(result.inserted_id)
        }
        if email_notice:
            response_payload["email_notice"] = "Order placed but confirmation email could not be sent."
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
