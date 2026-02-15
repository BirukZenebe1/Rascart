import os
import boto3

def send_email(to_address, subject, body_text):
    region = os.environ.get("SES_REGION", "eu-central-1")
    from_address = os.environ.get("SES_FROM_EMAIL")
    if not from_address:
        raise RuntimeError("SES_FROM_EMAIL is required")

    client = boto3.client("ses", region_name=region)

    response = client.send_email(
        Source=from_address,
        Destination={"ToAddresses": [to_address]},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {"Text": {"Data": body_text, "Charset": "UTF-8"}},
        },
    )
    return response
