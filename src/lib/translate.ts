export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      targetLang,
      sourceLang
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.details || data?.error || "Translation failed");
  }

  return data;
}
