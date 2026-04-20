import os
import shutil
import random

# Paths
DATASET_PATH = "model/dataset/raw"
TRAIN_PATH   = "model/dataset/train"
VAL_PATH     = "model/dataset/val"

SPLIT_RATIO  = 0.8  # 80% train, 20% val

def split_dataset():
    categories = os.listdir(DATASET_PATH)
    print(f"Found {len(categories)} categories: {categories}")

    for category in categories:
        cat_path = os.path.join(DATASET_PATH, category)

        if not os.path.isdir(cat_path):
            continue

        images = os.listdir(cat_path)
        random.shuffle(images)

        split      = int(len(images) * SPLIT_RATIO)
        train_imgs = images[:split]
        val_imgs   = images[split:]

        os.makedirs(os.path.join(TRAIN_PATH, category), exist_ok=True)
        os.makedirs(os.path.join(VAL_PATH, category), exist_ok=True)

        for img in train_imgs:
            shutil.copy(
                os.path.join(cat_path, img),
                os.path.join(TRAIN_PATH, category, img)
            )

        for img in val_imgs:
            shutil.copy(
                os.path.join(cat_path, img),
                os.path.join(VAL_PATH, category, img)
            )

        print(f"{category}: {len(train_imgs)} train | {len(val_imgs)} val")

split_dataset()
print("\nDataset split complete!")