import os
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
from PIL import Image

print("Loading AI Models (this will take a minute on the first run)...")

# 1. Lightweight text embeddings model (~80MB)
text_model = SentenceTransformer('all-MiniLM-L6-v2')

# 2. Zero-shot vision model (~600MB)
vision_classifier = pipeline(
    "zero-shot-image-classification", 
    model="openai/clip-vit-base-patch32"
)

def get_text_score(description):
    """Scores how closely the text describes a physical pipe leak vs rain."""
    query_emb = text_model.encode(description)
    
    # Define our anchors
    leak_anchor = text_model.encode("urgent pressurized water main pipe burst leaking flowing from ground")
    rain_anchor = text_model.encode("stagnant puddles waterlogged flooded street after heavy rainfall")
    
    leak_sim = util.cos_sim(query_emb, leak_anchor).item()
    rain_sim = util.cos_sim(query_emb, rain_anchor).item()
    
    # Normalize score: Closer to 1.0 means it's definitely a leak
    score = max(0.0, min(1.0, (leak_sim - rain_sim) + 0.5))
    return round(score, 2)

def get_vision_score(image_path):
    """Uses zero-shot classification to detect leaks in photos."""
    # Fallback gracefully if the image hasn't been downloaded yet
    if not os.path.exists(image_path):
        return 0.5 
        
    try:
        image = Image.open(image_path)
        labels = [
            "a bursting water pipe", 
            "a flooded street from rain", 
            "normal dry road", 
            "trash on street"
        ]
        results = vision_classifier(image, candidate_labels=labels)
        
        # Extract the confidence score for the pipe leak label
        for res in results:
            if res['label'] == "a bursting water pipe":
                return round(res['score'], 2)
        return 0.0
    except Exception as e:
        print(f"Warning: Could not process {image_path}")
        return 0.5

def verify_report(description, image_path):
    """Combines text and vision scores into a final leak probability."""
    text_score = get_text_score(description)
    vision_score = get_vision_score(image_path)
    
    # Weight vision slightly higher than text (60/40 split)
    final_probability = (vision_score * 0.6) + (text_score * 0.4)
    return round(final_probability, 2)

if __name__ == "__main__":
    # Quick Test Run
    test_desc = "Critical emergency situation: An underground water pipe has completely failed."
    test_img = "images/burst_02.jpg"
    
    print("\n--- Testing Leak Detection Module ---")
    print(f"Description: '{test_desc}'")
    print(f"Text Score: {get_text_score(test_desc)}")
    print(f"Vision Score (Fallback to 0.5 if image is missing): {get_vision_score(test_img)}")
    print(f"Combined Probability: {verify_report(test_desc, test_img)}")

# --- Multi-category classification (added) ---
CATEGORY_LABELS = {
    "pipe_burst": "water actively erupting and spraying upward from a ruptured underground pipe",
    "water_main_leak": "water slowly bubbling up and pooling on the ground from a cracked pipe, no spray",
    "drain_sewer_overflow": "dirty dark sewage water and debris overflowing from an open manhole cover",
    "waterlogging": "an entire road submerged under standing floodwater after heavy rain",
    "wet_road_rain": "glistening wet asphalt reflecting lights at night, rain-slicked but not flooded",
    "normal": "a plain dry road with no rain, no puddles, and no water reflections anywhere",
}

def classify_category(image_path, description=""):
    """
    Returns (category, confidence) picked from the real six municipal
    categories, using zero-shot CLIP scoring across all of them —
    not just a binary leak/not-leak threshold.
    """
    label_to_cat = {v: k for k, v in CATEGORY_LABELS.items()}
    labels = list(CATEGORY_LABELS.values())

    if not os.path.exists(image_path):
        scores = {c: 1.0 / len(CATEGORY_LABELS) for c in CATEGORY_LABELS}
    else:
        try:
            image = Image.open(image_path)
            results = vision_classifier(image, candidate_labels=labels)
            scores = {label_to_cat[r["label"]]: r["score"] for r in results}
        except Exception as e:
            print(f"Warning: could not classify {image_path}: {e}")
            scores = {c: 1.0 / len(CATEGORY_LABELS) for c in CATEGORY_LABELS}

    if description:
        text_score = get_text_score(description)
        scores["pipe_burst"] = scores.get("pipe_burst", 0) + text_score * 0.1
        scores["water_main_leak"] = scores.get("water_main_leak", 0) + text_score * 0.1
        scores["wet_road_rain"] = scores.get("wet_road_rain", 0) + (1 - text_score) * 0.05
        scores["normal"] = scores.get("normal", 0) + (1 - text_score) * 0.05

    top_category = max(scores, key=scores.get)
    confidence = round(min(scores[top_category], 1.0), 2)
    return top_category, confidence

#Temporary debugging code to test the multi-category classification

def debug_classify(image_path, description=""):
    """Prints all category scores, not just the winner — use this to diagnose misclassifications."""
    label_to_cat = {v: k for k, v in CATEGORY_LABELS.items()}
    labels = list(CATEGORY_LABELS.values())

    if not os.path.exists(image_path):
        print("Image not found.")
        return

    image = Image.open(image_path)
    results = vision_classifier(image, candidate_labels=labels)
    print(f"\n--- Raw CLIP scores for {image_path} ---")
    for r in results:
        print(f"  {label_to_cat[r['label']]:25s} {r['score']:.3f}")
