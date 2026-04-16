/**
 * generate-translations.mjs
 *
 * Uses DeepL API to generate complete translations for all 23 platform languages.
 * Source language: French (fr) — all keys, all sections.
 *
 * Usage:
 *   DEEPL_API_KEY=your-key node scripts/generate-translations.mjs
 *   # or (if key is in .env.local):
 *   node -r dotenv/config scripts/generate-translations.mjs dotenv_config_path=.env.local
 *
 * Outputs: src/lib/i18n/translations.ts
 */

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Load .env.local if no env var set ───────────────────────────────────────
if (!process.env.DEEPL_API_KEY || !process.env.GEMINI_API_KEY) {
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of env.split("\n")) {
      const [k, ...v] = line.split("=");
      if (k && v.length) process.env[k.trim()] = v.join("=").trim();
    }
  } catch {}
}

const DEEPL_KEY  = process.env.DEEPL_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!DEEPL_KEY) {
  console.error("❌  DEEPL_API_KEY is not set.");
  process.exit(1);
}
if (!GEMINI_KEY) {
  console.error("❌  GEMINI_API_KEY is not set.");
  process.exit(1);
}

const IS_FREE = DEEPL_KEY.endsWith(":fx");
const DEEPL_URL = IS_FREE
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

console.log(`🔑  Key type: ${IS_FREE ? "free" : "paid"}`);
console.log(`🌐  Endpoint: ${DEEPL_URL}`);

