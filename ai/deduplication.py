import pandas as pd

def deduplicate_reports(df):
    """Cleans the dataset by removing exact duplicate report IDs and 
    simultaneous redundant submissions sharing identical coordinates and categories.
    """
    initial_count = len(df)
    
    # 1. Drop duplicate IDs
    df = df.drop_duplicates(subset=['report_id'], keep='first')
    
    # 2. Drop hyper-local duplicates (same exact GPS coordinate and same category)
    df = df.drop_duplicates(subset=['latitude', 'longitude', 'category'], keep='first')
    
    cleaned_count = len(df)
    print(f"Deduplication complete: Removed {initial_count - cleaned_count} duplicate entries.")
    
    return df
