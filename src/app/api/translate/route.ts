import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();
    const deeplKey = process.env.DEEPL_API_KEY;

    if (!deeplKey) return NextResponse.json({ error: "Clé DeepL manquante" }, { status: 500 });

    const isFree = deeplKey.endsWith(":fx");
    const url = isFree ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";

    // DeepL demande des codes spécifiques pour l'anglais et le portugais
    let lang = targetLang.toUpperCase();
    if (lang === "EN") lang = "EN-US";
    if (lang === "PT") lang = "PT-PT";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${deeplKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: [text], target_lang: lang })
    });

    if (!res.ok) throw new Error("Erreur serveur DeepL");
    const data = await res.json();
    
    return NextResponse.json({ translatedText: data.translations[0].text });
  } catch (error) {
    return NextResponse.json({ error: "Échec traduction" }, { status: 500 });
  }
}
