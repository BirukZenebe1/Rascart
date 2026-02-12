import awsgi
from app import app


def lambda_handler(event, context):
    return awsgi.response(
        app,
        event,
        context,
        base64_content_types={
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
        },
    )
