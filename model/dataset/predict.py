import tensorflow as tf
import numpy as np
import cv2
import os


model = tf.keras.models.load_model("model/freshlens_model.h5")



CLASS_LABELS = {
    0: "fresh_apple",
    1: "fresh_banana",
    2: "fresh_bitter_gourd",
    3: "fresh_capsicum",
    4: "fresh_orange",
    5: "fresh_tomato",
    6: "stale_apple",
    7: "stale_banana",
    8: "stale_bitter_gourd",
    9: "stale_capsicum",
    10: "stale_orange",
    11: "stale_tomato"
}

def predict_image(image_path):
    
    img = cv2.imread(image_path)

    if img is None:
        print(f"Error: Could not read image at {image_path}")
        return

    
    img_resized = cv2.resize(img, (224, 224))

    
    img_normalized = img_resized / 255.0

    
    img_input = np.expand_dims(img_normalized, axis=0)

    
    predictions = model.predict(img_input, verbose=0)

    
    class_index  = np.argmax(predictions[0])
    confidence   = predictions[0][class_index] * 100
    label        = CLASS_LABELS[class_index]

   
    if "fresh" in label:
        status = "FRESH"
    else:
        status = "STALE"

    
    shelf_life = get_shelf_life(label)

    print("\n" + "="*40)
    print(f"Image     : {os.path.basename(image_path)}")
    print(f"Prediction: {label}")
    print(f"Status    : {status}")
    print(f"Confidence: {confidence:.2f}%")
    print(f"Shelf Life: {shelf_life}")
    print("="*40)

    return label, confidence, shelf_life

def get_shelf_life(label):
    
    shelf_life_days = {
        "fresh_apple":         "5-7 days",
        "fresh_banana":        "3-5 days",
        "fresh_bitter_gourd":  "4-6 days",
        "fresh_capsicum":      "5-7 days",
        "fresh_orange":        "7-10 days",
        "fresh_tomato":        "4-6 days",
        "stale_apple":         "1-2 days — consume soon",
        "stale_banana":        "0-1 days — consume immediately",
        "stale_bitter_gourd":  "0-1 days — consume immediately",
        "stale_capsicum":      "1-2 days — consume soon",
        "stale_orange":        "1-2 days — consume soon",
        "stale_tomato":        "0-1 days — consume immediately"
    }
    return shelf_life_days.get(label, "Unknown")


if __name__ == "__main__":
    
    test_images = []

    
    val_path = "model/dataset/val"
    for category in os.listdir(val_path):
        cat_path = os.path.join(val_path, category)
        if os.path.isdir(cat_path):
            images = os.listdir(cat_path)
            if images:
                test_images.append(os.path.join(cat_path, images[0]))

    print(f"Testing on {len(test_images)} sample images...\n")

    correct = 0
    for img_path in test_images:
        result = predict_image(img_path)
        if result:
            label, confidence, shelf_life = result
            
            folder_name = os.path.basename(os.path.dirname(img_path))
            if label == folder_name:
                correct += 1
                print("✓ Correct prediction")
            else:
                print(f"✗ Wrong — should be: {folder_name}")

    print(f"\nTest Results: {correct}/{len(test_images)} correct")
    print(f"Quick Test Accuracy: {correct/len(test_images)*100:.1f}%")
    
  