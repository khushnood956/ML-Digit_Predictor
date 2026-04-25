# Setup Guide: React Integration

## Option A: Vite (Recommended - Fastest)

### 1. Create project
```bash
npm create vite@latest mnist-classifier -- --template react
cd mnist-classifier
npm install
```

### 2. Add component
- Copy `mnist-classifier.jsx` to `src/components/`
- Update API URL in the component

### 3. Use in App
**src/App.jsx:**
```javascript
import MNISTClassifier from './components/mnist-classifier';

function App() {
  return <MNISTClassifier />;
}

export default App;
```

### 4. Run
```bash
npm run dev
```

Open `http://localhost:5173`

---

## Option B: Create React App (CRA)

### 1. Create project
```bash
npx create-react-app mnist-classifier
cd mnist-classifier
```

### 2. Add component
- Copy `mnist-classifier.jsx` to `src/components/`
- Update API URL in the component

### 3. Use in App
**src/App.js:**
```javascript
import MNISTClassifier from './components/mnist-classifier';

function App() {
  return <MNISTClassifier />;
}

export default App;
```

### 4. Run
```bash
npm start
```

Opens `http://localhost:3000`

---

## Option C: Standalone HTML (No Setup)

1. Open `mnist-classifier.html` directly in browser
2. Replace `{{SPRING_BOOT_API_URL}}` with your API URL
3. Done - no build tools required

---

## Environment Variables

### Vite
Create `.env`:
```
VITE_API_URL=http://localhost:62421
```

Update component:
```javascript
const API_URL = import.meta.env.VITE_API_URL || '{{SPRING_BOOT_API_URL}}';
```

### CRA
Create `.env`:
```
REACT_APP_API_URL=http://localhost:62421
```

Update component:
```javascript
const API_URL = process.env.REACT_APP_API_URL || '{{SPRING_BOOT_API_URL}}';
```

---

## Quick API URL Configuration

### Before deployment, replace in code:

**Vite:**
```bash
# In component
const API_URL = import.meta.env.VITE_API_URL;
```

**CRA:**
```bash
# In component
const API_URL = process.env.REACT_APP_API_URL;
```

**HTML/Standalone:**
```javascript
// In script section
const API_URL = 'http://your-api-url.com';
```

---

## Testing the Component

### 1. Start your Spring Boot API
```bash
java -jar your-app.jar
# Should run on http://localhost:62421 or configured port
```

### 2. Start React dev server
```bash
npm run dev  # or npm start for CRA
```

### 3. Open browser
Navigate to `http://localhost:5173` (Vite) or `http://localhost:3000` (CRA)

### 4. Test
- Draw a digit on the canvas
- Click "Predict"
- Should see result in 50-200ms
- Check browser console for any errors

---

## Deployment

### Vite
```bash
npm run build
# Creates optimized build in dist/
# Deploy dist/ folder to your hosting
```

### CRA
```bash
npm run build
# Creates optimized build in build/
# Deploy build/ folder to your hosting
```

### Standalone HTML
- No build required
- Just update API URL and upload HTML file
- Works anywhere (GitHub Pages, etc.)

---

## Common Issues

### API not responding
1. Check API URL is correct in code
2. Verify API server is running
3. Check CORS is configured on backend

### Image upload not working
1. Check browser console for errors
2. Verify file is a valid image
3. Check image size (should work for any size)

### Canvas not initializing
1. Check browser supports Canvas API
2. Verify React useEffect is running
3. Check browser console errors

### Pixel array validation fails
1. Canvas: 280×280 → 28×28 should always be 784
2. Image: After resize to 28×28 should be 784
3. Check for errors in resizeImage function

---

## Project Structure (Recommended)

```
project/
├── src/
│   ├── components/
│   │   └── mnist-classifier.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── vite.config.js
└── package.json
```

---

## Next Steps

1. ✓ Copy component file
2. ✓ Set up React project (Vite/CRA) or use HTML
3. ✓ Configure API URL
4. ✓ Start API server
5. ✓ Run dev server
6. ✓ Test in browser
7. ✓ Deploy when ready

---

## Support Files

- `mnist-classifier.jsx` - React component
- `mnist-classifier.html` - Standalone version
- `INTEGRATION_GUIDE.md` - Detailed API & customization
- This file - Setup instructions

All files are self-contained and have no external dependencies beyond React.