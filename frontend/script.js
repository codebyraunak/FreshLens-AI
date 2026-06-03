document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadContent = document.getElementById('upload-content');
    const imagePreview = document.getElementById('image-preview');
    const tempSlider = document.getElementById('temp-slider');
    const tempValue = document.getElementById('temp-value');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultSection = document.getElementById('result-section');
    
    let selectedFile = null;

    // --- Temperature Slider Logic ---
    tempSlider.addEventListener('input', (e) => {
        tempValue.textContent = e.target.value;
    });

    // --- Drag and Drop Logic ---
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
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        selectedFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadContent.classList.add('hidden');
            analyzeBtn.disabled = false;
        };

        reader.readAsDataURL(file);
        
        // Hide result section if a new image is uploaded
        resultSection.classList.add('hidden');
        resultSection.style.transform = 'translateY(20px)';
        resultSection.style.opacity = '0';
    }

    // --- Analyze Button Logic ---
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        // UI Loading State
        const originalBtnText = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';
        analyzeBtn.disabled = true;

        const temperature = tempSlider.value;
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('temperature', temperature);

        try {
            // Note: This URL points to the backend we will build next.
            // For now, if the backend is not running, we simulate a response after a delay.
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
});
