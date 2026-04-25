# FRONTEND.md - React UI Frontend Documentation

## Overview

The **Frontend** is Layer 4 of the system architecture. It provides a user-friendly interface for digit drawing and classification using HTML5 Canvas and React, with real-time feedback and result visualization.

## Quick Start

### Access the Application

Simply open the HTML file in your browser:

```bash
# Navigate to frontend directory
cd frontend

# Open with your default browser
# On Windows:
start mnist-classifier.html

# On macOS:
open mnist-classifier.html

# On Linux:
xdg-open mnist-classifier.html
```

**URL**: `file:///path/to/frontend/mnist-classifier.html`

## Application Structure

```
frontend/
├── mnist-classifier.html        # Main application (React-based)
├── index.html                   # Alternative entry point
├── css/
│   └── styles.css              # Styling (optional)
├── js/
│   └── app.js                  # Additional scripts (optional)
└── README.md                    # Frontend documentation
```

## Technology Stack

- **React**: 18.x (via CDN)
- **Babel**: For JSX transformation
- **HTML5**: Canvas API for drawing
- **JavaScript**: ES6+
- **CSS**: Responsive design

## Architecture

### Component Structure

```
App (Root)
├── Header
│   └── Title & Subtitle
├── DrawingCanvas
│   ├── Canvas Element
│   ├── Clear Button
│   └── Submit Button
├── ResultDisplay
│   ├── Prediction Digit
│   ├── Confidence %
│   ├── Processing Time
│   └── Error Messages
└── LoadingIndicator (when processing)
```

## User Interface

### Main Page Layout

```
┌─────────────────────────────────────────────┐
│       DIGIT CLASSIFICATION SYSTEM            │
│     Draw a digit and we'll classify it       │
├─────────────────────────────────────────────┤
│                                              │
│            ┌──────────────────┐             │
│            │                  │             │
│            │   DRAWING        │   [Clear]   │
│            │   CANVAS         │             │
│            │   (28×28 area)   │   [Submit]  │
│            │                  │             │
│            └──────────────────┘             │
│                                              │
├─────────────────────────────────────────────┤
│   PREDICTION: 5                              │
│   CONFIDENCE: 98%                            │
│   TIME: 145ms                                │
└─────────────────────────────────────────────┘
```

### Key Features

1. **HTML5 Canvas Drawing**
   - Real-time drawing feedback
   - Smooth stroke rendering
   - Black pen on white background
   - Responsive to mouse and touch

2. **Action Buttons**
   - **Clear**: Reset canvas and results
   - **Submit**: Send drawing for classification

3. **Result Display**
   - Predicted digit (0-9)
   - Confidence percentage (0-100%)
   - Processing time in milliseconds
   - Error messages on failure

4. **Responsive Design**
   - Mobile-friendly layout
   - Adapts to different screen sizes
   - Touch event support

## Code Structure

### React Component

```jsx
function App() {
  // State management
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Canvas reference
  const canvasRef = useRef(null);
  
  // Drawing functions
  const startDrawing = (e) => { /* ... */ };
  const draw = (e) => { /* ... */ };
  const stopDrawing = () => { /* ... */ };
  
  // API interaction
  const handleSubmit = async () => { /* ... */ };
  const clearCanvas = () => { /* ... */ };
  
  // Render JSX
  return (/* ... */);
}
```

### Canvas Drawing Implementation

```javascript
// Initialize canvas
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 280;  // 28×28 pixels × 10 for visibility
canvas.height = 280;

// Set drawing style
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = 'black';
ctx.lineWidth = 10;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
```

### Drawing Functions

```javascript
// Start drawing on mouse down
function startDrawing(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  isDrawing = true;
}

// Draw on mouse move
function draw(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  ctx.lineTo(x, y);
  ctx.stroke();
}

// Stop drawing on mouse up
function stopDrawing() {
  ctx.closePath();
  isDrawing = false;
}
```

### Pixel Extraction

```javascript
function getCanvasPixels() {
  // Get image data from canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Extract grayscale values (convert from RGBA to grayscale)
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    // Skip alpha channel, use R value (same for G and B in grayscale)
    pixels.push(data[i]);  // R channel (0-255)
  }
  
  // Normalize to 28×28 (canvas is 280×280, so average each 10×10 block)
  const normalized = [];
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      let sum = 0;
      for (let dy = 0; dy < 10; dy++) {
        for (let dx = 0; dx < 10; dx++) {
          const idx = ((y * 10 + dy) * canvas.width + (x * 10 + dx)) * 4;
          sum += data[idx];
        }
      }
      normalized.push(Math.round(sum / 100));  // Average value
    }
  }
  
  return normalized;  // 784 values
}
```

### API Communication

```javascript
async function handleSubmit() {
  try {
    setLoading(true);
    setError(null);
    
    // Extract pixels from canvas
    const pixels = getCanvasPixels();
    
    // Prepare request
    const startTime = Date.now();
    const response = await fetch('http://localhost:8080/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pixels })
    });
    
    // Handle response
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const endTime = Date.now();
    
    // Update state with results
    setPrediction(data.prediction);
    setConfidence(Math.round(data.confidence * 100));
    setProcessingTime(data.processingTimeMs || (endTime - startTime));
    
  } catch (err) {
    console.error('Prediction error:', err);
    setError(`Error: ${err.message}`);
    setPrediction(null);
    
  } finally {
    setLoading(false);
  }
}
```

