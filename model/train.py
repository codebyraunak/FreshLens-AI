import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, Input, Concatenate
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt
import numpy as np
import os

# ─────────────────────────────────────────
#  SETTINGS — change these if needed
# ─────────────────────────────────────────
TRAIN_PATH  = "model/dataset/train"
VAL_PATH    = "model/dataset/val"
IMG_SIZE    = 224        # MobileNetV2 needs exactly 224x224
BATCH_SIZE  = 32         # 32 images processed at a time
EPOCHS      = 15         # how many times to go through all images
MODEL_SAVE  = "model/freshlens_model.h5"  # where to save the trained model

# ─────────────────────────────────────────
#  STEP 1 — Count your classes automatically
# ─────────────────────────────────────────
NUM_CLASSES = len(os.listdir(TRAIN_PATH))
print(f"Number of classes found: {NUM_CLASSES}")
print(f"Classes: {os.listdir(TRAIN_PATH)}")

# ─────────────────────────────────────────
#  STEP 2 — Data Augmentation
# ─────────────────────────────────────────
train_datagen = ImageDataGenerator(
    rescale=1./255,          # convert pixel values from 0-255 to 0-1
    rotation_range=10,       # randomly rotate images up to 10 degrees
    zoom_range=0.1,          # randomly zoom in up to 10%
    horizontal_flip=True,    # randomly flip images left-right
    width_shift_range=0.1,   # randomly shift image left or right
    height_shift_range=0.1,  # randomly shift image up or down
    shear_range=0.15         # randomly shear the image
)

val_datagen = ImageDataGenerator(
    rescale=1./255           # only rescale for validation — no augmentation
)

# ─────────────────────────────────────────
#  STEP 3 — Load images from folders
# ─────────────────────────────────────────
train_data = train_datagen.flow_from_directory(
    TRAIN_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

val_data = val_datagen.flow_from_directory(
    VAL_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

print(f"\nClass mapping: {train_data.class_indices}")

# ─────────────────────────────────────────
#  STEP 3.5 — Custom Generator for Temperature
#  Since we don't have real temperature data, 
#  we generate random plausible temperatures.
# ─────────────────────────────────────────
def multi_input_generator(generator):
    while True:
        x_batch, y_batch = next(generator)
        # Generate random temperatures between -5°C and 35°C
        # In a real scenario, this would be loaded from your dataset labels
        temp_batch = np.random.uniform(low=-5.0, high=35.0, size=(x_batch.shape[0], 1))
        
        # The model expects a list of inputs: [image_input, temperature_input]
        yield [x_batch, temp_batch], y_batch

train_generator_multi = multi_input_generator(train_data)
val_generator_multi = multi_input_generator(val_data)

# ─────────────────────────────────────────
#  STEP 4 — Load MobileNetV2 base model
# ─────────────────────────────────────────
print("\nLoading MobileNetV2...")
image_input = Input(shape=(IMG_SIZE, IMG_SIZE, 3), name='image_input')
base_model = MobileNetV2(
    input_tensor=image_input,
    include_top=False,                     # remove Google's top layer
    weights='imagenet'                     # use Google's pre-trained weights
)

# Freeze base layers
base_model.trainable = False

# ─────────────────────────────────────────
#  STEP 5 — Build Multi-Input Architecture
# ─────────────────────────────────────────
# 1. Process Image Features
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)

# 2. Process Temperature Input
temperature_input = Input(shape=(1,), name='temperature_input')
temp_features = Dense(16, activation='relu')(temperature_input)

# 3. Combine Image and Temperature
combined = Concatenate()([x, temp_features])
combined = Dense(128, activation='relu')(combined)
combined = Dropout(0.2)(combined)

# Final Output Layer
output = Dense(NUM_CLASSES, activation='softmax', name='prediction')(combined)

# Build the complete model with TWO inputs
model = Model(inputs=[image_input, temperature_input], outputs=output)

# ─────────────────────────────────────────
#  STEP 6 — Compile the model
# ─────────────────────────────────────────
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print(model.summary())

# ─────────────────────────────────────────
#  STEP 7 — Train the model
# ─────────────────────────────────────────
print("\nStarting training with Multi-Input Architecture (Image + Temperature)...")
print("This will take 20-40 minutes depending on your laptop\n")

# Note: We use steps_per_epoch because custom generators run infinitely
history = model.fit(
    train_generator_multi,
    steps_per_epoch=len(train_data),
    validation_data=val_generator_multi,
    validation_steps=len(val_data),
    epochs=EPOCHS,
    verbose=1
)

# ─────────────────────────────────────────
#  STEP 8 — Save the trained model
# ─────────────────────────────────────────
model.save(MODEL_SAVE)
print(f"\nModel saved to {MODEL_SAVE}")

# ─────────────────────────────────────────
#  STEP 9 — Print final results
# ─────────────────────────────────────────
final_train_acc = history.history['accuracy'][-1] * 100
final_val_acc   = history.history['val_accuracy'][-1] * 100
final_train_loss = history.history['loss'][-1]
final_val_loss   = history.history['val_loss'][-1]

print("\n" + "="*50)
print("TRAINING COMPLETE")
print("="*50)
print(f"Final Training Accuracy   : {final_train_acc:.2f}%")
print(f"Final Validation Accuracy : {final_val_acc:.2f}%")
print(f"Final Training Loss       : {final_train_loss:.4f}")
print(f"Final Validation Loss     : {final_val_loss:.4f}")
print("="*50)

# ─────────────────────────────────────────
#  STEP 10 — Plot accuracy and loss graphs
# ─────────────────────────────────────────
plt.figure(figsize=(10, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Accuracy')
plt.plot(history.history['val_accuracy'], label='Val Accuracy')
plt.title('Model Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()

plt.tight_layout()
plt.savefig('model/training_results.png')
print("Training graphs saved to model/training_results.png")
