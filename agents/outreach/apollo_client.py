import os
import requests

APOLLO_API_KEY = os.getenv("APOLLO_API_KEY")

def search_companies(keyword: str):
    url = "https://api.apollo.io/v1/mixed_companies/search"
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
    }
    data = {
        "api_key": APOLLO_API_KEY,
        "q_organization_keyword_tags": [keyword],
    }
    response = requests.post(url, json=data, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()
