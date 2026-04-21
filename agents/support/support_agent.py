"""
Instant Talk — LangGraph Translation Support Agent
Monitors translation logs, detects low-confidence errors, proposes corrections.
Usage: python -m agents.support.support_agent [--log-file path] [--threshold 0.8]
"""

import os
import json
import logging
from typing import TypedDict, Optional
from dotenv import load_dotenv

load_dotenv("agents/.env")
load_dotenv(".env.local", override=False)
load_dotenv(".env.vercel.local", override=False)

log = logging.getLogger("support_agent")

# ── State schema ───────────────────────────────────────────────────────────────

class TranslationState(TypedDict):
    source_text:     str
    translated_text: str
    source_lang:     str
    target_lang:     str
    confidence:      float
    error:           Optional[str]
    action:          Optional[str]
    correction:      Optional[str]
    patch_ready:     bool

CONFIDENCE_THRESHOLD = float(os.getenv("TRANSLATION_CONFIDENCE_THRESHOLD", "0.8"))

# ── Node functions ─────────────────────────────────────────────────────────────

def check_confidence(state: TranslationState) -> TranslationState:
    confidence = state.get("confidence", 1.0)
    if confidence < CONFIDENCE_THRESHOLD:
        return {**state, "action": "review", "error": f"Low confidence: {confidence:.2f} < {CONFIDENCE_THRESHOLD}"}
    return {**state, "action": "ok", "error": None}

def analyze_error(state: TranslationState) -> TranslationState:
    text   = state.get("translated_text", "")
    source = state.get("source_text", "")
    error_type = "unknown"

    if not text.strip():
        error_type = "empty_translation"
    elif text == source:
        error_type = "untranslated_passthrough"
    elif len(text) < len(source) * 0.3:
        error_type = "truncated_translation"
    elif any(c in text for c in ["[ERROR]", "[FALLBACK]", "undefined", "null"]):
        error_type = "api_error_in_text"
    elif state.get("confidence", 1.0) < 0.5:
        error_type = "very_low_confidence"

    return {**state, "error": error_type}

def propose_correction(state: TranslationState) -> TranslationState:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        log.warning("No GEMINI_API_KEY — skipping LLM correction")
        return {**state, "correction": None, "patch_ready": False}

    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = (
            f"Translate from {state['source_lang']} to {state['target_lang']} "
            f"accurately and naturally. Return only the translation.\n\nText: {state['source_text']}"
        )
        response = model.generate_content(prompt, generation_config={"temperature": 0, "max_output_tokens": 500})
        correction = response.text.strip()
        log.info("Correction: '%s...' → '%s...'", state["source_text"][:40], correction[:40])
        return {**state, "correction": correction, "patch_ready": True}
    except Exception as exc:
        log.error("Correction failed: %s", exc)
        return {**state, "correction": None, "patch_ready": False}

def route_action(state: TranslationState) -> str:
    return "analyze" if state.get("action") == "review" else "done"

def finalize(state: TranslationState) -> TranslationState:
    return {**state, "patch_ready": False}

# ── Graph construction ─────────────────────────────────────────────────────────

def build_graph():
    try:
        from langgraph.graph import StateGraph, END  # type: ignore
    except ImportError:
        log.warning("langgraph not installed — returning None")
        return None

    graph = StateGraph(TranslationState)
    graph.add_node("check_confidence", check_confidence)
    graph.add_node("analyze", analyze_error)
    graph.add_node("propose_correction", propose_correction)
    graph.add_node("done", finalize)
    graph.set_entry_point("check_confidence")
    graph.add_conditional_edges("check_confidence", route_action, {
        "analyze": "analyze",
        "done":    "done",
    })
    graph.add_edge("analyze", "propose_correction")
    graph.add_edge("propose_correction", END)
    graph.add_edge("done", END)
    return graph.compile()

support_agent = build_graph()

# ── Batch log monitor ──────────────────────────────────────────────────────────

def monitor_log_file(path: str, threshold: float = CONFIDENCE_THRESHOLD) -> list:
    """
    Read a JSONL translation log, run each entry through the agent.
    Expected line format:
      {"source": "...", "translated": "...", "src_lang": "fr", "tgt_lang": "en", "confidence": 0.72}
    """
    if support_agent is None:
        log.error("Support agent unavailable (langgraph not installed)")
        return []

    patches = []
    try:
        with open(path) as f:
            for i, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                state: TranslationState = {
                    "source_text":     entry.get("source", ""),
                    "translated_text": entry.get("translated", ""),
                    "source_lang":     entry.get("src_lang", "fr"),
                    "target_lang":     entry.get("tgt_lang", "en"),
                    "confidence":      float(entry.get("confidence", 1.0)),
                    "error":           None,
                    "action":          None,
                    "correction":      None,
                    "patch_ready":     False,
                }

                result = support_agent.invoke(state)
                if result.get("patch_ready"):
                    patches.append({
                        "line":           i + 1,
                        "original":       result["source_text"],
                        "bad_translation": result["translated_text"],
                        "correction":     result["correction"],
                        "error_type":     result.get("error"),
                        "confidence":     result["confidence"],
                    })

    except FileNotFoundError:
        log.error("Log file not found: %s", path)

    return patches


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    parser = argparse.ArgumentParser(description="Instant Talk Translation Support Agent")
    parser.add_argument("--log-file", default="agents/support/translation.log")
    parser.add_argument("--threshold", type=float, default=CONFIDENCE_THRESHOLD)
    args = parser.parse_args()

    patches = monitor_log_file(args.log_file, args.threshold)
    print(f"\n=== Support Agent Report — {len(patches)} patches ===")
    for p in patches:
        print(f"\n[Line {p['line']}] conf={p['confidence']:.2f} err={p['error_type']}")
        print(f"  Original  : {p['original'][:80]}")
        print(f"  Bad       : {p['bad_translation'][:80]}")
        print(f"  Fix       : {(p['correction'] or 'N/A')[:80]}")

    if patches:
        out = "agents/support/patches.json"
        with open(out, "w") as f:
            json.dump(patches, f, indent=2, ensure_ascii=False)
        print(f"\nPatches → {out}")
