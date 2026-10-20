import pandas as pd
import os
import random

def fix_image_placeholders():
    csv_path = "data/raw/reports.csv" 
    test_img_dir = "data/images/test/"
    
    print("1. Loading 1000-row dataset...")
    df = pd.read_csv(csv_path)
    
    print("2. Finding actual test images...")
    # Grab all valid image files directly inside the test folder
    valid_images = [f for f in os.listdir(test_img_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    if not valid_images:
        print("ERROR: No images found in data/images/test/.")
        return

    print(f"Found {len(valid_images)} real images. Assigning them to {len(df)} rows...")
    
    # Randomly assign a valid test image path to every row
    df['image_path'] = [os.path.join(test_img_dir, random.choice(valid_images)) for _ in range(len(df))]
    
    # Save the updated dataset back to the CSV
    df.to_csv(csv_path, index=False)
    print("✅ SUCCESS: All placeholders replaced with real image paths!")

if __name__ == "__main__":
    fix_image_placeholders()