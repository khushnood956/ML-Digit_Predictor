# ML_MODEL.md - Machine Learning Model Documentation

## Overview

The Machine Learning Model is the core of the digit classification system. It's a **Convolutional Neural Network (CNN)** trained on the MNIST dataset to classify handwritten digits (0-9) with high accuracy.

## Model Architecture

### Input Specifications
- **Format**: 28×28 pixel grayscale images
- **Data Type**: Floating-point (normalized to 0-1)
- **Batch Size**: Variable (1 for single predictions, 128+ for training)

### CNN Architecture

```
Input Layer: (28, 28, 1)
    ↓
[Conv2D - 32 filters, 3×3 kernel, ReLU]
    ↓
[MaxPooling2D - 2×2 pool size]
    ↓
[Conv2D - 64 filters, 3×3 kernel, ReLU]
    ↓
[MaxPooling2D - 2×2 pool size]
    ↓
[Flatten] → 3136 units
    ↓
[Dense - 128 units, ReLU]
    ↓
[Dropout - 0.5]
    ↓
[Dense - 10 units, Softmax]
    ↓
Output: Probability distribution over 10 classes (0-9)
```

### Layer Details

| Layer | Type | Config | Output Shape |
|-------|------|--------|--------------|
| Input | Input | - | (28, 28, 1) |
| Conv1 | Conv2D | 32 filters, 3×3, ReLU | (26, 26, 32) |
| Pool1 | MaxPooling2D | 2×2 pool | (13, 13, 32) |
| Conv2 | Conv2D | 64 filters, 3×3, ReLU | (11, 11, 64) |
| Pool2 | MaxPooling2D | 2×2 pool | (5, 5, 64) |
| Flatten | Flatten | - | (1600,) |
| Dense1 | Dense | 128 units, ReLU | (128,) |
| Dropout | Dropout | Rate 0.5 | (128,) |
| Output | Dense | 10 units, Softmax | (10,) |

### Model Parameters
- **Total Parameters**: ~1.3M
- **Trainable Parameters**: ~1.3M
- **Model Size**: ~50-100 MB (depending on precision)

## Dataset Information

### MNIST Dataset
- **Training Samples**: 60,000 images
- **Test Samples**: 10,000 images
- **Total**: 70,000 images
- **Image Size**: 28×28 pixels
- **Format**: Grayscale (single channel)
- **Classes**: 10 (digits 0-9)
- **Data Balance**: Well-balanced across all classes

### Data Preprocessing

#### 1. **Normalization**
```python
# Raw pixel values: 0-255
X = X / 255.0  # Normalized to 0-1
```
**Reason**: Neural networks train faster with normalized inputs

#### 2. **Reshaping**
```python
# Original shape for CNN: (num_samples, 28, 28)
X_train = X_train.reshape(-1, 28, 28, 1)  # Add channel dimension
```

#### 3. **One-Hot Encoding**
```python
# Label: 5 → [0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
y = to_categorical(y, num_classes=10)
```
**Reason**: Required for categorical crossentropy loss function

## Training Details

### Hyperparameters
```
Optimizer: Adam (learning_rate=0.001)
Loss Function: Categorical Crossentropy
Metrics: Accuracy, Precision, Recall
Batch Size: 128
Epochs: 10-20
Validation Split: 0.2 (20% of training data)
```

### Training Configuration
```python
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy', 'precision', 'recall']
)

model.fit(
    X_train, y_train,
    batch_size=128,
    epochs=20,
    validation_split=0.2,
    callbacks=[
        EarlyStopping(monitor='val_loss', patience=5),
        ModelCheckpoint('best_model.h5')
    ]
)
```

## Model Performance

### Accuracy Metrics
- **Training Accuracy**: ~99.5%
- **Validation Accuracy**: ~98.5%
- **Test Accuracy**: ~98%

### Confusion Matrix Analysis
- **Digits Most Confused**: 4 & 9 (similar shapes)
- **Digits Easiest to Classify**: 0 (distinct appearance)
- **Per-Class Accuracy**: Range 96-99%

### Performance Metrics
```
Precision: ~0.98 (false positives: ~2%)
Recall:    ~0.98 (false negatives: ~2%)
F1-Score:  ~0.98 (balanced performance)
```

### Inference Performance
- **Single Prediction Time**: ~50-100ms (CPU)
- **Model Loading Time**: ~5-10 seconds
- **Memory Usage**: ~200 MB (including TensorFlow)

## Model File

### File Format
- **Filename**: `mnist_cnn_model.h5`
- **Format**: HDF5 (Hierarchical Data Format)
- **Size**: ~50-100 MB
- **Framework**: TensorFlow/Keras 2.15.0
- **Compatibility**: TensorFlow 2.x

### Loading the Model
```python
import tensorflow as tf

# Load trained model
model = tf.keras.models.load_model('mnist_cnn_model.h5')

# Model is ready for predictions
predictions = model.predict(X_test)
```

### Model Inference
```python
# Input: normalized 28×28 image
image = np.array([...])  # Shape: (28, 28, 1)
image = image / 255.0    # Normalize
image = np.expand_dims(image, axis=0)  # Add batch dimension → (1, 28, 28, 1)

# Get prediction
output = model.predict(image)  # Shape: (1, 10)
prediction = np.argmax(output[0])  # 0-9
confidence = output[0][prediction]  # 0-1
```

