from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import datetime
import os
import base64
from models import create_product, create_seller_profile

# Initialize blueprint
seller_bp = Blueprint('seller', __name__)
MAX_PRODUCT_IMAGE_BYTES = 3 * 1024 * 1024

def save_product_image(base64_string, filename_prefix='product', host_url=''):
    try:
        if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            if base64_string.startswith('data:'):
                return base64_string
            if 'base64,' in base64_string:
                base64_string = base64_string.split('base64,')[1]
            return f"data:image/png;base64,{base64_string}"

        upload_folder = os.path.join(os.path.dirname(__file__), 'uploads', 'products')
        os.makedirs(upload_folder, exist_ok=True)

        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        if not base64_string:
            return None

        image_data = base64.b64decode(base64_string)
        if len(image_data) > MAX_PRODUCT_IMAGE_BYTES:
            return None
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{filename_prefix}_{timestamp}.png"
        filepath = os.path.join(upload_folder, filename)

        with open(filepath, 'wb') as file_handle:
            file_handle.write(image_data)

        return f"{host_url}api/auth/uploads/products/{filename}"
    except Exception:
        return None

# Create seller profile (convert buyer to seller)
@seller_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_seller_profile_route():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check required fields
        if 'business_name' not in data:
            return jsonify({"error": "Business name is required"}), 400
        
        # Check if user exists
        user = seller_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if already a seller
        if user.get('seller_profile'):
            return jsonify({"error": "User already has a seller profile"}), 409
        
        # Create seller profile
        seller_profile = create_seller_profile(
            user_id=ObjectId(current_user_id),
            business_name=data['business_name'],
            business_description=data.get('business_description', ''),
            business_email=data.get('business_email', user['email']),
            phone=data.get('phone', '')
        )
        
        # Insert seller profile
        result = seller_bp.mongo.db.seller_profiles.insert_one(seller_profile)
        
        # Update user to be a seller
        seller_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {
                'user_type': 'seller',
                'seller_profile': result.inserted_id
            }}
        )
        
        return jsonify({
            "message": "Seller profile created successfully",
            "seller_profile_id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get seller's own profile
@seller_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_seller_profile():
    try:
        current_user_id = get_jwt_identity()
        
        user = seller_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('user_type') != 'seller':
            return jsonify({"error": "Not a seller account"}), 403
        
        if not user.get('seller_profile'):
            return jsonify({"error": "Seller profile not found"}), 404
        
        seller_profile = seller_bp.mongo.db.seller_profiles.find_one({
            '_id': user['seller_profile']
        })
        
        if not seller_profile:
            return jsonify({"error": "Seller profile not found"}), 404
        
        # Format response
        seller_profile['_id'] = str(seller_profile['_id'])
        seller_profile['user_id'] = str(seller_profile['user_id'])
        if 'created_at' in seller_profile:
            seller_profile['created_at'] = seller_profile['created_at'].isoformat()
        if 'updated_at' in seller_profile:
            seller_profile['updated_at'] = seller_profile['updated_at'].isoformat()
        
        return jsonify({"seller_profile": seller_profile}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add a new product (sellers only)
@seller_bp.route('/products', methods=['POST'])
@jwt_required()
def add_product():
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a seller
        user = seller_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('user_type') != 'seller':
            return jsonify({"error": "Only sellers can add products"}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'price', 'product_type', 'preferred_contact', 'payment_method']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        image_url = data.get('image_url', '')
        if data.get('image_data'):
            uploaded_image_url = save_product_image(
                data['image_data'],
                filename_prefix=f"seller_{current_user_id}",
                host_url=request.host_url
            )
            if not uploaded_image_url:
                return jsonify({"error": "Failed to upload product image"}), 500
            image_url = uploaded_image_url
        
        # Create product
        new_product = create_product(
            seller_id=ObjectId(current_user_id),
            name=data['name'],
            description=data['description'],
            price=float(data['price']),
            image_url=image_url,
            categories=data.get('categories') or [data['product_type']],
            attributes=data.get('attributes', {}),
            stock=int(data.get('stock', 0)),
            product_type=data['product_type'],
            preferred_contact=data['preferred_contact'],
            payment_method=data['payment_method']
        )
        
        # Insert into database
        result = seller_bp.mongo.db.products.insert_one(new_product)
        
        return jsonify({
            "message": "Product added successfully",
            "product_id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get seller's products
@seller_bp.route('/products', methods=['GET'])
@jwt_required()
def get_seller_products():
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a seller
        user = seller_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('user_type') != 'seller':
            return jsonify({"error": "Only sellers can view their products"}), 403
        
        # Get all products by this seller
        products = list(seller_bp.mongo.db.products.find({
            'seller_id': ObjectId(current_user_id)
        }).sort('created_at', -1))
        
        # Format products
        for product in products:
            product['_id'] = str(product['_id'])
            product['seller_id'] = str(product['seller_id'])
            if 'created_at' in product:
                product['created_at'] = product['created_at'].isoformat()
            if 'updated_at' in product:
                product['updated_at'] = product['updated_at'].isoformat()
        
        return jsonify({
            "products": products,
            "total": len(products)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update a product (seller only, their own products)
@seller_bp.route('/products/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a seller
        user = seller_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('user_type') != 'seller':
            return jsonify({"error": "Only sellers can update products"}), 403
        
        # Check if product exists and belongs to this seller
        product = seller_bp.mongo.db.products.find_one({
            '_id': ObjectId(product_id),
            'seller_id': ObjectId(current_user_id)
        })
        
        if not product:
            return jsonify({"error": "Product not found or unauthorized"}), 404
        
        data = request.get_json()
        
        # Build update document
        update_fields = {}
        allowed_fields = [
            'name', 'description', 'price', 'image_url', 'categories', 'attributes', 'stock', 'is_active',
            'product_type', 'preferred_contact', 'payment_method'
        ]
        
        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]

        if 'price' in update_fields:
            update_fields['price'] = float(update_fields['price'])
        if 'stock' in update_fields:
            update_fields['stock'] = int(update_fields['stock'])

        if data.get('image_data'):
            uploaded_image_url = save_product_image(
                data['image_data'],
                filename_prefix=f"seller_{current_user_id}",
                host_url=request.host_url
            )
            if not uploaded_image_url:
                return jsonify({"error": "Failed to upload product image"}), 500
            update_fields['image_url'] = uploaded_image_url
        
        update_fields['updated_at'] = datetime.datetime.now()
        
        # Update product
        seller_bp.mongo.db.products.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': update_fields}
        )
        
        return jsonify({"message": "Product updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete a product (seller only, their own products)
@seller_bp.route('/products/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a seller
        user = seller_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('user_type') != 'seller':
            return jsonify({"error": "Only sellers can delete products"}), 403
        
        # Check if product exists and belongs to this seller
        product = seller_bp.mongo.db.products.find_one({
            '_id': ObjectId(product_id),
            'seller_id': ObjectId(current_user_id)
        })
        
        if not product:
            return jsonify({"error": "Product not found or unauthorized"}), 404
        
        # Delete product
        seller_bp.mongo.db.products.delete_one({'_id': ObjectId(product_id)})
        
        return jsonify({"message": "Product deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get seller statistics
@seller_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_seller_stats():
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user is a seller
        user = seller_bp.mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('user_type') != 'seller':
            return jsonify({"error": "Only sellers can view stats"}), 403
        
        # Get product count
        total_products = seller_bp.mongo.db.products.count_documents({
            'seller_id': ObjectId(current_user_id)
        })
        
        active_products = seller_bp.mongo.db.products.count_documents({
            'seller_id': ObjectId(current_user_id),
            'is_active': True
        })
        
        # Get total views and sales
        products = list(seller_bp.mongo.db.products.find({
            'seller_id': ObjectId(current_user_id)
        }))
        
        total_views = sum(p.get('views', 0) for p in products)
        total_sales = sum(p.get('sales_count', 0) for p in products)
        
        return jsonify({
            "total_products": total_products,
            "active_products": active_products,
            "total_views": total_views,
            "total_sales": total_sales
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
