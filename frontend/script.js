document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const btnCameraMode = document.getElementById('btn-camera-mode');
    const btnUploadMode = document.getElementById('btn-upload-mode');
    const cameraSection = document.getElementById('camera-section');
    const uploadSection = document.getElementById('upload-section');
    const previewContainer = document.getElementById('preview-container');
    const retakeBtn = document.getElementById('retake-btn');
    
    // Upload Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    
    // Camera Elements
    const cameraFeed = document.getElementById('camera-feed');
    const cameraOverlay = document.getElementById('camera-overlay');
    const captureBtn = document.getElementById('capture-btn');
    const cameraCanvas = document.getElementById('camera-canvas');
    
    // Control Elements
    const tempValue = document.getElementById('temp-value');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultSection = document.getElementById('result-section');
    const envFridgeBtn = document.getElementById('env-fridge');
    const envRoomBtn = document.getElementById('env-room');
    const roomBadge = document.getElementById('room-badge');
    const envNote = document.getElementById('env-note');
    
    let selectedFile = null;
    let cameraStream = null;
    let currentMode = 'fridge'; // 'fridge' or 'room'

    // --- Mode Toggling ---
    btnCameraMode.addEventListener('click', () => {
        setMode('camera');
    });

    btnUploadMode.addEventListener('click', () => {
        setMode('upload');
    });

    function setMode(mode) {
        // Reset preview state
        clearSelection();

        if (mode === 'camera') {
            btnCameraMode.classList.add('active');
            btnUploadMode.classList.remove('active');
            cameraSection.classList.remove('hidden');
            uploadSection.classList.add('hidden');
            startCamera();
        } else {
            btnUploadMode.classList.add('active');
            btnCameraMode.classList.remove('active');
            uploadSection.classList.remove('hidden');
            cameraSection.classList.add('hidden');
            stopCamera();
        }
    }

    // --- Camera Logic ---
    async function startCamera() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            cameraFeed.srcObject = cameraStream;
            cameraOverlay.classList.add('hidden');
        } catch (error) {
            console.error("Camera access denied or error:", error);
            cameraOverlay.classList.remove('hidden');
            cameraOverlay.querySelector('p').textContent = "Camera access denied or unavailable";
        }
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    captureBtn.addEventListener('click', () => {
        if (!cameraStream) return;
        
        const context = cameraCanvas.getContext('2d');
        cameraCanvas.width = cameraFeed.videoWidth;
        cameraCanvas.height = cameraFeed.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);
        
        // Convert canvas to a blob/file
        cameraCanvas.toBlob((blob) => {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            handleFile(file, cameraCanvas.toDataURL('image/jpeg'));
        }, 'image/jpeg', 0.9);
        
        stopCamera();
    });

    // --- Drag and Drop Upload Logic ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleUpload(e.target.files[0]);
        }
    });

    function handleUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            handleFile(file, e.target.result);
        };
        reader.readAsDataURL(file);
    }

    // --- Shared File Handling ---
    function handleFile(file, dataUrl) {
        selectedFile = file;
        
        // Show preview
        imagePreview.src = dataUrl;
        previewContainer.classList.remove('hidden');
        
        // Hide inputs
        cameraSection.classList.add('hidden');
        uploadSection.classList.add('hidden');
        
        analyzeBtn.disabled = false;
        
        // Hide result section if a new image is selected
        resultSection.classList.add('hidden');
        resultSection.style.transform = 'translateY(20px)';
        resultSection.style.opacity = '0';
    }

    function clearSelection() {
        selectedFile = null;
        imagePreview.src = "";
        previewContainer.classList.add('hidden');
        analyzeBtn.disabled = true;
        resultSection.classList.add('hidden');
    }

    retakeBtn.addEventListener('click', () => {
        if (btnCameraMode.classList.contains('active')) {
            setMode('camera');
        } else {
            setMode('upload');
        }
    });

    // --- Environment Toggle Logic ---
    envFridgeBtn.addEventListener('click', () => {
        currentMode = 'fridge';
        envFridgeBtn.classList.add('active');
        envRoomBtn.classList.remove('active');
        roomBadge.classList.add('hidden');
        envNote.textContent = 'Set to standard 4°C';
    });

    envRoomBtn.addEventListener('click', () => {
        currentMode = 'room';
        envRoomBtn.classList.add('active');
        envFridgeBtn.classList.remove('active');
        roomBadge.classList.remove('hidden');
        envNote.textContent = 'Will be detected via weather API';
        tempValue.textContent = 'Detecting...';
    });

    // --- Analyze Button & Weather Logic ---
    async function fetchTemperature() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(20); // Default if unsupported
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                        const data = await response.json();
                        resolve(data.current_weather.temperature);
                    } catch (err) {
                        resolve(20);
                    }
                },
                () => { resolve(20); } // Default if denied
            );
        });
    }

    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        // UI Loading State
        const originalBtnText = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';
        analyzeBtn.disabled = true;

        let temperature = 4; // Default to fridge

        if (currentMode === 'room') {
            analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching Weather...';
            tempValue.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            temperature = await fetchTemperature();
            tempValue.textContent = `${temperature}°C`;
            analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';
        }

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('temperature', temperature);

        try {
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            displayResult(data, temperature);

        } catch (error) {
            console.log('Backend not detected or error occurred. Simulating response for UI demonstration.');
            // Simulate API delay
            setTimeout(() => {
                const isStale = Math.random() > 0.5;
                const simulatedData = {
                    item: 'Apple',
                    status: isStale ? 'Stale' : (Math.random() > 0.8 ? 'Unripe' : 'Fresh'),
                    confidence: (Math.random() * 20 + 80).toFixed(1), // 80-100%
                    shelf_life: isStale ? '0 Days (Do not consume)' : `${Math.max(1, 10 - Math.floor(temperature/5))} Days`
                };
                displayResult(simulatedData, temperature);
            }, 1500);
        } finally {
            analyzeBtn.innerHTML = originalBtnText;
            analyzeBtn.disabled = false;
        }
    });

    function displayResult(data, temperature) {
        // Update DOM elements
        const statusBadge = document.getElementById('status-badge');
        document.getElementById('res-item').textContent = data.item;
        
        const confBar = document.getElementById('res-confidence');
        confBar.style.width = '0%'; // Reset for animation
        setTimeout(() => { confBar.style.width = `${data.confidence}%`; }, 100);
        document.getElementById('res-confidence-text').textContent = `${data.confidence}%`;
        
        document.getElementById('res-shelflife').textContent = data.shelf_life;
        document.getElementById('res-temp-note').textContent = `At ${temperature}°C`;

        // Update badge styling
        statusBadge.textContent = data.status;
        statusBadge.className = 'badge'; // reset
        
        if (data.status.toLowerCase() === 'fresh') {
            statusBadge.classList.add('fresh');
        } else if (data.status.toLowerCase() === 'stale' || data.status.toLowerCase() === 'rotten') {
            statusBadge.classList.add('stale');
        } else {
            statusBadge.classList.add('unripe');
        }

        // Show section with animation
        resultSection.classList.remove('hidden');
        
        // Trigger reflow for animation
        void resultSection.offsetWidth; 
        
        resultSection.style.transition = 'all 0.5s ease-out';
        resultSection.style.opacity = '1';
        resultSection.style.transform = 'translateY(0)';
        
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Initialize Camera Mode automatically on load
    startCamera();
});
