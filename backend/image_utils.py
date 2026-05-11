import os
import base64
import binascii
from datetime import datetime

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_IMAGE_BYTES = 3 * 1024 * 1024
IMAGE_MIME_BY_SIGNATURE = (
    (b'\x89PNG\r\n\x1a\n', 'image/png'),
    (b'\xff\xd8\xff', 'image/jpeg'),
    (b'GIF87a', 'image/gif'),
    (b'GIF89a', 'image/gif'),
    (b'RIFF', 'image/webp'),
)

def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _detect_image_mime(image_data):
    for signature, mime_type in IMAGE_MIME_BY_SIGNATURE:
        if image_data.startswith(signature):
            if mime_type == 'image/webp' and image_data[8:12] != b'WEBP':
                return None
            return mime_type
    return None

def normalize_base64_image(base64_string, max_bytes=MAX_IMAGE_BYTES):
    if not base64_string or not isinstance(base64_string, str):
        return None

    raw_payload = base64_string
    if 'base64,' in raw_payload:
        raw_payload = raw_payload.split('base64,', 1)[1]
    raw_payload = raw_payload.strip()
    if not raw_payload:
        return None

    try:
        image_data = base64.b64decode(raw_payload, validate=True)
    except (binascii.Error, ValueError):
        return None

    if len(image_data) > max_bytes:
        return None

    mime_type = _detect_image_mime(image_data)
    if not mime_type:
        return None

    clean_base64 = base64.b64encode(image_data).decode('ascii')
    return {
        "bytes": image_data,
        "data_url": f"data:{mime_type};base64,{clean_base64}",
        "mime_type": mime_type,
    }

def save_base64_image(base64_string, filename_prefix='profile'):
    """
    Save a base64 encoded image to the uploads folder
    Returns the filename if successful, None otherwise
    """
    try:
        normalized = normalize_base64_image(base64_string)
        if not normalized:
            return None

        if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            return normalized["data_url"]

        # Create uploads directory if it doesn't exist
        upload_folder = os.path.join(os.path.dirname(__file__), 'uploads', 'profiles')
        os.makedirs(upload_folder, exist_ok=True)

        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{filename_prefix}_{timestamp}.png"
        filepath = os.path.join(upload_folder, filename)
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(normalized["bytes"])
        
        # Return the relative path that can be served
        return f"/uploads/profiles/{filename}"
    
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

def delete_image(image_path):
    """Delete an image file"""
    try:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting image: {e}")
        return False