// ── Source strings (French) ──────────────────────────────────────────────────
const SOURCE = {
  nav: {
    pricing: "Tarifs",
    contact: "Contact",
    start: "Créer une réunion",
    features: "Fonctionnalités",
    enterprise: "Entreprise",
    login: "Se connecter",
    book: "Réservation",
  },
  hero: {
    badge: "Première plateforme de traduction vocale en temps réel",
    title: "Parlez votre langue. Le monde vous comprend.",
    titleAccent: "Instantanément.",
    subtitle:
      "Instant Talk supprime la barrière linguistique lors de vos réunions vidéo. Chaque participant parle dans sa langue maternelle, la plateforme traduit en temps réel avec une voix naturelle.",
    cta: "Commencer gratuitement",
    demo: "Voir la démo",
    trust: "Aucune carte bancaire requise, Essai 3 jours offert",
    stat1: "26 langues",
    stat1sub: "nativement supportées",
    stat2: "< 400 ms",
    stat2sub: "latence de traduction",
    stat3: "8,5 Mds",
    stat3sub: "de locuteurs couverts",
  },
  showcase: {
    title: "Une plateforme pensée pour la communication mondiale",
    text: "Réunions, rendez-vous, invitations, traduction vocale instantanée, sous-titres synchronisés, notes IA et résumé automatique réunis dans une seule expérience premium.",
  },
  problem: {
    badge: "Le problème mondial",
    title: "La barrière linguistique coûte des opportunités chaque jour.",
    text: "Dans un monde où 7 500 langues coexistent, la communication internationale reste fragmentée, lente et coûteuse. Les meilleurs talents sont inaccessibles. Les meilleurs partenaires restent silencieux. Les meilleures opportunités se perdent.",
    s1: "40% des réunions internationales échouent à cause de la barrière linguistique",
    s2: "Les erreurs de traduction coûtent 25 Mds€ par an aux entreprises mondiales",
    s3: "87% des professionnels ont perdu un contrat à cause d'un problème de langue",
    s4: "La solution existante ? Des traducteurs humains lents et coûteux.",
  },
  how: {
    badge: "Comment ça marche",
    title: "Trois étapes. Une expérience naturelle.",
    step1Title: "Vous parlez librement",
    step1Text:
      "Chaque participant rejoint la salle et parle dans sa langue maternelle, sans contrainte ni préparation.",
    step2Title: "L'IA traduit en temps réel",
    step2Text:
      "Instant Talk détecte la langue, transcrit la parole et génère une traduction avec une voix naturelle en moins de 400 ms.",
    step3Title: "Tout le monde comprend",
    step3Text:
      "Les participants entendent la traduction vocale et lisent les sous-titres synchronisés dans leur langue.",
  },
  proof: {
    p1Title: "Voix naturelle en temps réel",
    p1Text:
      "La plateforme restitue la conversation avec une voix fluide et naturelle pour garder un échange vivant.",
    p2Title: "Sous-titres synchronisés",
    p2Text:
      "Chaque participant suit la réunion avec des sous-titres traduits et parfaitement lisibles.",
    p3Title: "Latence ultra faible",
    p3Text:
      "La compréhension reste immédiate sans casser le rythme humain de la conversation.",
  },
  features: {
    title: "Tout ce qu'une plateforme mondiale doit faire. En mieux.",
    description:
      "Instant Talk réunit la communication mondiale, la traduction vocale bidirectionnelle, les sous-titres, les notes IA, les résumés automatiques, les rendez-vous et les invitations dans une seule plateforme.",
    f1Title: "Traduction vocale instantanée",
    f1Text:
      "Chaque participant parle dans sa langue, la plateforme traduit immédiatement pour tous les autres avec une voix naturelle.",
    f2Title: "Sous-titres traduits",
    f2Text:
      "Des sous-titres lisibles, fluides et synchronisés pour une compréhension immédiate dans votre langue.",
    f3Title: "26 langues nativement",
    f3Text:
      "De l'arabe au swahili en passant par le japonais et l'hindi, toutes les grandes langues mondiales couvertes.",
    f4Title: "Résumé automatique IA",
    f4Text:
      "Chaque réunion se termine avec un résumé clair, structuré et exploitable en quelques secondes.",
    f5Title: "Planification des réunions",
    f5Text:
      "Créez, organisez et partagez vos rendez-vous et réunions depuis une seule interface premium.",
    f6Title: "Sécurité enterprise",
    f6Text:
      "Chiffrement de bout en bout, conformité RGPD, infrastructure cloud premium et support dédié.",
  },
  usecases: {
    badge: "Cas d'usage",
    title: "Conçu pour chaque échange international.",
    u1Title: "Business international",
    u1Text:
      "Négociations, partenariats, boardrooms multilingues. Aucune langue n'est plus un obstacle.",
    u2Title: "Équipes distribuées",
    u2Text:
      "Vos équipes parlent leurs langues. Votre collaboration reste fluide et naturelle.",
    u3Title: "Formations et conférences",
    u3Text:
      "Organisez des événements internationaux où chaque participant comprend tout, en temps réel.",
    u4Title: "Santé et médical",
    u4Text:
      "Consultations multilingues avec une précision et une fluidité médicale exigeante.",
    u5Title: "Juridique et institutionnel",
    u5Text:
      "Audiences, médiations et consultations multilingues avec une précision rigoureuse.",
    u6Title: "Éducation et recherche",
    u6Text:
      "Cours, thèses et collaborations académiques sans frontières linguistiques.",
  },
  booking: {
    badge: "Réservation intelligente",
    title: "Planifiez vos rendez-vous internationaux sans friction.",
    text: "Instant Talk ne se limite pas à la réunion. La plateforme permet de proposer des créneaux, d'organiser des rendez-vous et de préparer des échanges multilingues professionnels.",
    cardTitle: "Calendrier de rendez-vous",
    cardSubtitle: "Semaine internationale",
    upcoming: "Réunion à venir",
    upcomingText:
      "Les participants reçoivent un lien unique, un horaire clair et une expérience multilingue prête dès l'ouverture de la réunion.",
  },
  invite: {
    badge: "Invitation intelligente",
    title: "Un lien d'invitation qui prépare déjà la réunion.",
    text: "Le lien d'invitation devient une porte d'entrée vers une réunion claire, professionnelle, multilingue et immédiatement compréhensible.",
    cardTitle: "Lien d'invitation",
    cardSubtitle: "Partage simple, accès immédiat",
    secure: "Lien sécurisé",
    copy: "Copier le lien",
    send: "Envoyer l'invitation",
    calendar: "Ajouter au calendrier",
  },
  compare: {
    badge: "Pourquoi Instant Talk va plus loin",
    title:
      "Plus qu'une réunion vidéo. Une vraie infrastructure de communication mondiale.",
    text: "Instant Talk est conçu pour résoudre un problème plus grand : permettre à n'importe qui dans le monde de se comprendre instantanément, naturellement et professionnellement.",
    c1Title: "Voix naturelle en temps réel",
    c1Text:
      "La traduction ne reste pas bloquée au texte. La conversation garde sa fluidité et sa présence.",
    c2Title: "Une seule plateforme",
    c2Text:
      "Réunions, rendez-vous, invitations, notes IA, résumés et communication mondiale réunis dans une seule interface.",
    c3Title: "Pensé pour le monde entier",
    c3Text:
      "La plateforme est conçue pour des échanges internationaux entre personnes, équipes, entreprises et institutions.",
  },
  testimonials: {
    badge: "Avis vérifiés",
    title: "Des professionnels du monde entier. Une seule conviction.",
    text: "Plus de 10 000 réunions multilingues. Une expérience unanime.",
  },
  pricing: {
    title: "Choisissez votre plan. Brisez les frontières linguistiques.",
    sub: "Commencez avec 3 jours d'essai gratuit. Aucune carte bancaire requise.",
    monthly: "Mensuel",
    annual: "Annuel",
    annualSave: "Économisez 20%",
    recommended: "Recommandé",
    popular: "Le plus populaire",
    included: "Inclus",
    perMonth: "/mois",
    perYear: "/an",
    premium: "Premium",
    premiumDesc: "Pour les particuliers et freelances internationaux",
    premiumCta: "Commencer l'essai gratuit",
    premiumPrice: "24",
    premiumPriceAnnual: "19",
    business: "Business",
    businessDesc: "Pour les équipes et entreprises en croissance internationale",
    businessCta: "Lancer l'essai Business",
    businessPrice: "99",
    businessPriceAnnual: "79",
    enterprise: "Enterprise",
    enterpriseDesc: "Pour les institutions et déploiements sur mesure",
    enterpriseCta: "Contacter l'équipe",
    enterprisePrice: "Sur mesure",
    trialText: "Essai 3 jours, Sans engagement",
    simulate: "Simuler l'accès",
    faqBadge: "FAQ",
    faqTitle: "Vos questions. Des réponses directes.",
    finalBadge: "Prêt à commencer ?",
    finalTitle: "La barrière linguistique n'est plus une fatalité.",
    finalText:
      "Rejoignez les équipes qui transforment leurs échanges internationaux avec Instant Talk.",
    finalCta1: "Démarrer gratuitement",
    finalCta2: "Parler à l'équipe",
    badge: "Tarifs transparents",
    accessRequired: "Un accès actif est requis pour rejoindre une salle.",
    startTrial: "Démarrer l'essai gratuit",
    annualBilled: "Soit {price}€/mois, facturé annuellement",
    featureCol: "Fonctionnalité",
    aiAssistant: "Assistant IA",
    aiTitle: "Trouvez le bon plan en 30 secondes",
    aiSub: "Décrivez votre usage et l'IA vous recommande la formule idéale.",
    aiBtn: "Analyser mon besoin",
    aiLoading: "Analyse…",
    aiSituation: "Votre situation",
    aiPlaceholder: "Ex : j'ai une équipe de 12 personnes en France, Allemagne et Japon. On fait 3 réunions internationales par semaine…",
    aiResult: "Recommandation IA",
    aiResultPlaceholder: "La recommandation apparaîtra ici après votre question.",
    premiumF1: "Traduction vocale instantanée",
    premiumF2: "Sous-titres traduits en temps réel",
    premiumF3: "26 langues nativement supportées",
    premiumF4: "Voix naturelle IA",
    premiumF5: "Réunions multilingues illimitées",
    premiumF6: "Expérience premium",
    businessF1: "Tout Premium inclus",
    businessF2: "Réunions d'équipe multilingues",
    businessF3: "Résumé automatique avancé",
    businessF4: "Prise de notes IA",
    businessF5: "Coordination internationale",
    businessF6: "Support prioritaire",
    businessF7: "Tableau de bord équipe",
    businessF8: "Jusqu'à 50 participants",
    enterpriseF1: "Tout Business inclus",
    enterpriseF2: "Déploiement personnalisé",
    enterpriseF3: "Accompagnement dédié",
    enterpriseF4: "Intégration API sur mesure",
    enterpriseF5: "SLA garanti 99,9%",
    enterpriseF6: "Support 24/7",
    enterpriseF7: "Participants illimités",
    enterpriseF8: "Audit de sécurité dédié",
    premiumLimit1: "5 participants / salle",
    premiumLimit2: "10 langues simultanées",
    businessLimit1: "50 participants / salle",
    businessLimit2: "20 langues simultanées",
    enterpriseLimit1: "Illimité",
    enterpriseLimit2: "26 langues",
    cmpF1: "Traduction vocale temps réel",
    cmpF2: "Sous-titres synchronisés",
    cmpF3: "26 langues supportées",
    cmpF4: "Voix naturelle IA",
    cmpF5: "Résumé automatique",
    cmpF6: "Prise de notes IA",
    cmpF7: "Tableau de bord équipe",
    cmpF8: "Support prioritaire",
    cmpF9: "Participants max / salle",
    cmpF10: "API & intégrations",
    cmpF11: "SLA garanti",
    cmpF12: "Support 24/7 dédié",
    faq1q: "Qu'est-ce qui différencie Instant Talk de Zoom ou Teams ?",
    faq1a: "Contrairement à Zoom ou Teams, Instant Talk est conçu dès l'origine pour la traduction vocale instantanée. Chaque participant parle sa langue et entend les autres dans la sienne, avec une voix naturelle, pas du texte.",
    faq2q: "Comment fonctionne l'essai gratuit ?",
    faq2a: "L'essai de 3 jours est entièrement fonctionnel, sans carte bancaire. Vous accédez à toutes les fonctionnalités Premium pour évaluer la valeur produit en conditions réelles.",
    faq3q: "Combien de participants peuvent rejoindre une salle ?",
    faq3a: "Plan Premium : jusqu'à 5 participants. Business : jusqu'à 50. Enterprise : illimité. La capacité s'adapte à votre usage réel.",
    faq4q: "La qualité de la traduction est-elle fiable ?",
    faq4a: "Oui. Instant Talk repose sur un moteur de traduction vocale de classe entreprise garantissant une précision élevée dans toutes les langues supportées, avec une latence inférieure à 400 ms.",
    faq5q: "Puis-je changer de plan à tout moment ?",
    faq5a: "Oui. Vous pouvez passer d'un plan à l'autre à tout moment depuis votre espace. Les changements prennent effet immédiatement.",
    faq6q: "Existe-t-il une option pour les grandes institutions ?",
    faq6a: "Oui. Le plan Enterprise est conçu pour les institutions, administrations et grandes entreprises qui ont besoin de déploiements sur mesure, d'une intégration API et d'un accompagnement dédié.",
  },
  stats: {
    meetings: "Réunions multilingues",
    languages: "Langues supportées",
    satisfaction: "Satisfaction client",
    latency: "Latence de traduction",
  },
  demo: {
    badge: "Démonstration produit",
    title: "Découvrez une réunion réellement multilingue.",
    text: "La plateforme ne traduit pas du texte. Elle transforme la conversation elle-même.",
    step1Title: "1. Chacun parle dans sa langue",
    step1Text:
      "L'appel démarre naturellement. Chaque intervenant garde sa langue, son rythme et sa manière de s'exprimer.",
    step2Title: "2. La plateforme restitue la voix",
    step2Text:
      "La traduction est restituée avec une voix naturelle pour garder une conversation vivante.",
    step3Title: "3. Tout reste structuré",
    step3Text:
      "Sous-titres synchronisés, résumé automatique, prise de notes IA et expérience claire pour tous les participants.",
    cta1: "Voir les offres",
    cta2: "Contacter l'équipe",
  },
  contact: {
    title: "Parlons de votre projet",
    sub: "Pour les entreprises, institutions et équipes qui veulent communiquer à l'échelle mondiale.",
    email: "Email professionnel",
    name: "Nom",
    company: "Entreprise",
    message: "Votre besoin",
    submit: "Envoyer la demande",
    direct: "Message envoyé",
    success: "Votre demande a bien été envoyée.",
  },
  trial: {
    title: "Votre essai gratuit est actif.",
    text: "Vous pouvez maintenant entrer dans une salle, tester l'expérience Instant Talk et voir comment la plateforme transforme une réunion multilingue en conversation naturelle.",
    cta1: "Ouvrir une salle",
    cta2: "Voir les offres",
  },
  success: {
    title: "Paiement confirmé",
    text: "Votre accès est maintenant actif. Vous pouvez créer, rejoindre et partager vos réunions avec une expérience premium pensée pour la communication mondiale.",
    cta1: "Ouvrir une salle",
    cta2: "Retour à l'accueil",
  },
  room: {
    badge: "Salle active",
    title:
      "Espace premium prêt pour les réunions internationales avec traduction vocale instantanée, sous-titres synchronisés et expérience structurée.",
    access: "Accès autorisé",
    inviteTitle: "Lien d'invitation",
    bookingTitle: "Réservation",
    bookingSubtitle: "Réunion programmée",
    navTitle: "Navigation",
    viewPricing: "Voir les offres",
    contactTeam: "Contacter l'équipe",
  },
  footer: {
    tagline:
      "La première plateforme de visioconférence avec traduction vocale instantanée.",
    product: "Produit",
    company: "Entreprise",
    legal: "Légal",
    features: "Fonctionnalités",
    pricing: "Tarifs",
    demo: "Démo",
    contact: "Contact",
    about: "À propos",
    blog: "Blog",
    careers: "Carrières",
    privacy: "Confidentialité",
    terms: "CGU",
    rights: "Tous droits réservés.",
  },
};

