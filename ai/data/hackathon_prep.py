import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
import os
import json

def run_hackathon_pipeline():
    # 1. Setup Folders
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("data/images/train", exist_ok=True) # Placeholder for later
    
    input_file = "data/raw/reports.csv"
    if not os.path.exists(input_file):
        print(f"CRITICAL ERROR: Put {input_file} in this folder before running!")
        return

    print("1. Cleaning Dataset...")
    df = pd.read_csv(input_file)
    df = df.drop_duplicates(subset=['report_id'], keep='first')
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce').dt.strftime('%Y-%m-%dT%H:%M:%S')
    df.to_csv("data/processed/reports_clean.csv", index=False)
    
    print("2. Running Spatial AI (DBSCAN Clustering)...")
    coords = np.radians(df[['latitude', 'longitude']].dropna())
    # 50 meter radius
    db = DBSCAN(eps=50.0 / 6371000.0, min_samples=3, metric='haversine', algorithm='ball_tree')
    df['cluster_id'] = db.fit_predict(coords)

    incidents = []
    for label in df['cluster_id'].unique():
        if label == -1: continue # Skip scattered noise
        
        cluster = df[df['cluster_id'] == label]
        incidents.append({
            "incident_id": f"INC-{label + 1001}",
            "center_latitude": round(cluster['latitude'].mean(), 6),
            "center_longitude": round(cluster['longitude'].mean(), 6),
            "dominant_category": cluster['category'].mode()[0],
            "severity_score": int(cluster['severity'].max()),
            "total_reports_correlated": len(cluster)
        })

    # Sort by highest severity so authorities know what to fix first
    incidents = sorted(incidents, key=lambda x: x['severity_score'], reverse=True)

    with open("data/processed/incidents.json", "w") as f:
        json.dump(incidents, f, indent=4)
        
    print("\n✅ PIPELINE SUCCESS!")
    print(f"   Processed {len(df)} raw citizen reports.")
    print(f"   AI grouped them into {len(incidents)} verified infrastructure incidents.")
    print("   Output saved to: data/processed/incidents.json")
    print("   HAND THIS JSON FILE TO YOUR BACKEND/FRONTEND TEAM NOW.")

if __name__ == "__main__":
    run_hackathon_pipeline()