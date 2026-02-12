from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import datetime
import openai
import os
import traceback
 
# Initialize blueprint
style_bp = Blueprint('style', __name__)
 
# Create or update style profile
@style_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_or_update_profile():
    try:
        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Get profile data from request
        data = request.get_json()
        
        print(f"Received style preferences: {data['preferences']}")
        
        # Check if required fields are present
        if 'preferences' not in data:
            return jsonify({"error": "Missing preferences data"}), 400
        
        # Get or create style profile
        existing_profile = style_bp.mongo.db.style_profiles.find_one(
            {'user_id': ObjectId(current_user_id)}
        )
        
        # Generate a simple mock analysis first
        mock_analysis = {
            "description": "Your style combines formal and minimalist elements with neutral colors and subtle patterns. This creates a sophisticated, professional look that's perfect for work environments while maintaining versatility.",
            "keywords": ["formal", "minimalist", "professional", "sophisticated", "versatile"],
            "generated_at": datetime.datetime.now().isoformat()
        }
        
        if existing_profile:
            # Update existing profile
            style_bp.mongo.db.style_profiles.update_one(
                {'_id': existing_profile['_id']},
                {'$set': {
                    'preferences': data['preferences'],
                    'ai_analysis': mock_analysis,
                    'updated_at': datetime.datetime.now()
                }}
            )
            profile_id = existing_profile['_id']
        else:
            # Create new profile
            from models import create_style_profile
            new_profile = create_style_profile(
                user_id=ObjectId(current_user_id),
                preferences=data['preferences'],
                ai_analysis=mock_analysis
            )
            result = style_bp.mongo.db.style_profiles.insert_one(new_profile)
            profile_id = result.inserted_id

        # Update user personalization flags and style profile reference
        style_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {
                'style_profile': profile_id,
                'personalization_state': 'personalized',
                'is_personalized': True
            }}
        )
        
        return jsonify({
            "message": "Style profile saved successfully",
            "profile_id": str(profile_id),
            "ai_analysis": mock_analysis,
            "personalization_state": "personalized",
            "is_personalized": True
        }), 200
        
    except Exception as e:
        print(f"Error in create_or_update_profile: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
 
# Get user's style profile
@style_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Find profile in database
        profile = style_bp.mongo.db.style_profiles.find_one(
            {'user_id': ObjectId(current_user_id)}
        )
        
        if not profile:
            return jsonify({
                "message": "No style profile found",
                "has_profile": False
            }), 200
        
        # Format for response
        profile['_id'] = str(profile['_id'])
        profile['user_id'] = str(profile['user_id'])
        
        # Convert datetime objects
        if 'created_at' in profile:
            profile['created_at'] = profile['created_at'].isoformat()
        if 'updated_at' in profile:
            profile['updated_at'] = profile['updated_at'].isoformat()
        
        return jsonify({
            "profile": profile,
            "has_profile": True
        }), 200
        
    except Exception as e:
        print(f"Error in get_profile: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@style_bp.route('/test-openai', methods=['GET'])
def test_openai():
    """Test endpoint to diagnose OpenAI API issues"""
    try:
        print("=== BEGINNING OPENAI TEST ===")
        
        # Check OpenAI version
        print(f"OpenAI version: {openai.__version__}")
        
        # Check for API key
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return jsonify({"error": "OpenAI API key not found in environment variables"}), 400
        print(f"API key found: {api_key[:5]}...{api_key[-4:]}")
        
        # Try creating a client
        print("Creating OpenAI client...")
        client = openai.OpenAI(api_key=api_key)
        print("Client created successfully")
        
        # Make a simple API call
        print("Making test API call...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=10
        )
        print("API call successful!")
        
        # Try accessing the response
        content = response.choices[0].message.content
        print(f"Response content: {content}")
        
        return jsonify({
            "success": True,
            "message": content,
            "note": "OpenAI is working correctly!"
        })
        
    except Exception as e:
        print("==== ERROR IN OPENAI TEST ====")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "note": "See server logs for detailed traceback"
        }), 500
 
