import os
import pandas as pd

def generate_ground_truth(
    input_csv="data/raw/reports.csv", 
    output_csv="data/processed/ground_truth.csv"
):
    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    
    # Load the raw reports
    df = pd.read_csv(input_csv)

    # Map categories to actual incidents
    def assign_incident_id(category):
        if category == 'water_main_leak':
            return 'INC-001'
        elif category == 'slow_pipe_leak':
            return 'INC-002'
        elif category == 'sewer_overflow':
            return 'INC-003'
        else:
            return 'NONE'

    df['true_incident_id'] = df['category'].apply(assign_incident_id)
    
    # Save the answer key
    ground_truth_df = df[['report_id', 'category', 'true_incident_id']]
    ground_truth_df.to_csv(output_csv, index=False)
    print(f"Success: {output_csv} created with {len(ground_truth_df)} rows.")

if __name__ == "__main__":
    generate_ground_truth()