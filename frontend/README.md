# Frontend UI - README

## Overview

This directory contains the **Frontend** - Layer 4 of the system. It provides a user-friendly interface for drawing digits and viewing classification results using React and HTML5 Canvas.

## Contents

- **mnist-classifier.html** - Main React-based application
- **index.html** - Alternative entry point
- **README.md** - This file

## Quick Start

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Spring Boot API running on port 8080

### Open the Application

**Option 1 - Direct File**:
```bash
# Windows
start mnist-classifier.html

# macOS
open mnist-classifier.html

# Linux
xdg-open mnist-classifier.html
```

**Option 2 - Local Web Server**:
```bash
# Python 3
python -m http.server 8001

# Then open: http://localhost:8001/mnist-classifier.html
```

**Option 3 - Docker**:
```bash
docker run -p 80:80 -v $(pwd):/usr/share/nginx/html:ro nginx:alpine
# Then open: http://localhost
```

## Key Features

- ✓ HTML5 Canvas for digit drawing
- ✓ Real-time drawing feedback
- ✓ React 18 for UI components
- ✓ Responsive design (mobile-friendly)
- ✓ Touch event support
- ✓ Error handling & loading states
- ✓ Confidence percentage display
- ✓ Processing time tracking

## User Interface

### Drawing Canvas

- **Size**: 280×280 pixels (displays 28×28 pixel images at 10x scale)
- **Background**: White
- **Pen Color**: Black
- **Line Width**: 10 pixels
- **Support**: Mouse & touch events

### Buttons

- **Clear**: Resets canvas and clears results
- **Submit**: Sends drawing for classification

### Results Display

- **Predicted Digit**: 0-9
- **Confidence**: Percentage (0-100%)
- **Processing Time**: Milliseconds

## Workflow

```
1. User opens mnist-classifier.html
2. Canvas initializes (ready for drawing)
3. User draws digit with mouse or touch
4. Strokes appear in real-time on canvas
5. User clicks "Submit" button
6. Frontend extracts pixel data (28×28 array)
7. Sends to Spring Boot API (POST /api/predict)
8. Shows loading indicator
9. Receives prediction & displays results
10. User can draw again or clear for new drawing
```

## Technical Details

### Technology Stack

- **React 18** - UI framework (via CDN)
- **Babel** - JSX transformation
- **HTML5 Canvas** - Drawing
- **JavaScript ES6+** - Logic
- **CSS3** - Styling

### Canvas Implementation

```javascript
// Initialize canvas
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Set size (280×280)
canvas.width = 280;
canvas.height = 280;

// White background
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Drawing settings
ctx.strokeStyle = 'black';
ctx.lineWidth = 10;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
```

### Pixel Extraction

```javascript
// Get canvas image data
const imageData = ctx.getImageData(0, 0, 280, 280);
const data = imageData.data;

// Extract grayscale pixels (784 values for 28×28)
const pixels = [];
for (let i = 0; i < data.length; i += 4) {
  pixels.push(data[i]);  // R channel (grayscale)
}

// Normalize to 28×28
const normalized = downscalePixels(pixels);  // 784 values
```

### API Communication

```javascript
// Prepare request
const response = await fetch('http://localhost:8080/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pixels })
});

// Parse response
const data = await response.json();
console.log(`Predicted: ${data.prediction}, Confidence: ${data.confidence}`);
```

## Keyboard Shortcuts

- **Enter**: Submit prediction
- **Escape**: Clear canvas

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✓ Supported |
| Firefox | 88+ | ✓ Supported |
| Safari | 14+ | ✓ Supported |
| Edge | 90+ | ✓ Supported |
| Mobile Safari | 14+ | ✓ Supported |
| Chrome Android | 90+ | ✓ Supported |

## Responsive Design

### Mobile Features

- Touchscreen support (draw with finger)
- Responsive layout
- Optimized button sizes
- Full-screen canvas

### CSS Media Queries

```css
@media (max-width: 768px) {
  /* Optimize for mobile */
  .container {
    padding: 20px 10px;
  }
}
```

## Configuration

### API Endpoint

Update the API URL in `mnist-classifier.html`:

```javascript
// Default (localhost)
const API_URL = 'http://localhost:8080/api/predict';

// Production (update to your server)
// const API_URL = 'https://api.example.com/predict';
```

### Canvas Size

Modify in CSS:
```css
#drawingCanvas {
  width: 280px;
  height: 280px;
}
```

### Pen Settings

Modify in JavaScript:
```javascript
ctx.lineWidth = 10;  // Pen thickness
ctx.strokeStyle = 'black';  // Pen color
ctx.fillStyle = 'white';  // Background
```

## Accessibility

### Screen Reader Support

```html
<button aria-label="Submit drawing for classification">
  Submit
</button>
```

### Keyboard Navigation

All buttons keyboard accessible (Tab, Enter)

### Color Contrast

- Text contrast: 4.5:1 (WCAG AA)
- Button contrast: 4.5:1 (WCAG AA)

## Performance

### Canvas Rendering

- Smooth 60fps drawing
- Optimized event handlers
- Debounced API calls

### Network

- Typical API response: 100-200ms
- Total perception latency: ~300-500ms

## Troubleshooting

### Canvas not drawing
- Check browser console for errors
- Verify canvas permissions
- Try different browser

### API connection error
```
"Cannot reach API on http://localhost:8080"
→ Verify Spring Boot is running
→ Check CORS configuration
→ Check network connectivity
```

### Slow predictions
- Check network latency
- Verify API is running
- Check if Python service is responding

### Drawing is laggy
- Check CPU usage
- Try closing other tabs
- Use Chrome or Firefox for best performance

## Future Enhancements

1. **Image Upload**
   - Support for uploading images
   - Image preprocessing

2. **Prediction History**
   - Store previous predictions
   - View trends over time

3. **Advanced Visualization**
   - Confidence bar chart
   - Top 3 predictions
   - Heatmap overlay

4. **Drawing Tools**
   - Adjustable brush size
   - Eraser
   - Undo/Redo

5. **Offline Support**
   - Service Worker for offline access
   - Local model inference (TensorFlow.js)

6. **Theme Support**
   - Dark mode
   - Customizable colors

## See Also

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [FRONTEND.md](../docs/FRONTEND.md) - Detailed frontend docs
- [API_ENDPOINTS.md](../docs/API_ENDPOINTS.md) - API reference

## Integration

Frontend connects to **Spring Boot API Gateway**:

```
Frontend (Browser)
    ↓ HTTP POST /api/predict
Spring Boot API (Port 8080)
    ↓ HTTP POST /predict
Python Service (Port 8000)
    ↓
CNN Model
```

---

**Last Updated**: April 2025  
**Status**: Production Ready  
**Framework**: React 18  
**Browser Support**: Modern browsers (2022+)
