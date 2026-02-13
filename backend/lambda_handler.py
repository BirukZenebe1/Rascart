import urllib.parse
import awsgi
from app import app


def _to_v1_event(event):
    # Translate HTTP API v2 event to REST API v1 shape expected by aws-wsgi.
    if event.get("version") != "2.0":
        return event

    headers = event.get("headers") or {}
    raw_query = event.get("rawQueryString") or ""
    query_params = dict(urllib.parse.parse_qsl(raw_query, keep_blank_values=True))
    method = (event.get("requestContext") or {}).get("http", {}).get("method", "GET")
    path = event.get("rawPath", "/")

    return {
        "httpMethod": method,
        "path": path,
        "headers": headers,
        "multiValueHeaders": {},
        "queryStringParameters": query_params or None,
        "multiValueQueryStringParameters": None,
        "body": event.get("body"),
        "isBase64Encoded": event.get("isBase64Encoded", False),
        "requestContext": event.get("requestContext", {}),
        "resource": path,
        "pathParameters": event.get("pathParameters"),
        "stageVariables": event.get("stageVariables"),
    }


def lambda_handler(event, context):
    return awsgi.response(
        app,
        _to_v1_event(event),
        context,
        base64_content_types={
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
        },
    )
