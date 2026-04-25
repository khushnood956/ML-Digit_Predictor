# Testing Guide: MNIST Classifier Frontend

## Testing Without Backend (Mock API)

### Method 1: Browser DevTools Mock Response

1. Open browser DevTools (F12)
2. Go to Console tab
3. Intercept fetch calls:

```javascript
// Add this to console before testing
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/api/predict')) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({
            prediction: Math.floor(Math.random() * 10),
            confidence: 0.85 + Math.random() * 0.14,
            processing_time_ms: 45 + Math.random() * 50
          })
        });
      }, 500);
    });
  }
  return originalFetch.apply(this, args);
};

console.log('✓ Mock API enabled');
```

---

## Method 2: Local Mock Server (Node.js)

### 1. Create `mock-server.js`

```javascript
const http = require('http');

const PORT = 62421;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/predict') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Validate pixels
        if (!Array.isArray(data.pixels) || data.pixels.length !== 784) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Invalid pixel count: ' + data.pixels.length
          }));
          return;
        }

        // Simulate processing
        const delay = Math.random() * 100 + 20;
        
        setTimeout(() => {
          const response = {
            prediction: Math.floor(Math.random() * 10),
            confidence: 0.7 + Math.random() * 0.29,
            processing_time_ms: Math.round(delay)
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        }, delay);

      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n✓ Mock API server running on http://localhost:${PORT}`);
  console.log(`  Endpoint: POST http://localhost:${PORT}/api/predict`);
  console.log(`  Request:  { "pixels": [array of 784 floats] }`);
  console.log(`  Response: { "prediction": 0-9, "confidence": 0-1, "processing_time_ms": number }\n`);
});
```

### 2. Run mock server

```bash
node mock-server.js
```

Output:
```
✓ Mock API server running on http://localhost:62421
  Endpoint: POST http://localhost:62421/api/predict
  Request:  { "pixels": [array of 784 floats] }
  Response: { "prediction": 0-9, "confidence": 0-1, "processing_time_ms": number }
```

### 3. Update component API URL

In `mnist-classifier.jsx` or `mnist-classifier.html`:
```javascript
const API_URL = 'http://localhost:62421';
```

### 4. Test

1. Open HTML in browser or start React dev server
2. Draw a digit
3. Click "Predict"
4. Should see random prediction with 20-120ms response time

---

## Method 3: Docker Mock API

### Create `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

RUN echo "const http = require('http');
const PORT = 62421;
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/predict') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.pixels || data.pixels.length !== 784) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid pixels'}));
        return;
      }
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        prediction: Math.floor(Math.random() * 10),
        confidence: 0.7 + Math.random() * 0.29,
        processing_time_ms: 45
      }));
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});
server.listen(PORT, () => console.log('Mock API on port', PORT));" > server.js

EXPOSE 62421

CMD ["node", "server.js"]
```

### Run

```bash
docker build -t mnist-mock-api .
docker run -p 62421:62421 mnist-mock-api
```

---

## Testing Checklist

### Unit Tests

#### Canvas Drawing
```javascript
// Test: Canvas initializes with black background
canvasRef.current.width = 280;
canvasRef.current.height = 280;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, 280, 280);

// Verify black pixels
const imageData = ctx.getImageData(0, 0, 280, 280);
console.assert(imageData.data[0] === 0, 'First pixel R should be 0');
```

#### Pixel Array Conversion
```javascript
// Test: 280×280 canvas converts to 784-element array
const canvas = document.createElement('canvas');
canvas.width = 280;
canvas.height = 280;
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 280, 280);
const pixels = [];

for (let i = 0; i < imageData.data.length; i += 4) {
  const gray = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
  pixels.push(gray / 255);
}

console.assert(pixels.length === 784, 'Should have 784 pixels');
```

#### Image Resize
```javascript
// Test: Image resizes to 28×28
const canvas = document.createElement('canvas');
canvas.width = 28;
canvas.height = 28;
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 28, 28);

console.assert(imageData.width === 28, 'Width should be 28');
console.assert(imageData.height === 28, 'Height should be 28');
console.assert(imageData.data.length === 28 * 28 * 4, 'Should have 28*28*4 pixels');
```

### Integration Tests

#### API Call Format
```javascript
// Mock request
const pixels = new Array(784).fill(0.5);
const request = { pixels };

