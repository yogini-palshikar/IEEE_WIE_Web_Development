import os
import json
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN

from deduplication import deduplicate_reports
from severity import calculate_severity
from priority import calculate_priority
#from leak_detection import classify_category


def run_orchestrator():
    csv_path = "data/raw/reports.csv"

    if not os.path.exists(csv_path):
        print(f"CRITICAL ERROR: {csv_path} is missing!")
        return

    try:
        print("1. Loading raw dataset...")
        df = pd.read_csv(csv_path)

        # Validate required columns exist (BUG-18)
        required_cols = {"latitude", "longitude", "category"}
        missing = required_cols - set(df.columns)
        if missing:
            print(f"CRITICAL ERROR: CSV is missing required columns: {missing}")
            return

        print("2. Deduplicating reports...")
        df = deduplicate_reports(df)

        print("3. Using reported category from citizen submissions...")
        # Batch dataset uses the category the citizen actually selected/reported.
        # (CLIP image classification is reserved for the live single-report demo,
        # where the photo is real and freshly submitted — not for this synthetic
        # 1000-row dataset where images were only used to populate placeholders.)
        severities = []
        for _, row in df.iterrows():
            cat = row.get('category', 'normal')
            # Use a fixed high confidence since this is citizen-reported, not AI-inferred
            severities.append(calculate_severity(cat, 0.8))

        df['severity'] = severities

        print("4. Running Haversine DBSCAN Spatial Clustering...")
        coords = np.radians(df[['latitude', 'longitude']].dropna())
        db = DBSCAN(eps=50.0 / 6371000.0, min_samples=3, metric='haversine', algorithm='ball_tree')
        df['cluster_id'] = db.fit_predict(coords)

        print("5. Aggregating incidents and calculating dispatch priorities...")
        incidents = []
        for label in df['cluster_id'].unique():
            if label == -1:
                continue

            cluster_df = df[df['cluster_id'] == label]
            priority = calculate_priority(cluster_df)
            worst_report = cluster_df.loc[cluster_df['severity'].idxmax()]
            max_severity = int(worst_report['severity'])
            dominant_cat = worst_report['category']

            action = "DISPATCH CREW IMMEDIATELY" if priority >= 75 else "SCHEDULE FIELD INSPECTION"

            incidents.append({
                "incident_id": f"INC-{label + 1001}",
                "latitude": round(cluster_df['latitude'].mean(), 6),
                "longitude": round(cluster_df['longitude'].mean(), 6),
                "total_reports": len(cluster_df),
                "dominant_category": dominant_cat,
                "max_severity": max_severity,
                "priority_score": priority,
                "recommended_action": action
            })

        incidents = sorted(incidents, key=lambda x: x['priority_score'], reverse=True)

        os.makedirs("data/processed", exist_ok=True)
        output_path = "data/processed/incidents.json"
        with open(output_path, "w") as f:
            json.dump(incidents, f, indent=4)

        print(f"\nPIPELINE COMPLETE: {len(incidents)} verified incidents written to {output_path}")

    except Exception as exc:
        print(f"PIPELINE ERROR: {exc}")
        raise


if __name__ == "__main__":
    run_orchestrator()