// ── Keys that should NOT be translated (prices, brand names, units) ──────────
const SKIP_KEYS = new Set([
  "pricing.premiumPrice",
  "pricing.premiumPriceAnnual",
  "pricing.businessPrice",
  "pricing.businessPriceAnnual",
  "pricing.premium",
  "pricing.business",
  "pricing.enterprise",
  "pricing.enterpriseF5",    // "SLA garanti 99,9%" — keep number
  "pricing.cmpF11",          // "SLA garanti"
  "pricing.aiAssistant",     // brand-adjacent label
  "hero.stat2",              // "< 400 ms"
  "nav.enterprise",          // keep "Enterprise" as brand term
  "stats.latency",           // "Latence de traduction" — keep unit consistent
]);

// ── Languages: DeepL code → app code ────────────────────────────────────────
// null = not supported by DeepL, will use English fallback
const LANGUAGES = {
  en: "EN-US",
  es: "ES",
  de: "DE",
  it: "IT",
  pt: "PT-PT",
  nl: "NL",
  zh: "ZH",
  ja: "JA",
  ar: "AR",
  ko: "KO",
  tr: "TR",
  ru: "RU",
  pl: "PL",
  sv: "SV",
  el: "EL",
  cs: "CS",
  ro: "RO",
  hu: "HU",
  bg: "BG",   // Bulgare — supporté DeepL
  da: "DA",   // Danois — supporté DeepL
  fi: "FI",   // Finnois — supporté DeepL
  sk: "SK",   // Slovaque — supporté DeepL
  no: "NB",   // Norvégien Bokmål — supporté DeepL (code NB)
  vi: "VI",   // Vietnamien — supporté DeepL
};

