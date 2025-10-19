document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const controlsArea = document.getElementById('controlsArea');
    const previewImage = document.getElementById('previewImage');
    const originalInfo = document.getElementById('originalInfo');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const resizeByDimBtn = document.getElementById('resizeByDimBtn');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const resultArea = document.getElementById('resultArea');
    const resultImage = document.getElementById('resultImage');
    const resultInfo = document.getElementById('resultInfo');
    const downloadLink = document.getElementById('downloadLink');
    const resetBtn = document.getElementById('resetBtn');

    let originalImageFile = null;
    let originalWidth, originalHeight;

    // --- Upload Logic ---
    uploadArea.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFile(files[0]);
        }
    });
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        originalImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            const img = new Image();
            img.onload = () => {
                originalWidth = img.width;
                originalHeight = img.height;
                widthInput.value = originalWidth;
                heightInput.value = originalHeight;
                originalInfo.textContent = `Original: ${originalWidth}x${originalHeight}px, ${(file.size / 1024).toFixed(2)} KB`;
                uploadArea.style.display = 'none';
                controlsArea.style.display = 'flex';
                resultArea.style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // --- Reset Logic ---
    resetBtn.addEventListener('click', () => {
        originalImageFile = null;
        imageInput.value = '';
        uploadArea.style.display = 'block';
        controlsArea.style.display = 'none';
    });

    // --- Resizing Logic ---
    function resizeImage(img, width, height, targetSizeKB) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            if (targetSizeKB) {
                // Iterative compression for target file size
                let quality = 0.9;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                let blob = dataURLtoBlob(dataUrl);

                // Simple iterative approach to find the right quality
                const findBestQuality = () => {
                    if (blob.size / 1024 <= targetSizeKB || quality <= 0.1) {
                        resolve({ dataUrl, blob });
                        return;
                    }
                    quality -= 0.05;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                    blob = dataURLtoBlob(dataUrl);
                    requestAnimationFrame(findBestQuality);
                };
                findBestQuality();

            } else {
                // Simple resize by dimension
                const dataUrl = canvas.toDataURL(originalImageFile.type);
                const blob = dataURLtoBlob(dataUrl);
                resolve({ dataUrl, blob });
            }
        });
    }

    function displayResult(dataUrl, blob, width, height) {
        resultImage.src = dataUrl;
        resultInfo.textContent = `Resized: ${width}x${height}px, ${(blob.size / 1024).toFixed(2)} KB`;
        downloadLink.href = dataUrl;
        const fileExtension = originalImageFile.name.split('.').pop();
        downloadLink.download = `resized-${Date.now()}.${fileExtension}`;
        resultArea.style.display = 'block';
    }

    // Event listener for "Resize by Dimensions" button
    resizeByDimBtn.addEventListener('click', () => {
        const width = parseInt(widthInput.value, 10);
        const height = parseInt(heightInput.value, 10);
        if (!width || !height || width <= 0 || height <= 0) {
            alert('Please enter valid positive dimensions.');
            return;
        }

        const img = new Image();
        img.onload = async () => {
            const { dataUrl, blob } = await resizeImage(img, width, height);
            displayResult(dataUrl, blob, width, height);
        };
        img.src = previewImage.src;
    });

    // Event listeners for target size buttons
    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSize = parseInt(button.dataset.size, 10);
            const img = new Image();
            img.onload = async () => {
                const aspectRatio = img.width / img.height;
                // Start with original dimensions, the resize will happen via compression
                let newWidth = img.width;
                let newHeight = img.height;
                
                const { dataUrl, blob } = await resizeImage(img, newWidth, newHeight, targetSize);
                displayResult(dataUrl, blob, newWidth, newHeight);
            };
            img.src = previewImage.src;
        });
    });

    // Helper to convert Data URL to Blob
    function dataURLtoBlob(dataurl) {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
});