from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson.objectid import ObjectId
import datetime
from models import create_product, create_seller_profile

# Initialize blueprint
seller_bp = Blueprint('seller', __name__)

# Database connection will be attached by app.py
# seller_bp.sellers_db
# seller_bp.buyers_db

# Create seller profile (convert buyer to seller)
@seller_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_seller_profile_route():
    try:
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        user_type = jwt_data.get('user_type', 'buyer')
        
        if user_type != 'seller':
            return jsonify({"error": "Only seller accounts can create seller profiles"}), 403
        
        data = request.get_json()
        
        # Check required fields
        if 'business_name' not in data:
            return jsonify({"error": "Business name is required"}), 400
        
        # Check if user exists in sellers database
        user = seller_bp.sellers_db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "Seller user not found"}), 404
        
        # Check if already has a seller profile
        if user.get('seller_profile'):
            return jsonify({"error": "Seller already has a profile"}), 409
        
        # Create seller profile
        seller_profile = create_seller_profile(
            user_id=ObjectId(current_user_id),
            business_name=data['business_name'],
            business_description=data.get('business_description', ''),
            business_email=data.get('business_email', user['email']),
            phone=data.get('phone', '')
        )
        
        # Insert seller profile into sellers database
        result = seller_bp.sellers_db.seller_profiles.insert_one(seller_profile)
        
        # Update user to reference seller profile
        seller_bp.sellers_db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'seller_profile': result.inserted_id}}
        )
        
        return jsonify({
            "message": "Seller profile created successfully",
            "seller_profile_id": str(result.inserted_id),
            "database": "personashop_sellers"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get seller's own profile
@seller_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_seller_profile():
    try:
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        user_type = jwt_data.get('user_type', 'buyer')
        
        if user_type != 'seller':
            return jsonify({"error": "Not a seller account"}), 403
        
        user = seller_bp.sellers_db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or not user.get('seller_profile'):
            return jsonify({"error": "Seller profile not found"}), 404
        
        seller_profile = seller_bp.sellers_db.seller_profiles.find_one({
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
        
        return jsonify({
            "seller_profile": seller_profile,
            "database": "personashop_sellers"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add a new product (sellers only) - stored in SELLERS database
@seller_bp.route('/products', methods=['POST'])
@jwt_required()
def add_product():
    try:
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        user_type = jwt_data.get('user_type', 'buyer')
        
        if user_type != 'seller':
            return jsonify({"error": "Only sellers can add products"}), 403
        
        # Verify user exists in sellers database
        user = seller_bp.sellers_db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "Seller not found"}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'price', 'categories']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Create product in SELLERS database
        new_product = create_product(
            seller_id=ObjectId(current_user_id),
            name=data['name'],
            description=data['description'],
            price=float(data['price']),
            image_url=data.get('image_url', ''),
            categories=data['categories'],
            attributes=data.get('attributes', {}),
            stock=int(data.get('stock', 0))
        )
        
        # Insert into sellers database
        result = seller_bp.sellers_db.products.insert_one(new_product)
        
        return jsonify({
            "message": "Product added successfully to sellers database",
            "product_id": str(result.inserted_id),
            "database": "personashop_sellers"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get seller's products - from SELLERS database
@seller_bp.route('/products', methods=['GET'])
@jwt_required()
def get_seller_products():
    try:
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        user_type = jwt_data.get('user_type', 'buyer')
        
        if user_type != 'seller':
            return jsonify({"error": "Only sellers can view their products"}), 403
        
        # Get all products by this seller from SELLERS database
        products = list(seller_bp.sellers_db.products.find({
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
            "total": len(products),
            "database": "personashop_sellers"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update a product
@seller_bp.route('/products/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        user_type = jwt_data.get('user_type', 'buyer')
        
        if user_type != 'seller':
            return jsonify({"error": "Only sellers can update products"}), 403
        
        # Check if product exists and belongs to this seller
        product = seller_bp.sellers_db.products.find_one({
            '_id': ObjectId(product_id),
            'seller_id': ObjectId(current_user_id)
        })
        
        if not product:
            return jsonify({"error": "Product not found or unauthorized"}), 404
        
        data = request.get_json()
        
        # Build update document
        update_fields = {}
        allowed_fields = ['name', 'description', 'price', 'image_url', 'categories', 'attributes', 'stock', 'is_active']
        
        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]
        
        update_fields['updated_at'] = datetime.datetime.now()
        
        # Update product in sellers database
        seller_bp.sellers_db.products.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': update_fields}
        )
        
        return jsonify({
            "message": "Product updated successfully",
            "database": "personashop_sellers"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete a product
@seller_bp.route('/products/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        user_type = jwt_data.get('user_type', 'buyer')
        
        if user_type != 'seller':
            return jsonify({"error": "Only sellers can delete products"}), 403
        
        # Check if product exists and belongs to this seller
        product = seller_bp.sellers_db.products.find_one({
            '_id': ObjectId(product_id),
            'seller_id': ObjectId(current_user_id)
        })
        
        if not product:
            return jsonify({"error": "Product not found or unauthorized"}), 404
        
        # Delete product from sellers database
        seller_bp.sellers_db.products.delete_one({'_id': ObjectId(product_id)})
        
        return jsonify({
            "message": "Product deleted successfully",
            "database": "personashop_sellers"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get seller statistics
@seller_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_seller_stats():
    try:
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        user_type = jwt_data.get('user_type', 'buyer')
        
        if user_type != 'seller':
            return jsonify({"error": "Only sellers can view stats"}), 403
        
        # Get product count from sellers database
        total_products = seller_bp.sellers_db.products.count_documents({
            'seller_id': ObjectId(current_user_id)
        })
        
        active_products = seller_bp.sellers_db.products.count_documents({
            'seller_id': ObjectId(current_user_id),
            'is_active': True
        })
        
        # Get total views and sales from sellers database
        products = list(seller_bp.sellers_db.products.find({
            'seller_id': ObjectId(current_user_id)
        }))
        
        total_views = sum(p.get('views', 0) for p in products)
        total_sales = sum(p.get('sales_count', 0) for p in products)
        
        return jsonify({
            "total_products": total_products,
            "active_products": active_products,
            "total_views": total_views,
            "total_sales": total_sales,
            "database": "personashop_sellers"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500