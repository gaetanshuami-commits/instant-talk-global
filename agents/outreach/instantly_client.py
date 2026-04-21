import os
import requests

INSTANTLY_API_KEY = os.getenv("INSTANTLY_API_KEY")

def send_email(to: str, subject: str, body: str):
    url = "https://api.instantly.ai/api/v1/send"
    headers = {
        "Authorization": f"Bearer {INSTANTLY_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "to": to,
        "subject": subject,
        "body": body,
    }
    response = requests.post(url, json=data, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()
