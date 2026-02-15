from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import datetime
import os
from models import create_promo_code

promos_bp = Blueprint('promos', __name__)

def _is_admin(user):
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower().strip()
    return admin_email and user and user.get("email", "").lower() == admin_email

@promos_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_code():
    data = request.get_json() or {}
    code = (data.get('code') or '').strip().upper()
    if not code:
        return jsonify({"error": "Code is required"}), 400

    promo = promos_bp.mongo.db.promo_codes.find_one({'code': code, 'is_active': True})
    if not promo:
        return jsonify({"error": "Invalid promo code"}), 404

    if promo.get('expires_at') and promo['expires_at'] < datetime.datetime.utcnow():
        return jsonify({"error": "Promo code expired"}), 400

    if promo.get('usage_limit') is not None and promo.get('used_count', 0) >= promo['usage_limit']:
        return jsonify({"error": "Promo code limit reached"}), 400

    return jsonify({
        "code": promo['code'],
        "discount_type": promo['discount_type'],
        "discount_value": promo['discount_value']
    }), 200

@promos_bp.route('/admin', methods=['GET'])
@jwt_required()
def list_promos():
    current_user_id = get_jwt_identity()
    user = promos_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    if not _is_admin(user):
        return jsonify({"error": "Unauthorized"}), 403

    promos = list(promos_bp.mongo.db.promo_codes.find().sort('created_at', -1))
    for promo in promos:
        promo['_id'] = str(promo['_id'])
        if promo.get('expires_at'):
            promo['expires_at'] = promo['expires_at'].isoformat()
        if promo.get('created_at'):
            promo['created_at'] = promo['created_at'].isoformat()
        if promo.get('updated_at'):
            promo['updated_at'] = promo['updated_at'].isoformat()
    return jsonify({"promos": promos}), 200

@promos_bp.route('/admin', methods=['POST'])
@jwt_required()
def create_promo():
    current_user_id = get_jwt_identity()
    user = promos_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    if not _is_admin(user):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    code = (data.get('code') or '').strip().upper()
    discount_type = data.get('discount_type')
    discount_value = data.get('discount_value')
    expires_at = data.get('expires_at')
    usage_limit = data.get('usage_limit')

    if not code or discount_type not in ['percent', 'amount'] or not discount_value:
        return jsonify({"error": "Invalid promo data"}), 400

    if promos_bp.mongo.db.promo_codes.find_one({'code': code}):
        return jsonify({"error": "Promo code already exists"}), 409

    expires_dt = None
    if expires_at:
        try:
            expires_dt = datetime.datetime.fromisoformat(expires_at)
        except Exception:
            return jsonify({"error": "Invalid expires_at"}), 400

    promo = create_promo_code(code, discount_type, float(discount_value), expires_dt, usage_limit)
    promo_id = promos_bp.mongo.db.promo_codes.insert_one(promo).inserted_id

    return jsonify({"message": "Promo created", "promo_id": str(promo_id)}), 201

@promos_bp.route('/admin/<promo_id>', methods=['PUT'])
@jwt_required()
def update_promo(promo_id):
    current_user_id = get_jwt_identity()
    user = promos_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    if not _is_admin(user):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    updates = {}
    if 'is_active' in data:
        updates['is_active'] = bool(data['is_active'])
    if 'usage_limit' in data:
        updates['usage_limit'] = data['usage_limit']
    if 'expires_at' in data:
        try:
            updates['expires_at'] = datetime.datetime.fromisoformat(data['expires_at']) if data['expires_at'] else None
        except Exception:
            return jsonify({"error": "Invalid expires_at"}), 400

    if updates:
        updates['updated_at'] = datetime.datetime.utcnow()
        promos_bp.mongo.db.promo_codes.update_one({'_id': ObjectId(promo_id)}, {'$set': updates})

    return jsonify({"message": "Promo updated"}), 200

@promos_bp.route('/admin/<promo_id>', methods=['DELETE'])
@jwt_required()
def delete_promo(promo_id):
    current_user_id = get_jwt_identity()
    user = promos_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    if not _is_admin(user):
        return jsonify({"error": "Unauthorized"}), 403

    promos_bp.mongo.db.promo_codes.delete_one({'_id': ObjectId(promo_id)})
    return jsonify({"message": "Promo deleted"}), 200
