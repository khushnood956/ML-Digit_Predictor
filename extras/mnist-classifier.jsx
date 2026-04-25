import React, { useState, useRef, useEffect } from 'react';

const MNISTClassifier = () => {
   console.log('[APP] Component mounted/rendered');
  const [inputMode, setInputMode] = useState('canvas');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const API_URL = 'http://localhost:8080';

  // Initialize canvas
  useEffect(() => {
    if (inputMode === 'canvas') {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        contextRef.current = context;
      }
    }
  }, [inputMode]);

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.strokeStyle = '#ffffff';
    contextRef.current.lineWidth = 8;
    contextRef.current.lineCap = 'round';
    contextRef.current.lineJoin = 'round';
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  // Resize image to 28x28
  const resizeImage = async (imgData, targetSize = 28) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = targetSize;
      canvas.height = targetSize;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, targetSize, targetSize);
        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        resolve(imageData);
      };
      img.src = imgData;
    });
  };

  // Convert image to grayscale and flatten
  const imageToPixelArray = (imageData) => {
    const data = imageData.data;
    const pixels = [];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r + g + b) / 3;
      pixels.push(gray / 255);
    }

    return pixels;
  };

// two helper functions added for debugging
      // Debug visualization: render 28×28 pixel array to a canvas
      const visualizePixelArray = (pixels) => {
        const debugCanvas = document.getElementById('debug-canvas') || createDebugCanvas();
        const ctx = debugCanvas.getContext('2d');
        
        const imageData = ctx.createImageData(28, 28);
        const data = imageData.data;
        
        for (let i = 0; i < pixels.length; i++) {
          const normalized = pixels[i];
          const gray = Math.round(normalized * 255);
          
          data[i * 4 + 0] = gray;      // R
          data[i * 4 + 1] = gray;      // G
          data[i * 4 + 2] = gray;      // B
          data[i * 4 + 3] = 255;       // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log(`[DEBUG] Visualization rendered to debug canvas`);
      };

      // Create a debug canvas if it doesn't exist
      const createDebugCanvas = () => {
        let debugCanvas = document.getElementById('debug-canvas');
        if (!debugCanvas) {
          debugCanvas = document.createElement('canvas');
          debugCanvas.id = 'debug-canvas';
          debugCanvas.width = 28;
          debugCanvas.height = 28;
          debugCanvas.style.cssText = `
            border: 1px solid red;
            image-rendering: pixelated;
            display: block;
            margin: 10px auto;
            width: 280px;
            height: 280px;
          `;
          
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.appendChild(debugCanvas);
          } else {
            document.body.appendChild(debugCanvas);
          }
        }
        return debugCanvas;
      };
////////////////////////////////////////////



  // Convert canvas to pixel array
// Convert canvas to pixel array WITH DEBUGGING
const canvasToPixelArray = async () => {
   console.log('[CANVAS_TO_PIXELS] Function started');
  const canvas = canvasRef.current;

    if (!canvas) {
    console.error('[CANVAS_TO_PIXELS] Canvas ref is null!');
    throw new Error('Canvas reference not found');
  }

    console.log('[CANVAS_TO_PIXELS] Canvas found:', canvas);
  
  
  
  // STEP 1: Log raw canvas resolution
  console.log(`[CANVAS] Raw display canvas: ${canvas.width}×${canvas.height}px`);
  
  // STEP 2: Sample raw canvas pixels before downscaling
  const rawCtx = canvas.getContext('2d');
  const rawSample = rawCtx.getImageData(0, 0, 10, 10);
  const rawPixels = rawSample.data;
  console.log(`[CANVAS] Raw RGBA sample (first 4 pixels):`, [
    `[${rawPixels[0]},${rawPixels[1]},${rawPixels[2]},${rawPixels[3]}]`,
    `[${rawPixels[4]},${rawPixels[5]},${rawPixels[6]},${rawPixels[7]}]`,
    `[${rawPixels[8]},${rawPixels[9]},${rawPixels[10]},${rawPixels[11]}]`,
    `[${rawPixels[12]},${rawPixels[13]},${rawPixels[14]},${rawPixels[15]}]`
  ]);
  
  // STEP 3: Downscale to 28×28
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = 28;
  resizedCanvas.height = 28;
  
  const resizedCtx = resizedCanvas.getContext('2d');
  resizedCtx.drawImage(canvas, 0, 0, 28, 28);
  
  console.log(`[RESIZE] Downscaled to: 28×28px`);
  
  // STEP 4: Extract 28×28 image data
  const imageData = resizedCtx.getImageData(0, 0, 28, 28);
  const data = imageData.data;
  
  console.log(`[IMAGEDATA] Total RGBA values: ${data.length}, Expected for 28×28: ${28*28*4}`);
  
  // STEP 5: Convert to grayscale with validation
  const pixels = [];
  let minGray = 255;
  let maxGray = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const gray = (r + g + b) / 3;
    const normalized = gray / 255;
    
    pixels.push(normalized);
    minGray = Math.min(minGray, gray);
    maxGray = Math.max(maxGray, gray);
  }
  
  console.log(`[GRAYSCALE] Pixel count: ${pixels.length}, Expected: 784`);
  console.log(`[GRAYSCALE] Min intensity: ${minGray}, Max intensity: ${maxGray}`);
  console.log(`[GRAYSCALE] Contrast range: ${(maxGray - minGray).toFixed(2)}/255`);
  
  if (pixels.length !== 784) {
    console.error(`[ERROR] Invalid pixel count! Got ${pixels.length}, expected 784`);
    throw new Error(`Invalid pixel array length: ${pixels.length}`);
  }
  
  // STEP 6: Visualize 28×28 on debug canvas
  visualizePixelArray(pixels);
  
  console.log(`[SUCCESS] Pixel array ready:`, {
    length: pixels.length,
    minValue: Math.min(...pixels),
    maxValue: Math.max(...pixels),
    sample: pixels.slice(0, 5)
  });
  
  return pixels;
};