// ── Languages translated via Gemini (not supported by DeepL) ─────────────────
const GEMINI_LANGUAGES = {
  hi: "Hindi",
  sw: "Swahili",
  th: "Thai",
};

// ── Flatten nested object to { "section.key": value } ───────────────────────
function flatten(obj, prefix = "") {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(result, flatten(v, fullKey));
    } else {
      result[fullKey] = String(v);
    }
  }
  return result;
}

// ── Reconstruct nested object from flat keys ─────────────────────────────────
function unflatten(flat) {
  const result = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split(".");
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return result;
}

// ── Call DeepL for a batch of texts ─────────────────────────────────────────
async function translateBatch(texts, targetLang, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(DEEPL_URL, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: texts,
          source_lang: "FR",
          target_lang: targetLang,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        if (res.status === 429 && attempt < retries) {
          console.warn(`    ⚠️  Rate limited, waiting 5s... (attempt ${attempt})`);
          await sleep(5000);
          continue;
        }
        throw new Error(`DeepL ${res.status}: ${err}`);
      }

      const data = await res.json();
      return data.translations.map((t) => t.text);
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(2000 * attempt);
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Translate a batch of texts via Gemini (for DeepL-unsupported languages) ──
async function translateWithGemini(texts, targetLangName, retries = 3) {
  const prompt = `You are a professional translator. Translate each of the following French UI strings into ${targetLangName}.
Rules:
- Return ONLY a JSON array of translated strings, in the same order as the input.
- Keep placeholders like {price} exactly as-is.
- Keep numbers, percentages, and symbols unchanged.
- Keep brand names (Instant Talk, DeepL, IA) unchanged.
- Do not add explanations or extra text.

Input JSON array:
${JSON.stringify(texts)}

Return ONLY the translated JSON array:`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        if (res.status === 429 && attempt < retries) {
          console.warn(`    ⚠️  Gemini rate limited, waiting 10s... (attempt ${attempt})`);
          await sleep(10000);
          continue;
        }
        throw new Error(`Gemini ${res.status}: ${err}`);
      }
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      // Extract JSON array from response
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error(`Gemini bad response: ${raw.slice(0, 200)}`);
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed) || parsed.length !== texts.length) {
        throw new Error(`Gemini array length mismatch: got ${parsed.length}, expected ${texts.length}`);
      }
      return parsed.map(String);
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(3000 * attempt);
    }
  }
}

