def calculate_priority(cluster_df):
    """Calculates dispatch priority for a physical incident cluster 
    by combining maximum report severity and crowd-sourcing density.
    """
    max_severity = int(cluster_df['severity'].max())
    report_count = len(cluster_df)
    
    # Priority formula: 60% weight to peak severity, 40% to crowd volume
    priority_score = int((max_severity * 0.6) + (min(report_count, 50) * 0.8))
    
    return min(priority_score, 100)