console.assert(request.pixels.length === 784, 'Must have 784 pixels');
console.assert(request.pixels.every(p => p >= 0 && p <= 1), 'Pixels must be 0-1');
```

#### API Response Handling
```javascript
// Valid response
const response = {
  prediction: 5,
  confidence: 0.95,
  processing_time_ms: 45
};

console.assert(response.prediction >= 0 && response.prediction <= 9, 'Prediction 0-9');
console.assert(response.confidence >= 0 && response.confidence <= 1, 'Confidence 0-1');
console.assert(response.processing_time_ms > 0, 'Time must be positive');
```

---

## Manual Testing Steps

### Test 1: Draw and Predict
1. ✓ Open application
2. ✓ Canvas is black with white brush
3. ✓ Draw a digit (e.g., "5")
4. ✓ Click "Predict"
5. ✓ See prediction, confidence, and time
6. ✓ Prediction should be random (if using mock)

### Test 2: Upload and Predict
1. ✓ Switch to "Upload" tab
2. ✓ Click "Choose Image"
3. ✓ Select a digit image
4. ✓ Image preview appears
5. ✓ Click "Predict"
6. ✓ See result

### Test 3: Clear and Reset
1. ✓ Draw a digit
2. ✓ Click "Clear"
3. ✓ Canvas is empty
4. ✓ Result disappears
5. ✓ Predict button is disabled (no input)

### Test 4: Error Handling
1. ✓ Try to predict with empty canvas
2. ✓ See error message
3. ✓ Upload invalid file
4. ✓ See appropriate error
5. ✓ Network error (disconnect API)
6. ✓ See connection error

### Test 5: Loading State
1. ✓ Click Predict
2. ✓ See "Processing..." with spinner
3. ✓ Button is disabled
4. ✓ After response, button enabled
5. ✓ Result shown

---

## Browser Console Testing

### Verify Component Loads
```javascript
console.log(typeof MNISTClassifier);  // Should be 'function'
```

### Test Pixel Array Generation
```javascript
const testPixels = new Array(784).fill(0.5);
console.log('Pixel count:', testPixels.length);  // 784
console.log('Valid range:', testPixels.every(p => p >= 0 && p <= 1));  // true
```

### Mock API Response
```javascript
fetch('http://localhost:62421/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pixels: new Array(784).fill(0.5) })
})
.then(r => r.json())
.then(d => console.log('Response:', d));
```

---

## Performance Benchmarks

### Expected Timings (Mock API)
- Draw to pixel array: 0-5ms
- Canvas rendering: 1-2ms
- Image resize: 2-5ms
- Network request: 20-100ms (mock delay)
- Total end-to-end: 30-150ms

### Real API (Backend Processing)
- Frontend processing: 5-10ms
- Network latency: 10-50ms
- Backend ML inference: 20-100ms
- Total: 40-200ms

---

## Debugging Tips

### Canvas Issues
```javascript
// Check canvas is 280x280
console.log('Canvas:', canvasRef.current.width, canvasRef.current.height);

// Check context exists
console.log('Context:', contextRef.current);

// Check for drawing
const imageData = contextRef.current.getImageData(0, 0, 280, 280);
console.log('Non-black pixels:', imageData.data.filter(v => v > 0).length);
```

### API Issues
```javascript
// Log request
console.log('Sending pixels:', pixels.length, pixels.slice(0, 5));

// Log response
fetch('...').then(r => r.json()).then(d => console.log('Response:', d));
```

### State Issues
```javascript
// React DevTools: Install React DevTools extension
// Check: inputMode, uploadedImage, result, loading, error
```

---

## Production Testing

Before deploying to production:

1. ✓ Test with real backend API
2. ✓ Test with various image sizes
3. ✓ Test error scenarios
4. ✓ Test on mobile (canvas touch events)
5. ✓ Test CORS configuration
6. ✓ Load test with multiple predictions
7. ✓ Network throttling tests (slow 3G, etc.)

---

## Questions?

Check:
1. Browser console for errors
2. Network tab for API requests
3. Mock server logs
4. Component state with React DevTools