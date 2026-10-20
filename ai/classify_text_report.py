
import json
import sys

from sentence_transformers import SentenceTransformer, util


MODEL_NAME = "all-MiniLM-L6-v2"

CATEGORY_LABELS = {
    "pipe_burst": (
        "water actively erupting and spraying upward from a "
        "ruptured underground pipe"
    ),
    "water_main_leak": (
        "water slowly bubbling up and pooling on the ground "
        "from a cracked pipe without spraying"
    ),
    "drain_sewer_overflow": (
        "dirty sewage water and debris overflowing from a drain "
        "or open manhole"
    ),
    "waterlogging": (
        "a road submerged under standing floodwater after heavy rain"
    ),
    "wet_road_rain": (
        "a wet rain-slicked road with puddles but no major flooding"
    ),
    "normal": (
        "a dry road with no leak, flooding, standing water, or puddles"
    ),
}


def _heuristic_classify(desc_lower):
    if any(k in desc_lower for k in ["burst", "ruptur", "spray", "gush", "fountain"]):
        return {"classification": "pipe_burst", "confidence": 0.85, "leak_probability": 0.95}
    if any(k in desc_lower for k in ["sewer", "sewage", "manhole", "overflow", "drain"]):
        return {"classification": "drain_sewer_overflow", "confidence": 0.80, "leak_probability": 0.80}
    if any(k in desc_lower for k in ["leak", "bubbl", "pipe", "trickl"]):
        return {"classification": "water_main_leak", "confidence": 0.75, "leak_probability": 0.85}
    if any(k in desc_lower for k in ["waterlog", "flood", "submerg", "standing water"]):
        return {"classification": "waterlogging", "confidence": 0.75, "leak_probability": 0.60}
    if any(k in desc_lower for k in ["rain", "puddle", "wet road", "slick"]):
        return {"classification": "wet_road_rain", "confidence": 0.70, "leak_probability": 0.30}
    return {"classification": "normal", "confidence": 0.50, "leak_probability": 0.10}


def classify_report(description):
    if not description or not description.strip():
        raise ValueError("Report description cannot be empty.")

    clean_desc = description.strip()
    try:
        # Try local cached model first to avoid network latency/hangs
        model = SentenceTransformer(MODEL_NAME, local_files_only=True)

        category_names = list(CATEGORY_LABELS.keys())
        category_descriptions = list(CATEGORY_LABELS.values())

        description_embedding = model.encode(
            clean_desc,
            convert_to_tensor=True
        )

        category_embeddings = model.encode(
            category_descriptions,
            convert_to_tensor=True
        )

        similarities = util.cos_sim(
            description_embedding,
            category_embeddings
        )[0]

        best_index = int(similarities.argmax().item())
        category = category_names[best_index]

        # Similarity is a ranking score, not a calibrated probability.
        confidence = max(
            0.0,
            min(1.0, float(similarities[best_index].item()))
        )

        leak_anchor = model.encode(
            "urgent pressurized water main pipe burst leaking "
            "flowing from the ground"
        )
        rain_anchor = model.encode(
            "standing puddles and waterlogged flooded street "
            "after heavy rainfall"
        )

        leak_similarity = float(
            util.cos_sim(description_embedding, leak_anchor).item()
        )
        rain_similarity = float(
            util.cos_sim(description_embedding, rain_anchor).item()
        )

        # An initial text-based estimate, not a calibrated probability.
        leak_probability = max(
            0.0,
            min(1.0, (leak_similarity - rain_similarity) + 0.5)
        )

        return {
            "classification": category,
            "confidence": round(confidence, 3),
            "leak_probability": round(leak_probability, 3),
        }
    except Exception as exc:
        sys.stderr.write(f"Warning: Model classification failed ({exc}), falling back to heuristic.\n")
        return _heuristic_classify(clean_desc.lower())


if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("Provide a report description as an argument.")

        description = " ".join(sys.argv[1:])
        result = classify_report(description)
        print(json.dumps(result))

    except Exception as exc:
        # Print to stdout so the backend can parse a structured error response (BUG-09)
        error_payload = json.dumps({"error": str(exc), "classification": "normal", "leak_probability": 0.5})
        print(error_payload)
        # Also log to stderr for human-readable diagnostics
        sys.stderr.write(f"classify_text_report error: {exc}\n")
        sys.exit(1)