// const handlePredict = async () => {
//   setError(null);
//   setResult(null);
//   setLoading(true);

//   try {
//     let pixels;

//     if (inputMode === 'canvas') {
//       pixels = await canvasToPixelArray();
//     } else if (uploadedImage) {
//       const resizedImage = await resizeImage(uploadedImage, 28);
//       pixels = imageToPixelArray(resizedImage);
//     } else {
//       setError('Please upload an image or draw a digit.');
//       setLoading(false);
//       return;
//     }

//     if (!pixels || pixels.length !== 784) {
//       setError(`Invalid pixel count: ${pixels ? pixels.length : 'undefined'}. Expected 784.`);
//       setLoading(false);
//       return;
//     }

//     const startTime = performance.now();

//     const response = await fetch(`${API_URL}/api/predict`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ pixels }),
//     });

//     if (!response.ok) {
//       throw new Error(`API error: ${response.status}`);
//     }

//     const data = await response.json();
//     const endTime = performance.now();

//     setResult({
//       prediction: data.prediction,
//       confidence: (data.confidence * 100).toFixed(2),
//       processing_time_ms: Math.round(endTime - startTime),
//     });
//   } catch (err) {
//     setError(`Failed to predict: ${err.message}`);
//   } finally {
//     setLoading(false);
//   }
// };






  // Handle file upload
  
  
  const handlePredict = async () => {
  console.log('[PREDICT] Starting prediction...');
  setError(null);
  setResult(null);
  setLoading(true);

  try {
    let pixels;

    console.log('[PREDICT] Input mode:', inputMode);

    if (inputMode === 'canvas') {
      console.log('[PREDICT] Calling canvasToPixelArray...');
      try {
        pixels = await canvasToPixelArray();
        console.log('[PREDICT] canvasToPixelArray returned:', pixels);
        console.log('[PREDICT] pixels type:', typeof pixels);
        console.log('[PREDICT] pixels is array:', Array.isArray(pixels));
        console.log('[PREDICT] pixels length:', pixels ? pixels.length : 'undefined');
      } catch (innerErr) {
        console.error('[PREDICT] Error in canvasToPixelArray:', innerErr);
        throw innerErr;
      }
    } else if (uploadedImage) {
      console.log('[PREDICT] Processing uploaded image...');
      const resizedImage = await resizeImage(uploadedImage, 28);
      pixels = imageToPixelArray(resizedImage);
    } else {
      console.warn('[PREDICT] No input provided');
      setError('Please upload an image or draw a digit.');
      setLoading(false);
      return;
    }

    console.log('[PREDICT] Final pixels check - length:', pixels ? pixels.length : 'UNDEFINED');

    if (!pixels || pixels.length !== 784) {
      const errMsg = `Invalid pixel count: ${pixels ? pixels.length : 'undefined'}. Expected 784.`;
      console.error('[PREDICT]', errMsg);
      setError(errMsg);
      setLoading(false);
      return;
    }

    console.log('[PREDICT] Pixel validation passed, sending to API...');
    const startTime = performance.now();

    const response = await fetch(`${API_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pixels }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const endTime = performance.now();

    console.log('[PREDICT] API response:', data);

    setResult({
      prediction: data.prediction,
      confidence: (data.confidence * 100).toFixed(2),
      processing_time_ms: Math.round(endTime - startTime),
    });
  } catch (err) {
    console.error('[PREDICT] Fatal error:', err);
    setError(`Failed to predict: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Predict

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    contextRef.current.fillStyle = '#000000';
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
    setResult(null);
    setError(null);
  };

  // Clear upload
  const clearUpload = () => {
    setUploadedImage(null);
    setResult(null);
    setError(null);
  };

  const canPredict = inputMode === 'canvas' || uploadedImage;

  return (
    <div style={styles.container}>
      <style>{css}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Digit Classification System</h1>
        <p style={styles.subtitle}>Upload or draw a digit (0–9) for prediction</p>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Input Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Input</h2>

          {/* Mode Tabs */}
          <div style={styles.modeTabs}>
            <button
              style={{
                ...styles.modeTab,
                ...(inputMode === 'canvas' ? styles.modeTabActive : styles.modeTabInactive),
              }}
              onClick={() => {
                setInputMode('canvas');
                setUploadedImage(null);
                setResult(null);
              }}
            >
              Draw
            </button>
            <button
              style={{
                ...styles.modeTab,
                ...(inputMode === 'upload' ? styles.modeTabActive : styles.modeTabInactive),
              }}
              onClick={() => {
                setInputMode('upload');
                clearCanvas();
              }}
            >
              Upload
            </button>
          </div>

          {/* Canvas Input */}
          {inputMode === 'canvas' && (
            <div style={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={styles.canvas}
              />
              <p style={styles.canvasHint}>Draw a digit with your mouse</p>
              <button style={styles.buttonSecondary} onClick={clearCanvas}>
                Clear
              </button>
            </div>
          )}

          {/* Upload Input */}
          {inputMode === 'upload' && (
            <div style={styles.uploadContainer}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={styles.fileInput}
                id="file-input"
              />
              <label htmlFor="file-input" style={styles.fileLabel}>
                Choose Image
              </label>
              {uploadedImage && (
                <div style={styles.uploadedImageContainer}>
                  <img src={uploadedImage} alt="Uploaded" style={styles.uploadedImage} />
                  <button style={styles.buttonSecondary} onClick={clearUpload}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Predict Button */}
<button
  style={{
    ...styles.buttonPrimary,
    ...(loading || !canPredict ? styles.buttonDisabled : {}),
  }}
  onClick={() => {
    console.log('[BUTTON] Click detected!');
    handlePredict();
  }}
  disabled={loading || !canPredict}
>
  {loading ? (
    <span style={styles.spinner}>
      <span style={styles.spinnerDot}></span> Processing...
    </span>
  ) : (
    'Predict'
  )}
</button>
        </div>

        {/* Result Section */}
        {(result || error) && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Result</h2>

            {error && <div style={styles.errorBox}>{error}</div>}

            {result && (
              <div style={styles.resultBox}>
                <div style={styles.predictionDisplay}>
                  <span style={styles.predictionLabel}>Predicted Digit</span>
                  <span style={styles.predictionValue}>{result.prediction}</span>
                </div>

                <div style={styles.resultDetails}>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Confidence</span>
                    <span style={styles.resultValue}>{result.confidence}%</span>
                  </div>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Processing Time</span>
                    <span style={styles.resultValue}>{result.processing_time_ms}ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
    padding: '40px 20px',
    color: '#000000',
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
    maxWidth: '600px',
    margin: '0 auto 60px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    letterSpacing: '-0.5px',
    margin: '0 0 12px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666666',
    margin: '0',
    lineHeight: '1.6',
  },
  mainContent: {
    maxWidth: '500px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  section: {
    padding: '32px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 20px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#000000',
  },
  modeTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  modeTab: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 200ms ease',
    color: '#666666',
  },
  modeTabActive: {
    color: '#000000',
    borderBottomColor: '#000000',
  },
  modeTabInactive: {
    color: '#999999',
  },
  canvasContainer: {
    marginBottom: '24px',
  },
  canvas: {
    display: 'block',
    width: '280px',
    height: '280px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    cursor: 'crosshair',
    backgroundColor: '#000000',
    margin: '0 auto 16px',
    boxShadow: 'inset 0 0 0 1px #d0d0d0',
  },
  canvasHint: {
    fontSize: '13px',
    color: '#999999',
    textAlign: 'center',
    margin: '8px 0 16px',
  },
  uploadContainer: {
    marginBottom: '24px',
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    display: 'block',
    padding: '16px',
    border: '1px dashed #d0d0d0',
    borderRadius: '4px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666666',
    transition: 'all 200ms ease',
    backgroundColor: '#ffffff',
  },
  uploadedImageContainer: {
    marginTop: '16px',
    textAlign: 'center',
  },
  uploadedImage: {
    maxWidth: '200px',
    maxHeight: '200px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    marginBottom: '12px',
    display: 'block',
    margin: '0 auto 12px',
  },
  buttonPrimary: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  buttonSecondary: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
    color: '#666666',
  },
  spinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinnerDot: {
    display: 'inline-block',
    width: '4px',
    height: '4px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  resultBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '24px',
  },
  predictionDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  predictionLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  predictionValue: {
    fontSize: '56px',
    fontWeight: '700',
    color: '#000000',
    lineHeight: '1',
  },
  resultDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  resultLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  resultValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#000000',
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #ffc4c4',
    borderRadius: '4px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#c41e3a',
    lineHeight: '1.5',
  },
};

const css = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  button:hover {
    opacity: 0.85;
  }

  label:hover {
    background-color: #f5f5f5;
  }

  input[type="file"] + label {
    user-select: none;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
  }
`;

export default MNISTClassifier;