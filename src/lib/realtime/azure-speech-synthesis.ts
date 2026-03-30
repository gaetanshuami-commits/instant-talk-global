const VOICE_MAP: Record<string, string> = {
  en: 'en-US-AriaNeural',
  fr: 'fr-FR-DeniseNeural',
  es: 'es-ES-AlvaroNeural',
  de: 'de-DE-ConradNeural',
  it: 'it-IT-IsabellaNeural',
  pt: 'pt-BR-FranciscaNeural',
  ja: 'ja-JP-NanamiNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
  ru: 'ru-RU-DariyaNeural',
  ko: 'ko-KR-SunHiNeural',
};

export async function synthesizeAzureSpeech(
  text: string,
  languageCode: string,
  voiceId?: string
): Promise<ArrayBuffer> {
  const voice = voiceId || VOICE_MAP[languageCode] || VOICE_MAP['en'];

  const ssml = `
    <speak version="1.0" xml:lang="${languageCode}">
      <voice name="${voice}">
        <prosody pitch="0%" rate="1.0">
          ${escapeXml(text)}
        </prosody>
      </voice>
    </speak>
  `;

  const response = await fetch('/api/azure-tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ssml,
      language: languageCode,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Azure TTS failed: ${response.status} ${response.statusText}`
    );
  }

  return response.arrayBuffer();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