// ── Translate all keys for a language using Gemini ──────────────────────────
async function translateLanguageGemini(flatSource, langName, langCode) {
  const entries = Object.entries(flatSource);
  const toTranslate = entries.filter(([k]) => !SKIP_KEYS.has(k));
  const toKeep     = entries.filter(([k]) =>  SKIP_KEYS.has(k));

  const keys   = toTranslate.map(([k]) => k);
  const values = toTranslate.map(([, v]) => v);

  const BATCH = 40; // smaller batches for Gemini reliability
  const translated = [];

  for (let i = 0; i < values.length; i += BATCH) {
    const batch = values.slice(i, i + BATCH);
    process.stdout.write(`    chunk ${Math.floor(i / BATCH) + 1}/${Math.ceil(values.length / BATCH)}... `);
    const results = await translateWithGemini(batch, langName);
    translated.push(...results);
    console.log("✓");
    if (i + BATCH < values.length) await sleep(500);
  }

  const result = {};
  keys.forEach((k, i) => { result[k] = translated[i]; });
  toKeep.forEach(([k, v]) => { result[k] = v; });
  return result;
}

// ── Translate all keys for a language ───────────────────────────────────────
async function translateLanguage(flatSource, deeplCode, langCode) {
  const entries = Object.entries(flatSource);
  const toTranslate = entries.filter(([k]) => !SKIP_KEYS.has(k));
  const toKeep = entries.filter(([k]) => SKIP_KEYS.has(k));

  const keys = toTranslate.map(([k]) => k);
  const values = toTranslate.map(([, v]) => v);

  const BATCH = 50;
  const translated = [];

  for (let i = 0; i < values.length; i += BATCH) {
    const batch = values.slice(i, i + BATCH);
    process.stdout.write(`    chunk ${Math.floor(i / BATCH) + 1}/${Math.ceil(values.length / BATCH)}... `);
    const results = await translateBatch(batch, deeplCode);
    translated.push(...results);
    console.log("✓");
    if (i + BATCH < values.length) await sleep(300);
  }

  const result = {};
  keys.forEach((k, i) => { result[k] = translated[i]; });
  toKeep.forEach(([k, v]) => { result[k] = v; }); // keep untranslated as-is (FR value = same for all)
  return result;
}

