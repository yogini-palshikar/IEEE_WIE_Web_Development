import os

classes = [
    "water_main_leak",
    "pipe_burst",
    "waterlogging",
    "drain_sewer_overflow",
    "wet_road_rain",
    "normal",
]
splits = ["train", "val", "test"]

# Use "data/images/..." if your terminal is already inside the "ai" folder
base_dir = "data/images"

for split in splits:
    for cls in classes:
        path = os.path.join(base_dir, split, cls)
        os.makedirs(path, exist_ok=True)

print("Successfully created image dataset folder structure in data/images/!")