import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. LE SCAN : On demande à Google la liste exacte des modèles que TA clé a le droit d'utiliser
    const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResp.json();

    if (listData.error) {
        throw new Error("Clé API Google invalide : " + listData.error.message);
    }

    // 2. LA SÉLECTION AUTOMATIQUE : On cherche le premier modèle "flash" ou "pro" capable de générer du texte
    const availableModels = listData.models || [];
    const validModel = availableModels.find((m: any) => 
        m.supportedGenerationMethods.includes("generateContent") && 
        (m.name.includes("flash") || m.name.includes("pro"))
    );

    if (!validModel) {
        throw new Error("Aucun modèle IA compatible trouvé sur ton compte Google.");
    }

    const modelToUse = validModel.name; // Google va nous donner automatiquement le bon nom (ex: models/gemini-3.0-flash)

    // 3. LA TRADUCTION avec le modèle parfait
    const prompt = `Traduire le texte suivant en ${targetLanguage} en gardant un ton naturel et fluide : "${text}"`;
    
    const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }] 
      })
    });

    const geminiData = await geminiResp.json();
    
    if (geminiData.error) {
       throw new Error("Erreur Gemini pendant la traduction : " + geminiData.error.message);
    }
    
    const translatedText = geminiData.candidates[0].content.parts[0].text;

    // 4. LA VOIX via ElevenLabs
    const ttsResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: { 
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        text: translatedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      })
    });

    if (!ttsResp.ok) {
        const errText = await ttsResp.text();
        throw new Error(`Erreur ElevenLabs: ${ttsResp.status} - ${errText}`);
    }

    const audioBuffer = await ttsResp.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ translatedText, audio: base64Audio, usedModel: modelToUse });
  } catch (error: any) {
    console.error("Erreur Pipeline:", error);
    return NextResponse.json({ error: error.message || "Erreur pipeline IA" }, { status: 500 });
  }
}