// ── Serialize object to TypeScript literal ───────────────────────────────────
function serializeObj(obj, indent = 2) {
  const pad = " ".repeat(indent);
  const inner = Object.entries(obj)
    .map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
      if (v !== null && typeof v === "object") {
        return `${pad}${key}: ${serializeObj(v, indent + 2)}`;
      }
      // Escape backticks and backslashes in string values
      const safe = String(v).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
      return `${pad}${key}: "${safe.replace(/"/g, '\\"')}"`;
    })
    .join(",\n");
  return `{\n${inner}\n${" ".repeat(indent - 2)}}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Validate key first
  console.log("🔍  Validating DeepL API key...");
  try {
    const testRes = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: ["test"], source_lang: "FR", target_lang: "EN-US" }),
    });
    if (!testRes.ok) {
      const err = await testRes.text();
      console.error(`❌  DeepL key is invalid or account is restricted.\n    Response: ${err}`);
      console.error("\n    → Go to https://www.deepl.com/account/summary and copy your API key.");
      console.error("    → Update DEEPL_API_KEY in .env.local");
      console.error("    → Free keys end with :fx and use api-free.deepl.com");
      process.exit(1);
    }
    const data = await testRes.json();
    console.log(`✅  Key valid. Test translation: "test" → "${data.translations[0].text}"\n`);
  } catch (err) {
    console.error(`❌  Network error: ${err.message}`);
    process.exit(1);
  }

  const flatSource = flatten(SOURCE);
  const totalKeys = Object.keys(flatSource).length;
  console.log(`📋  Source: ${totalKeys} keys to translate\n`);

  const results = { fr: SOURCE };

  // English fallback (used by non-DeepL languages)
  let enFlat = null;

  for (const [langCode, deeplCode] of Object.entries(LANGUAGES)) {
    if (deeplCode === null) {
      // Non-DeepL language: will embed English later
      results[langCode] = null;
      continue;
    }

    console.log(`🌍  Translating → ${langCode.toUpperCase()} (${deeplCode})...`);
    try {
      const flat = await translateLanguage(flatSource, deeplCode, langCode);
      results[langCode] = unflatten(flat);
      if (langCode === "en") enFlat = flat;
      console.log(`   ✅  Done\n`);
    } catch (err) {
      console.error(`   ❌  Failed: ${err.message}. Skipping ${langCode}.\n`);
      results[langCode] = null;
    }
  }

  // Translate Gemini languages (hi, sw, th)
  for (const [langCode, langName] of Object.entries(GEMINI_LANGUAGES)) {
    console.log(`🤖  Translating → ${langCode.toUpperCase()} (${langName}) via Gemini...`);
    try {
      const flat = await translateLanguageGemini(flatSource, langName, langCode);
      results[langCode] = unflatten(flat);
      console.log(`   ✅  Done\n`);
    } catch (err) {
      console.error(`   ❌  Failed: ${err.message}. Using English fallback for ${langCode}.\n`);
      results[langCode] = enFlat ? unflatten(enFlat) : SOURCE;
    }
  }

  // ── Generate translations.ts ─────────────────────────────────────────────
  console.log("📝  Writing src/lib/i18n/translations.ts...");

  const lines = [
    `// AUTO-GENERATED by scripts/generate-translations.mjs`,
    `// Source: French (fr) via DeepL API`,
    `// Generated: ${new Date().toISOString()}`,
    `// DO NOT EDIT MANUALLY — re-run the script to update`,
    ``,
  ];

  // Write each language as a const
  for (const [langCode, obj] of Object.entries(results)) {
    if (!obj) continue;
    lines.push(`const ${langCode} = ${serializeObj(obj, 2)};`);
    lines.push(``);
  }

  // Write the exports
  lines.push(`export const translations: Record<string, Record<string, unknown>> = {`);
  for (const langCode of Object.keys(results)) {
    if (results[langCode]) lines.push(`  ${langCode},`);
  }
  lines.push(`};`);
  lines.push(``);

  // Write helper types/functions needed by LanguageContext
  lines.push(`// ── Type helpers ────────────────────────────────────────────────────────────`);
  lines.push(`export type TranslationKey = keyof typeof fr;`);
  lines.push(``);

  const outPath = join(ROOT, "src/lib/i18n/translations.ts");
  writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`✅  Written: ${outPath}`);
  console.log(`\n🎉  All done! ${Object.keys(results).filter(k => results[k]).length} languages generated.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
