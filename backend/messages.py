from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import datetime
from content_moderation import ContentPolicyError, assert_content_allowed
from models import create_message_thread

messages_bp = Blueprint('messages', __name__)

def _safe_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None

def _serialize_thread(thread, current_user_id=None):
    thread['_id'] = str(thread['_id'])
    thread['product_id'] = str(thread['product_id'])
    thread['buyer_id'] = str(thread['buyer_id'])
    thread['seller_id'] = str(thread['seller_id'])
    if thread.get('created_at'):
        thread['created_at'] = thread['created_at'].isoformat()
    if thread.get('updated_at'):
        thread['updated_at'] = thread['updated_at'].isoformat()
    unread_count = 0
    current_user_str = str(current_user_id) if current_user_id else None
    for message in thread.get('messages', []):
        if current_user_str and message.get('sender_id') != current_user_str:
            read_by = message.get('read_by') or []
            if current_user_str not in read_by:
                unread_count += 1
    thread['unread_count'] = unread_count
    if thread.get('messages'):
        thread['last_message'] = thread['messages'][-1]
    return thread

@messages_bp.route('/thread/<product_id>', methods=['GET'])
@jwt_required()
def get_thread(product_id):
    current_user_id = ObjectId(get_jwt_identity())
    product_oid = _safe_object_id(product_id)
    if not product_oid:
        return jsonify({"error": "Invalid product id"}), 400
    thread = messages_bp.mongo.db.message_threads.find_one({
        'product_id': product_oid,
        '$or': [{'buyer_id': current_user_id}, {'seller_id': current_user_id}]
    })
    if not thread:
        return jsonify({"thread": None}), 200
    return jsonify({"thread": _serialize_thread(thread, current_user_id)}), 200

@messages_bp.route('/thread/<product_id>', methods=['POST'])
@jwt_required()
def send_message(product_id):
    data = request.get_json() or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({"error": "Message text required"}), 400
    try:
        assert_content_allowed(text_items=[text])
    except ContentPolicyError as policy_error:
        return jsonify({"error": str(policy_error), "categories": policy_error.categories}), 400

    current_user_id = ObjectId(get_jwt_identity())
    product_oid = _safe_object_id(product_id)
    if not product_oid:
        return jsonify({"error": "Invalid product id"}), 400

    product = messages_bp.mongo.db.products.find_one({'_id': product_oid})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    seller_id = product.get('seller_id')
    if not seller_id:
        return jsonify({"error": "Seller not found"}), 404

    if not isinstance(seller_id, ObjectId):
        seller_id = _safe_object_id(seller_id)
    if not seller_id:
        return jsonify({"error": "Seller not found"}), 404

    thread = None
    thread_id = data.get('thread_id')
    buyer_id = None
    if data.get('buyer_id'):
        buyer_id = _safe_object_id(data.get('buyer_id'))

    if thread_id:
        thread_oid = _safe_object_id(thread_id)
        if thread_oid:
            thread = messages_bp.mongo.db.message_threads.find_one({
                '_id': thread_oid,
                'product_id': product_oid,
                '$or': [{'buyer_id': current_user_id}, {'seller_id': current_user_id}]
            })

    if not thread:
        if current_user_id == seller_id:
            thread_query = {
                'product_id': product_oid,
                'seller_id': current_user_id
            }
            if buyer_id:
                thread_query['buyer_id'] = buyer_id
            thread = messages_bp.mongo.db.message_threads.find_one(thread_query)
        else:
            thread = messages_bp.mongo.db.message_threads.find_one({
                'product_id': product_oid,
                'buyer_id': current_user_id
            })

    if not thread:
        if current_user_id == seller_id and not buyer_id:
            return jsonify({"error": "buyer_id is required for seller replies"}), 400

        thread = create_message_thread(
            product_oid,
            buyer_id if current_user_id == seller_id else current_user_id,
            seller_id
        )
        thread_id = messages_bp.mongo.db.message_threads.insert_one(thread).inserted_id
        thread = messages_bp.mongo.db.message_threads.find_one({'_id': thread_id})

    message = {
        'sender_id': str(current_user_id),
        'text': text,
        'created_at': datetime.datetime.utcnow().isoformat(),
        'read_by': [str(current_user_id)]
    }

    messages_bp.mongo.db.message_threads.update_one(
        {'_id': thread['_id']},
        {'$push': {'messages': message}, '$set': {'updated_at': datetime.datetime.utcnow()}}
    )

    updated = messages_bp.mongo.db.message_threads.find_one({'_id': thread['_id']})
    return jsonify({"thread": _serialize_thread(updated, current_user_id)}), 200

