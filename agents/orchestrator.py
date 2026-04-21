import os
from dotenv import load_dotenv

load_dotenv('agents/.env')

from agents.outreach.apollo_client import search_companies
from agents.outreach.instantly_client import send_email
from agents.voice.voice_agent import text_to_speech
from agents.voice.vapi_agent import create_call

def run_pipeline():
    print('=== Instant Talk AI Team Orchestrator ===')

    apollo_key = os.getenv('APOLLO_API_KEY')
    instantly_key = os.getenv('INSTANTLY_API_KEY')
    eleven_key = os.getenv('ELEVENLABS_API_KEY')
    vapi_key = os.getenv('VAPI_API_KEY')

    print(f'Apollo configured: {bool(apollo_key)}')
    print(f'Instantly configured: {bool(instantly_key)}')
    print(f'ElevenLabs configured: {bool(eleven_key)}')
    print(f'Vapi configured: {bool(vapi_key)}')

    print('Agents loaded successfully.')

if __name__ == '__main__':
    run_pipeline()
