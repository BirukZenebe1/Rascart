from flask import Blueprint, request, jsonify, send_from_directory
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime
from models import create_user
from bson.objectid import ObjectId
from image_utils import save_base64_image, delete_image
import os

# Initialize blueprint and bcrypt
auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# User Registration
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({"error": "Missing required fields"}), 400
        
        existing_user = auth_bp.mongo.db.users.find_one({'email': data['email']})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409
        
        existing_username = auth_bp.mongo.db.users.find_one({'username': data['username']})
        if existing_username:
            return jsonify({"error": "Username already taken"}), 409
        
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        user_type = data.get('user_type', 'buyer')
        if user_type not in ['buyer', 'seller']:
            user_type = 'buyer'
        
        new_user = create_user(
            username=data['username'],
            email=data['email'],
            password_hash=hashed_password,
            user_type=user_type
        )
        
        user_id = auth_bp.mongo.db.users.insert_one(new_user).inserted_id
        
        new_user.pop('password', None)
        new_user['_id'] = str(user_id)
        
        if 'created_at' in new_user:
            new_user['created_at'] = new_user['created_at'].isoformat()
        
        return jsonify({
            "message": "User registered successfully",
            "user": new_user
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# User Login
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ['email', 'password']):
            return jsonify({"error": "Missing email or password"}), 400
        
        user = auth_bp.mongo.db.users.find_one({'email': data['email']})
        
        if user and bcrypt.check_password_hash(user['password'], data['password']):
            expires = datetime.timedelta(days=1)
            access_token = create_access_token(
                identity=str(user['_id']),
                expires_delta=expires
            )
            
            return jsonify({
                "message": "Login successful",
                "token": access_token,
                "user_id": str(user['_id']),
                "username": user['username'],
                "email": user['email'],
                "user_type": user.get('user_type', 'buyer'),
                "profile_photo": user.get('profile_photo', None)
            }), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get current user profile
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    try:
        current_user_id = get_jwt_identity()
        user = auth_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user.pop('password', None)
        user['_id'] = str(user['_id'])
        
        if user.get('seller_profile'):
            user['seller_profile'] = str(user['seller_profile'])
        if user.get('style_profile'):
            user['style_profile'] = str(user['style_profile'])
        
        if 'created_at' in user:
            user['created_at'] = user['created_at'].isoformat()
        
        return jsonify({"user": user}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update current user profile
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        user_id = ObjectId(current_user_id)

        user = auth_bp.mongo.db.users.find_one({'_id': user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404

        updates = {}

        if 'username' in data:
            username = (data.get('username') or '').strip()
            if not username:
                return jsonify({"error": "Username cannot be empty"}), 400
            existing_username = auth_bp.mongo.db.users.find_one({
                'username': username,
                '_id': {'$ne': user_id}
            })
            if existing_username:
                return jsonify({"error": "Username already taken"}), 409
            updates['username'] = username

        if 'email' in data:
            email = (data.get('email') or '').strip().lower()
            if not email:
                return jsonify({"error": "Email cannot be empty"}), 400
            existing_email = auth_bp.mongo.db.users.find_one({
                'email': email,
                '_id': {'$ne': user_id}
            })
            if existing_email:
                return jsonify({"error": "Email already registered"}), 409
            updates['email'] = email

        if 'preferred_payment_method' in data:
            payment_method = (data.get('preferred_payment_method') or '').strip()
            allowed_methods = ['card', 'bank_transfer', 'mobile_money', 'cash_on_delivery', 'paypal']
            if payment_method and payment_method not in allowed_methods:
                return jsonify({"error": "Invalid payment method"}), 400
            updates['preferred_payment_method'] = payment_method

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        auth_bp.mongo.db.users.update_one({'_id': user_id}, {'$set': updates})

        updated_user = auth_bp.mongo.db.users.find_one({'_id': user_id})
        updated_user.pop('password', None)
        updated_user['_id'] = str(updated_user['_id'])

        if updated_user.get('seller_profile'):
            updated_user['seller_profile'] = str(updated_user['seller_profile'])
        if updated_user.get('style_profile'):
            updated_user['style_profile'] = str(updated_user['style_profile'])
        if 'created_at' in updated_user:
            updated_user['created_at'] = updated_user['created_at'].isoformat()

        return jsonify({
            "message": "Profile updated successfully",
            "user": updated_user
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Upload profile photo
@auth_bp.route('/profile/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        user = auth_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.get('profile_photo'):
            old_photo_path = os.path.join(
                os.path.dirname(__file__),
                user['profile_photo'].lstrip('/')
            )
            delete_image(old_photo_path)
        
        filename_prefix = f"user_{current_user_id}"
        image_path = save_base64_image(data['image'], filename_prefix)
        
        if not image_path:
            return jsonify({"error": "Failed to save image"}), 500
        
        auth_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'profile_photo': image_path}}
        )
        
        return jsonify({
            "message": "Profile photo updated successfully",
            "profile_photo": image_path
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete profile photo
@auth_bp.route('/profile/photo', methods=['DELETE'])
@jwt_required()
def delete_profile_photo():
    try:
        current_user_id = get_jwt_identity()
        
        user = auth_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.get('profile_photo'):
            photo_path = os.path.join(
                os.path.dirname(__file__),
                user['profile_photo'].lstrip('/')
            )
            delete_image(photo_path)
        
        auth_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$unset': {'profile_photo': ''}}
        )
        
        return jsonify({"message": "Profile photo deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve uploaded images
@auth_bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(upload_folder, filename)