### Error Handling

```javascript
// Network errors
catch (err) {
  if (err instanceof TypeError) {
    setError('Network error - Make sure the API is running on http://localhost:8080');
  } else {
    setError(`Prediction failed: ${err.message}`);
  }
}

// HTTP errors
if (!response.ok) {
  const errorData = await response.json();
  setError(`API Error: ${errorData.message || response.statusText}`);
}
```

## User Workflow

### Step-by-Step Process

```
1. User opens mnist-classifier.html
                ↓
2. React app initializes
   - Canvas setup (280×280)
   - Draw event listeners attached
                ↓
3. User draws digit on canvas
   - Mouse events trigger drawing
   - Strokes appear in real-time
                ↓
4. User clicks "Submit" button
                ↓
5. Frontend processes:
   - Extract 28×28 pixel array
   - Convert RGBA to grayscale
   - Prepare JSON payload
                ↓
6. HTTP POST to /api/predict
   - Content-Type: application/json
   - Body: { pixels: [0, ..., 255, ...] }
                ↓
7. Loading indicator shown
                ↓
8. Backend processes:
   - Validate pixels
   - Call Python service
   - Get prediction
                ↓
9. Response received
   - Parse JSON response
   - Extract prediction, confidence, time
                ↓
10. Display results
    - Digit: 5
    - Confidence: 98%
    - Time: 145ms
                ↓
11. User can:
    - Click "Clear" to draw again
    - Click "Submit" to reclassify
```

## Styling

### CSS Classes

```css
/* Main container */
.container {
  min-height: 100vh;
  padding: 40px 20px;
  background-color: #ffffff;
}

/* Header section */
.header {
  text-align: center;
  margin-bottom: 60px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.subtitle {
  font-size: 14px;
  color: #666666;
  margin: 0;
}

/* Canvas area */
.canvas-wrapper {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
}

#drawingCanvas {
  border: 2px solid #333333;
  cursor: crosshair;
  background-color: white;
  border-radius: 8px;
}

/* Buttons */
.button-group {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn {
  background-color: #007bff;
  color: white;
}

.clear-btn {
  background-color: #6c757d;
  color: white;
}

/* Results */
.result-display {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.result-text {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
}

/* Error messages */
.error {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 12px;
  border-radius: 4px;
  margin: 10px 0;
}

/* Loading indicator */
.loading {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Responsive Design

### Mobile Optimization

```css
@media (max-width: 768px) {
  .container {
    padding: 20px 10px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .canvas-wrapper {
    flex-direction: column;
    align-items: center;
  }
  
  #drawingCanvas {
    width: 280px;
    height: 280px;
  }
}
```

## API Integration

### Request Format

```json
POST /api/predict HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Content-Length: 5234

{
  "pixels": [0, 0, 0, ..., 255, 128, ..., 0]
}
```

### Response Format

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "prediction": 5,
  "confidence": 0.98,
  "processingTimeMs": 145.2,
  "timestamp": "2025-04-25T10:30:45.123Z"
}
```

## Browser Compatibility

- ✓ Chrome 90+
- ✓ Firefox 88+
- ✓ Safari 14+
- ✓ Edge 90+
- ✓ Mobile browsers (iOS Safari, Chrome Android)

## Accessibility

### Keyboard Support

```javascript
// Support Enter key to submit
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSubmit();
  }
});

// Support Escape to clear
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearCanvas();
  }
});
```

### ARIA Labels

```jsx
<button 
  aria-label="Submit drawing for classification"
  onClick={handleSubmit}
>
  Submit
</button>

<button 
  aria-label="Clear canvas and reset results"
  onClick={clearCanvas}
>
  Clear
</button>
```

## Troubleshooting

### Issue: Canvas not drawing
```
Solution:
- Check mouse events are firing
- Verify canvas context is not null
- Check CSS display properties
```

### Issue: API connection errors
```
Solution:
- Verify Spring Boot API is running on port 8080
- Check CORS configuration
- Verify network connectivity
```

### Issue: Slow predictions
```
Solution:
- Check if Python service is running
- Verify network latency
- Check browser console for errors
```

## Future Enhancements

1. **Image Upload Support**
   - Upload existing handwritten digit images
   - Image preprocessing & resizing

2. **Prediction History**
   - Store previous predictions
   - Show prediction trends
   - Undo/Redo functionality

3. **Confidence Visualization**
   - Bar chart for all class probabilities
   - Show top 3 predictions

4. **Drawing Tools**
   - Adjustable brush size
   - Eraser tool
   - Undo/Redo

5. **Offline Support**
   - Service Worker for offline access
   - Local model inference (TensorFlow.js)

6. **Model Switching**
   - Compare different models
   - Model version selection

---

**Document Version**: 1.0  
**Last Updated**: April 2025  
**Technology**: React 18, HTML5 Canvas  
**Status**: Production Ready
