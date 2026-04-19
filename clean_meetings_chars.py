from pathlib import Path

p = Path("src/app/dashboard/meetings/page.tsx")
s = p.read_text(encoding="utf-8", errors="replace")

repl = {
    "R\u00c3\u00a9union": "Réunion",
    "r\u00c3\u00a9union": "réunion",
    "Cr\u00c3\u00a9ation": "Création",
    "cr\u00c3\u00a9ation": "création",
    "Cr\u00c3\u00a9e": "Crée",
    "cr\u00c3\u00a9e": "crée",
    "succ\u00c3\u00a8s": "succès",
    "r\u00c3\u00a9seau": "réseau",
    "v\u00c3\u00a9rifiez": "vérifiez",
    "donn\u00c3\u00a9es": "données",
    "pass\u00c3\u00a9es": "passées",
    "Invit\u00c3\u00a9s": "Invités",
    "invit\u00c3\u00a9": "invité",
    "instantan\u00c3\u00a9e": "instantanée",
    "Planifi\u00c3\u00a9s": "Planifiés",
    "s\u00c3\u00a9lectionn\u00c3\u00a9": "sélectionné",
    "Copi\u00c3\u00a9": "Copié",
    "copi\u00c3\u00a9": "copié",
    "\u00c3  venir": "à venir",
    "\u00c3 ": "à",
    "\u00e2\u20ac\u201d": "—",
    "\u00e2\u20ac\u00a6": "...",
    "\u00e2\u2020\u2019": "?",
    "\u00e2\u201a\u00ac": "€",
}

for a, b in repl.items():
    s = s.replace(a, b)

p.write_text(s, encoding="utf-8")
print("OK: cleaned", p)
