# MNIST Digit Classification Frontend

## Quick Start

### Option 1: Standalone HTML (No Build Required)
1. Replace `{{SPRING_BOOT_API_URL}}` in `mnist-classifier.html` with your API URL (e.g., `http://localhost:62421`)
2. Open the HTML file in a browser
3. Start drawing or uploading images

### Option 2: React Component (Node/Vite/CRA)
1. Copy `mnist-classifier.jsx` into your React project
2. Replace `{{SPRING_BOOT_API_URL}}` with your API URL
3. Import and use: `<MNISTClassifier />`

---

## File Structure

```
mnist-classifier.html     # Standalone HTML + React (via CDN)
mnist-classifier.jsx      # React component (for build tools)
```

---

## API Integration

### Endpoint
```
POST {{SPRING_BOOT_API_URL}}/api/predict
```

### Request Format
```json
{
  "pixels": [array of 784 float values (0-1)]
}
```

### Response Format
```json
{
  "prediction": 7,
  "confidence": 0.98,
  "processing_time_ms": 45
}
```

### Example API URL
Replace `{{SPRING_BOOT_API_URL}}` with:
- Local: `http://localhost:62421`
- Remote: `https://api.example.com`

---

## Features

### Input Methods
1. **Draw Mode**: Paint a digit on a 280×280 canvas
   - Black background, white brush strokes
   - Line width: 8px
   - Automatically converted to 28×28 MNIST format

2. **Upload Mode**: Upload an image file
   - Automatically resized to 28×28
   - Converted to grayscale
   - Normalized to 0-1 range

### Data Processing Pipeline
1. Canvas or uploaded image → pixel data
2. Resize to 28×28
3. Convert to grayscale (if color)
4. Normalize: pixel_value / 255
5. Flatten to 784-element array
6. Send to API

### Result Display
- **Predicted Digit**: Large, bold display
- **Confidence**: Percentage (0-100%)
- **Processing Time**: Milliseconds from browser to server and back

### UX Features
- Loading state with animated spinner
- Error handling with clear messages
- Disable prediction button if no input
- Clear/Remove buttons to reset state
- Tab-based mode switching (Draw/Upload)

---

## Customization

### Change API URL
**HTML file:**
```javascript
const API_URL = 'http://localhost:62421';
```

**React component:**
```javascript
const API_URL = 'http://localhost:62421';
```

### Adjust Canvas Size
Default: 280×280 pixels (rendered size for 28×28 actual input)

In the drawing section, change:
```javascript
<canvas
  ref={canvasRef}
  width={280}      // ← Change here
  height={280}     // ← Change here
  ...
/>
```

### Change Colors
Brush color: Edit `contextRef.current.strokeStyle = '#ffffff'` (white)
Canvas background: Edit `context.fillStyle = '#000000'` (black)

### Adjust Styling
All styles are defined as inline objects or CSS classes.
Modify colors, spacing, fonts in the `styles` object or CSS section.

---

## Browser Compatibility
- Chrome/Chromium: ✓
- Firefox: ✓
- Safari: ✓
- Edge: ✓

Requires: Canvas API, Fetch API, File API

---

## Troubleshooting

### "Failed to predict: Failed to fetch"
- Check API URL is correct
- Ensure API server is running
- Check browser console for CORS errors

### "Invalid pixel count: X. Expected 784"
- Image processing failed
- For uploads: ensure image is valid
- For canvas: ensure canvas is properly initialized

### Prediction button disabled
- For Draw mode: canvas must have content
- For Upload mode: image must be uploaded first

### Connection errors
- Verify API URL in code matches running server
- Check firewall/network settings
- Ensure API is listening on correct port

---

## Performance Notes

- Canvas rendering: ~0.5ms
- Image resize: ~2-5ms
- Network request: Depends on server/latency
- Processing time includes server execution

---

## Architecture

### Component Hierarchy (React)
```
MNISTClassifier
├── UploadInput (handled in inputMode === 'upload')
├── CanvasInput (handled in inputMode === 'canvas')
├── ResultDisplay (shows when result || error)
└── ErrorDisplay (child of ResultDisplay)
```

### State Management
```javascript
inputMode              // 'canvas' or 'upload'
uploadedImage          // Base64 data URL
result                 // {prediction, confidence, processing_time_ms}
loading                // true during API call
error                  // Error message string
isDrawing              // true while user is drawing
```

### Key Functions
- `canvasToPixelArray()`: Convert canvas to pixel array
- `imageToPixelArray()`: Convert uploaded image to pixel array
- `resizeImage()`: Resize to 28×28
- `handlePredict()`: Orchestrate prediction flow
- `startDrawing/draw/stopDrawing()`: Canvas event handlers

---

## Development Tips

### Testing Locally
1. Start Spring Boot API on `http://localhost:62421`
2. Open HTML file in browser or run React dev server
3. Draw a digit and click Predict
4. Check browser console for errors

### Debug Pixel Array
Add this before sending to API:
```javascript
console.log('Pixel array length:', pixels.length);
console.log('First 10 pixels:', pixels.slice(0, 10));
console.log('Min:', Math.min(...pixels), 'Max:', Math.max(...pixels));
```

### Test with Static Data
```javascript
const testPixels = new Array(784).fill(0);
testPixels[392] = 1; // Set middle pixel to white
console.log('Testing with pixels:', testPixels);
```

---

## Styling System

### Colors
- Background: `#ffffff` (white)
- Text: `#000000` (black)
- Secondary text: `#666666` / `#999999` (gray)
- Borders: `#e0e0e0` (light gray)
- Errors: `#c41e3a` (red)
- Section bg: `#fafafa` (off-white)

### Typography
- Font Family: System fonts (SF Pro, Segoe UI, Helvetica)
- Title: 32px, 600 weight
- Section title: 16px, 600 weight, uppercase
- Body: 14px, 400 weight
- Labels: 12px, 600 weight, uppercase

### Spacing
- Section padding: 32px
- Gap between sections: 40px
- Container max-width: 500px

### Borders & Radius
- Border radius: 4px
- Border color: `#e0e0e0`
- Canvas border: 1px solid + inset shadow

---

## CORS Configuration

If API is on different domain, ensure CORS headers are set:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## License
Use as needed. No external dependencies beyond React.