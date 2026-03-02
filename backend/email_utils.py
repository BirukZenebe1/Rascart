import os
import boto3

def send_email(to_address, subject, body_text, body_html=None):
    region = os.environ.get("SES_REGION", "eu-central-1")
    from_address = os.environ.get("SES_FROM_EMAIL")
    from_name = (os.environ.get("SES_FROM_NAME") or "Rascart").strip()
    reply_to = (os.environ.get("SES_REPLY_TO") or from_address or "").strip()
    if not from_address:
        raise RuntimeError("SES_FROM_EMAIL is required")

    client = boto3.client("ses", region_name=region)
    source = f"{from_name} <{from_address}>"

    body_payload = {
        "Text": {"Data": body_text, "Charset": "UTF-8"}
    }
    if body_html:
        body_payload["Html"] = {"Data": body_html, "Charset": "UTF-8"}

    request_payload = {
        "Source": source,
        "Destination": {"ToAddresses": [to_address]},
        "Message": {
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": body_payload,
        },
    }
    if reply_to:
        request_payload["ReplyToAddresses"] = [reply_to]

    response = client.send_email(**request_payload)
    return response