# Function to generate AI analysis of style preferences
def generate_ai_analysis(preferences):
    try:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not found")
        
        # Updated client initialization
        client = openai.OpenAI(
            api_key=api_key,
            timeout=30.0  # Add timeout
        )
        
        # Updated message structure
        messages = [
            {
                "role": "system",
                "content": "You are a professional fashion stylist and personal shopper analyzing style preferences."
            },
            {
                "role": "user",
                "content": create_style_prompt(preferences)
            }
        ]
        
        # Make API call with error handling
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                presence_penalty=0.6
            )
            
            analysis_text = response.choices[0].message.content.strip()
            
            return {
                "description": analysis_text,
                "keywords": extract_style_keywords(analysis_text),
                "generated_at": datetime.datetime.now().isoformat()
            }
            
        except openai.APIError as e:
            print(f"OpenAI API Error: {str(e)}")
            raise
            
    except Exception as e:
        print(f"Error in generate_ai_analysis: {str(e)}")
        traceback.print_exc()
        return {
            "description": "Unable to generate style analysis. Please try again later.",
            "error": str(e),
            "keywords": ["error"]
        }
 
# Helper function to create prompt from preferences
def create_style_prompt(preferences):
    prompt = "Based on the following style preferences, provide a comprehensive analysis of this person's style profile:\n\n"
    
    for category, value in preferences.items():
        prompt += f"- {category.replace('_', ' ').title()}: {value}\n"
    
    prompt += "\nPlease provide:\n"
    prompt += "1. A summary of their overall style aesthetic\n"
    prompt += "2. Key style elements that define their look\n"
    prompt += "3. Recommendations for clothing items and accessories\n"
    prompt += "4. Color palette suggestions\n"
    prompt += "5. Brands or stores that would match their style\n"
    
    return prompt
 
# Helper function to extract key style keywords
def extract_style_keywords(analysis_text):
    # This is a simple implementation - could be enhanced with NLP
    common_style_words = [
        "casual", "formal", "bohemian", "preppy", "vintage", "minimalist",
        "classic", "edgy", "streetwear", "elegant", "sophisticated",
        "athletic", "sporty", "comfortable", "trendy", "conservative"
    ]
    
    found_keywords = []
    for word in common_style_words:
        if word.lower() in analysis_text.lower():
            found_keywords.append(word)
    
    # Ensure we have at least a few keywords
    if len(found_keywords) < 3:
        # Default fallbacks
        found_keywords = ["personalized", "balanced", "thoughtful"]
    
    return found_keywords[:5]  # Return up to 5 keywords

@style_bp.route('/test-profile', methods=['POST'])
@jwt_required()
def test_profile_creation():
    """Test endpoint for basic profile creation without OpenAI"""
    try:
        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Simple test data
        test_preferences = {
            "occasion": "formal",
            "style_influence": "minimalist",
            "color_palette": "neutrals"
        }
        
        # Very simple mock analysis
        simple_analysis = {
            "description": "This is a test analysis.",
            "keywords": ["test", "simple", "mock"],
            "generated_at": datetime.datetime.now().isoformat()
        }
        
        # Create a new profile directly
        from models import create_style_profile
        new_profile = create_style_profile(
            user_id=ObjectId(current_user_id),
            preferences=test_preferences,
            ai_analysis=simple_analysis
        )
        
        # Print for debugging
        print("Created new profile object:")
        print(new_profile)
        
        # Insert into database
        result = style_bp.mongo.db.style_profiles.insert_one(new_profile)
        profile_id = result.inserted_id
        
        # Update user document
        style_bp.mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {
                'style_profile': profile_id,
                'personalization_state': 'personalized',
                'is_personalized': True
            }}
        )
        
        return jsonify({
            "success": True,
            "message": "Test profile created successfully",
            "profile_id": str(profile_id)
        })
        
    except Exception as e:
        print("ERROR IN TEST PROFILE CREATION:")
        print(str(e))
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }), 500
