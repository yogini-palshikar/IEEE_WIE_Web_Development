def calculate_severity(category, confidence):
    """Calculates a 0-100 severity score for an individual citizen report 
    based on municipal infrastructure weights and AI confidence.
    """
    weights = {
        "pipe_burst": 0.95,
        "water_main_leak": 0.85,
        "drain_sewer_overflow": 0.80,
        "waterlogging": 0.60,
        "wet_road_rain": 0.30,
        "normal": 0.10
    }
    
    base_weight = weights.get(category, 0.5)
    
    # Formula: 70% weight to category danger, 30% to AI confidence
    score = int((base_weight * 0.7 + confidence * 0.3) * 100)
    
    return min(score, 100)