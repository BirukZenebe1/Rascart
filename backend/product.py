from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity

# Initialize blueprint
product_bp = Blueprint('product', __name__)

def _serialize_product(product):
    if not product:
        return product
    product['_id'] = str(product['_id'])
    if 'seller_id' in product and product['seller_id'] is not None:
        product['seller_id'] = str(product['seller_id'])
    if 'seller_profile' in product and product['seller_profile'] is not None:
        product['seller_profile'] = str(product['seller_profile'])
    if 'created_at' in product:
        product['created_at'] = product['created_at'].isoformat()
    if 'updated_at' in product:
        product['updated_at'] = product['updated_at'].isoformat()
    return product

# Get all products with filtering, sorting, and pagination
@product_bp.route('/list', methods=['GET'])
def list_products():
    try:
        # Parse query parameters
        # Category filter
        category = request.args.get('category', None)
        
        # Price range filter
        min_price = request.args.get('min_price', None)
        max_price = request.args.get('max_price', None)
        
        # Text search
        search = request.args.get('search', None)
        
        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))
        
        # Build query filters
        query = {}
        
        if category:
            query['categories'] = category
            
        if min_price or max_price:
            price_query = {}
            if min_price:
                price_query['$gte'] = float(min_price)
            if max_price:
                price_query['$lte'] = float(max_price)
            query['price'] = price_query
            
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        # Set up sorting
        sort_direction = -1 if sort_order == 'desc' else 1
        sort_options = {sort_by: sort_direction}
        
        # Calculate skip value for pagination
        skip = (page - 1) * per_page
        
        # Execute query with pagination
        total_products = product_bp.mongo.db.products.count_documents(query)
        products = list(product_bp.mongo.db.products.find(query)
                        .sort(list(sort_options.items()))
                        .skip(skip)
                        .limit(per_page))
        
        # Format products for response
        formatted_products = []
        for product in products:
            formatted_products.append(_serialize_product(product))
        
        # Calculate total pages
        total_pages = (total_products + per_page - 1) // per_page
        
        return jsonify({
            'products': formatted_products,
            'page': page,
            'per_page': per_page,
            'total_products': total_products,
            'total_pages': total_pages
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get all product categories
@product_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        # Aggregate all unique categories
        categories = product_bp.mongo.db.products.distinct('categories')
        return jsonify({'categories': categories})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single product by ID
@product_bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = product_bp.mongo.db.products.find_one({'_id': ObjectId(product_id)})
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Format product for response
        product = _serialize_product(product)
            
        return jsonify({'product': product})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get product recommendations based on style profile
@product_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    try:
        # Get user ID from JWT
        current_user_id = get_jwt_identity()
        
        # Find user's style profile
        user = product_bp.mongo.db.users.find_one({
            '_id': ObjectId(current_user_id)
        })
        
        # Default recommendations if no style profile
        if not user or not user.get('style_profile'):
            # Just return some newest products
            products = list(product_bp.mongo.db.products.find()
                            .sort('created_at', -1)
                            .limit(6))

            for product in products:
                _serialize_product(product)

            return jsonify({
                'products': products,
                'message': 'Default recommendations (no style profile)'
            })
        
        # Get the style profile
        style_profile = product_bp.mongo.db.style_profiles.find_one({
            '_id': user['style_profile']
        })
        
        # Use style preferences to find matching products
        preferences = style_profile.get('preferences', {})
        
        # Build a query based on preferences
        query = {}
        
        # Example: Filter by occasion if it exists in the profile
        if 'occasion' in preferences:
            occasion = preferences['occasion']
            if occasion == 'formal':
                query['categories'] = {'$in': ['formal', 'business']}
            elif occasion == 'casual':
                query['categories'] = {'$in': ['casual', 'everyday']}
            # Add more occasion mappings as needed
        
        # Match colors if specified
        if 'color_palette' in preferences:
            color = preferences['color_palette']
            if color == 'neutrals':
                query['attributes.color'] = {'$in': ['black', 'white', 'gray', 'beige']}
            elif color == 'earth_tones':
                query['attributes.color'] = {'$in': ['brown', 'olive', 'rust']}
            # Add more color mappings as needed
        
        # Find matching products
        products = list(product_bp.mongo.db.products.find(query).limit(6))
        
        # If not enough matches, supplement with general products
        if len(products) < 6:
            additional_count = 6 - len(products)
            existing_ids = [p['_id'] for p in products]
            additional_products = list(
                product_bp.mongo.db.products.find({'_id': {'$nin': existing_ids}})
                .sort('created_at', -1)
                .limit(additional_count)
            )
            products.extend(additional_products)
        
        # Format products for response
        for product in products:
            _serialize_product(product)
        
        return jsonify({
            'products': products,
            'message': 'Personalized recommendations based on style profile'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get product by ID with style match information
@product_bp.route('/<product_id>/with-style-match', methods=['GET'])
@jwt_required()
def get_product_with_style_match(product_id):
    try:
        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Find the product
        product = product_bp.mongo.db.products.find_one({'_id': ObjectId(product_id)})
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Format product for response
        product = _serialize_product(product)
        
        # Get user's style profile if available
        user = product_bp.mongo.db.users.find_one({
            '_id': ObjectId(current_user_id)
        })
        
        style_match = {
            'has_style_profile': False,
            'match_score': 0,
            'match_reasons': []
        }
        
        if user and user.get('style_profile'):
            # Get the style profile
            style_profile = product_bp.mongo.db.style_profiles.find_one({
                '_id': user['style_profile']
            })
            
            if style_profile and style_profile.get('preferences'):
                style_match['has_style_profile'] = True
                preferences = style_profile['preferences']
                
                # Calculate match score and reasons
                match_score = 0
                match_reasons = []
                
                # Example matching logic - customize based on your preferences and product attributes
                # Match by category
                if 'occasion' in preferences and product.get('categories'):
                    if preferences['occasion'] == 'formal' and any(c in ['formal', 'business'] for c in product['categories']):
                        match_score += 25
                        match_reasons.append('Matches your formal style preference')
                    elif preferences['occasion'] == 'casual' and any(c in ['casual', 'everyday'] for c in product['categories']):
                        match_score += 25
                        match_reasons.append('Perfect for your casual style')
                
                # Match by color
                if 'color_palette' in preferences and product.get('attributes', {}).get('color'):
                    color = product['attributes']['color']
                    if preferences['color_palette'] == 'neutrals' and color in ['black', 'white', 'gray', 'beige']:
                        match_score += 25
                        match_reasons.append('Fits your neutral color palette')
                    elif preferences['color_palette'] == 'earth_tones' and color in ['brown', 'olive', 'rust']:
                        match_score += 25
                        match_reasons.append('Complements your earth tone preference')
                
                # Set final match info
                style_match['match_score'] = min(match_score, 100)  # Cap at 100%
                style_match['match_reasons'] = match_reasons
        
        return jsonify({
            'product': product,
            'style_match': style_match
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
