import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN

def cluster_reports(
    csv_path="data/raw/reports.csv",
    eps_meters=50.0,
    min_samples=3,
):
    """Clusters citizen reports into physical incidents using Haversine DBSCAN."""
    print("Loading reports...")
    df = pd.read_csv(csv_path)

    # Convert coordinates to radians for the Haversine metric
    coords = np.radians(df[["latitude", "longitude"]])

    # Earth's approximate radius in meters
    EARTH_RADIUS_METERS = 6371000.0
    eps_radians = eps_meters / EARTH_RADIUS_METERS

    # Run DBSCAN
    print(f"Running DBSCAN clustering (radius: {eps_meters}m, min_reports: {min_samples})...")
    db = DBSCAN(
        eps=eps_radians,
        min_samples=min_samples,
        metric="haversine",
        algorithm="ball_tree",
    )
    df["cluster_id"] = db.fit_predict(coords)

    # Summary analysis
    n_clusters = len(set(df["cluster_id"])) - (1 if -1 in df["cluster_id"] else 0)
    n_noise = (df["cluster_id"] == -1).sum()

    print("\n--- Spatial Clustering Results ---")
    print(f"Total reports analyzed: {len(df)}")
    print(f"Discovered physical incident clusters: {n_clusters}")
    print(f"Isolated noise/dispersed reports: {n_noise}\n")

    # Inspect the discovered clusters
    for cid in sorted(df["cluster_id"].unique()):
        cluster_df = df[df["cluster_id"] == cid]
        if cid == -1:
            print(f"[Unclustered / Noise]: {len(cluster_df)} reports (dispersed waterlogging/civic noise)")
        else:
            dominant_category = cluster_df["category"].mode()[0]
            lat_center = cluster_df["latitude"].mean()
            lon_center = cluster_df["longitude"].mean()
            print(f"[Incident Cluster {cid}]: {len(cluster_df)} reports | Dominant Type: {dominant_category} | Center: ({lat_center:.6f}, {lon_center:.6f})")

    return df

if __name__ == "__main__":
    cluster_reports()