@messages_bp.route('/thread/<thread_id>/read', methods=['POST'])
@jwt_required()
def mark_thread_read(thread_id):
    current_user_id = ObjectId(get_jwt_identity())
    thread_oid = _safe_object_id(thread_id)
    if not thread_oid:
        return jsonify({"error": "Invalid thread id"}), 400

    thread = messages_bp.mongo.db.message_threads.find_one({
        '_id': thread_oid,
        '$or': [{'buyer_id': current_user_id}, {'seller_id': current_user_id}]
    })
    if not thread:
        return jsonify({"error": "Thread not found"}), 404

    current_user_str = str(current_user_id)
    messages = thread.get('messages', [])
    updated_messages = []
    changed = False

    for message in messages:
        read_by = message.get('read_by') or []
        if message.get('sender_id') != current_user_str and current_user_str not in read_by:
            read_by = [*read_by, current_user_str]
            message = {**message, 'read_by': read_by}
            changed = True
        updated_messages.append(message)

    if changed:
        messages_bp.mongo.db.message_threads.update_one(
            {'_id': thread_oid},
            {'$set': {'messages': updated_messages, 'updated_at': datetime.datetime.utcnow()}}
        )
        thread = messages_bp.mongo.db.message_threads.find_one({'_id': thread_oid})
    else:
        thread['messages'] = updated_messages

    return jsonify({"thread": _serialize_thread(thread, current_user_id)}), 200

@messages_bp.route('/threads', methods=['GET'])
@jwt_required()
def list_threads():
    current_user_id = ObjectId(get_jwt_identity())
    threads = list(messages_bp.mongo.db.message_threads.find({
        '$or': [{'buyer_id': current_user_id}, {'seller_id': current_user_id}]
    }).sort('updated_at', -1))

    product_ids = [t.get('product_id') for t in threads if t.get('product_id')]
    buyer_ids = [t.get('buyer_id') for t in threads if t.get('buyer_id')]
    seller_ids = [t.get('seller_id') for t in threads if t.get('seller_id')]

    products = {}
    if product_ids:
        product_docs = messages_bp.mongo.db.products.find({'_id': {'$in': product_ids}})
        products = {str(p['_id']): p for p in product_docs}

    buyers = {}
    if buyer_ids:
        buyer_docs = messages_bp.mongo.db.users.find({'_id': {'$in': buyer_ids}})
        buyers = {str(u['_id']): u for u in buyer_docs}

    sellers = {}
    if seller_ids:
        seller_docs = messages_bp.mongo.db.users.find({'_id': {'$in': seller_ids}})
        sellers = {str(u['_id']): u for u in seller_docs}

    serialized_threads = []
    for thread in threads:
        serialized = _serialize_thread(thread, current_user_id)
        product = products.get(serialized['product_id'])
        buyer = buyers.get(serialized['buyer_id'])
        seller = sellers.get(serialized['seller_id'])
        if product:
            serialized['product_name'] = product.get('name', 'Product')
            serialized['product_image'] = product.get('image_url')
        if buyer:
            serialized['buyer_username'] = buyer.get('username', 'Buyer')
        if seller:
            serialized['seller_username'] = seller.get('username', 'Seller')
        serialized_threads.append(serialized)

    return jsonify({"threads": serialized_threads}), 200
