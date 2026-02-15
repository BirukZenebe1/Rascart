from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import datetime
from models import create_message_thread

messages_bp = Blueprint('messages', __name__)

def _serialize_thread(thread):
    thread['_id'] = str(thread['_id'])
    thread['product_id'] = str(thread['product_id'])
    thread['buyer_id'] = str(thread['buyer_id'])
    thread['seller_id'] = str(thread['seller_id'])
    if thread.get('created_at'):
        thread['created_at'] = thread['created_at'].isoformat()
    if thread.get('updated_at'):
        thread['updated_at'] = thread['updated_at'].isoformat()
    return thread

@messages_bp.route('/thread/<product_id>', methods=['GET'])
@jwt_required()
def get_thread(product_id):
    current_user_id = ObjectId(get_jwt_identity())
    thread = messages_bp.mongo.db.message_threads.find_one({
        'product_id': ObjectId(product_id),
        '$or': [{'buyer_id': current_user_id}, {'seller_id': current_user_id}]
    })
    if not thread:
        return jsonify({"thread": None}), 200
    return jsonify({"thread": _serialize_thread(thread)}), 200

@messages_bp.route('/thread/<product_id>', methods=['POST'])
@jwt_required()
def send_message(product_id):
    data = request.get_json() or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({"error": "Message text required"}), 400

    current_user_id = ObjectId(get_jwt_identity())
    product = messages_bp.mongo.db.products.find_one({'_id': ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    seller_id = product.get('seller_id')
    if not seller_id:
        return jsonify({"error": "Seller not found"}), 404

    thread = messages_bp.mongo.db.message_threads.find_one({
        'product_id': ObjectId(product_id),
        'buyer_id': current_user_id
    })

    if not thread:
        thread = create_message_thread(ObjectId(product_id), current_user_id, seller_id)
        thread_id = messages_bp.mongo.db.message_threads.insert_one(thread).inserted_id
        thread = messages_bp.mongo.db.message_threads.find_one({'_id': thread_id})

    message = {
        'sender_id': str(current_user_id),
        'text': text,
        'created_at': datetime.datetime.utcnow().isoformat()
    }

    messages_bp.mongo.db.message_threads.update_one(
        {'_id': thread['_id']},
        {'$push': {'messages': message}, '$set': {'updated_at': datetime.datetime.utcnow()}}
    )

    updated = messages_bp.mongo.db.message_threads.find_one({'_id': thread['_id']})
    return jsonify({"thread": _serialize_thread(updated)}), 200

@messages_bp.route('/threads', methods=['GET'])
@jwt_required()
def list_threads():
    current_user_id = ObjectId(get_jwt_identity())
    threads = list(messages_bp.mongo.db.message_threads.find({
        '$or': [{'buyer_id': current_user_id}, {'seller_id': current_user_id}]
    }).sort('updated_at', -1))
    return jsonify({"threads": [_serialize_thread(t) for t in threads]}), 200
