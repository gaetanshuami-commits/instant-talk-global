import os
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

def text_to_speech(text: str, voice_id: str):
    return client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
    )