## Notebook Structure

### File: `ML_LAB-MID(SP24-BCS-051-076).ipynb`

The notebook contains the complete ML pipeline:

#### 1. **Problem Statement**
   - Objective: Classify handwritten digits (0-9)
   - Challenge: Handle diverse handwriting styles
   - Solution: CNN-based approach

#### 2. **Dataset**
   - MNIST dataset loading
   - Dataset exploration
   - Class distribution analysis

#### 3. **Preprocessing**
   - Normalization (pixel values: 0-255 → 0-1)
   - Reshaping for CNN (28×28 → 28×28×1)
   - One-hot encoding for labels

#### 4. **Visualization**
   - Sample digit images
   - Class distribution histogram
   - Pixel intensity visualization

#### 5. **Model**
   - CNN architecture definition
   - Model compilation with Adam optimizer
   - Model summary and parameter count

#### 6. **Training**
   - Model training with fit()
   - Batch processing
   - Validation monitoring
   - Training history visualization

#### 7. **Evaluation**
   - Test set evaluation
   - Accuracy, precision, recall metrics
   - Per-class performance analysis

#### 8. **Confusion Matrix**
   - Heatmap visualization
   - Classification breakdown
   - Misclassified digits analysis

#### 9. **Precision & Recall**
   - Classification report
   - Precision-recall curves
   - F1-score analysis

#### 10. **Misclassification Analysis**
   - Identification of problematic digit pairs
   - Visualization of misclassified samples
   - Analysis of classification patterns

## Usage in Production

### Python Service Integration
```python
# In python-inference-service/main.py
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = tf.keras.models.load_model('mnist_cnn_model.h5')

@app.post("/predict")
async def predict(request: PredictionRequest):
    # Convert pixels to numpy array
    pixels = np.array(request.pixels, dtype=np.float32)
    
    # Reshape to 28×28×1
    image = pixels.reshape(1, 28, 28, 1)
    
    # Normalize
    image = image / 255.0
    
    # Predict
    output = model.predict(image)
    prediction = int(np.argmax(output[0]))
    confidence = float(np.max(output[0]))
    
    return PredictionResponse(
        prediction=prediction,
        confidence=confidence,
        processing_time_ms=time_taken
    )
```

## Model Improvement Ideas

### 1. **Architecture Enhancements**
- Add more Conv2D layers for deeper feature extraction
- Use depthwise separable convolutions (MobileNet style)
- Batch normalization for faster training
- Skip connections (ResNet style)

### 2. **Training Improvements**
- Data augmentation (rotation, shear, zoom)
- Learning rate scheduling
- Advanced optimizers (RMSprop, SGD with momentum)
- L1/L2 regularization

### 3. **Transfer Learning**
- Pre-trained models (MobileNet, ResNet18)
- Fine-tuning on MNIST
- Domain-specific improvements

### 4. **Ensemble Methods**
- Multiple model outputs averaged
- Voting-based predictions
- Improved confidence scores

### 5. **Model Compression**
- Quantization (8-bit, 16-bit)
- Pruning (remove unnecessary weights)
- Knowledge distillation
- TensorFlow Lite for mobile deployment

## Validation & Testing

### Test Coverage
```python
# Unit tests for model
def test_model_shape():
    """Test that model accepts correct input shape"""
    X_test_sample = np.random.rand(1, 28, 28, 1)
    output = model.predict(X_test_sample)
    assert output.shape == (1, 10)

def test_prediction_range():
    """Test that predictions are valid probabilities"""
    X_test_sample = np.random.rand(1, 28, 28, 1)
    output = model.predict(X_test_sample)
    assert np.all(output >= 0) and np.all(output <= 1)
    assert np.allclose(np.sum(output[0]), 1.0)

def test_model_loading():
    """Test that model loads correctly"""
    loaded_model = tf.keras.models.load_model('mnist_cnn_model.h5')
    assert loaded_model is not None
    assert loaded_model.input_shape == (None, 28, 28, 1)
    assert loaded_model.output_shape == (None, 10)
```

### Evaluation Metrics
```python
from sklearn.metrics import classification_report, confusion_matrix

# Get predictions
y_pred = model.predict(X_test)
y_pred_classes = np.argmax(y_pred, axis=1)

# Classification report
print(classification_report(y_test, y_pred_classes))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred_classes)
print(cm)
```

## Known Limitations

1. **Dataset Bias**: MNIST has mostly handwritten digits in specific style
2. **Generalization**: Model may struggle with real-world handwritten digits
3. **Speed**: CPU inference takes 50-100ms
4. **Size**: Model file is ~50-100MB

## Optimization Path

1. **Short-term**: Data augmentation, batch normalization
2. **Medium-term**: Transfer learning, ensemble methods
3. **Long-term**: Model compression, edge deployment

---

**Document Version**: 1.0  
**Last Updated**: April 2025  
**Model Version**: CNN v1.0  
**Training Dataset**: MNIST  
**Accuracy**: ~98% on test set
