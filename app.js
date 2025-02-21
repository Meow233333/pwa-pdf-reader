document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFile);
    initServiceWorker();
});

let isDrawing = false;
let startX, startY, currentCanvas;

// Service Worker强制更新
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => reg.unregister());
        });
    }
}

async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const container = document.getElementById('pdfContainer');
    container.innerHTML = ''; // 清空容器

    if (file.type === 'application/pdf') {
        await renderPDF(file);
    } else if (file.type.startsWith('image/')) {
        renderImage(file);
    } else if (file.type === 'text/plain') {
        renderText(file);
    }
}

// ================== PDF多页渲染（核心） ==================
async function renderPDF(file) {
    const url = URL.createObjectURL(file);
    const pdf = await pdfjsLib.getDocument(url).promise;
    const container = document.getElementById('pdfContainer');

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        container.appendChild(canvas);

        // 为每个Canvas绑定交互事件
        bindCanvasEvents(canvas);
        await page.render({ canvasContext: ctx, viewport }).promise;
    }
}

// ================== 图片和文本渲染（保持原逻辑） ==================
async function renderImage(file) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const container = document.getElementById('pdfContainer');
        container.innerHTML = '';
        container.appendChild(canvas);
        bindCanvasEvents(canvas); // 确保图片Canvas也有触控事件
    };
}

async function renderText(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('textPreview').textContent = e.target.result;
    };
    reader.readAsText(file);
}

// ================== 事件绑定统一管理 ==================
function bindCanvasEvents(canvas) {
    canvas.addEventListener('mousedown', (e) => startDrawing(e, canvas));
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('touchstart', (e) => handleTouch(e, canvas, 'start'));
    canvas.addEventListener('touchmove', (e) => handleTouch(e, canvas, 'move'));
    canvas.addEventListener('touchend', endDrawing);
}

// ================== 触控事件处理 ==================
function handleTouch(e, canvas, type) {
    e.preventDefault();
    const touch = e.touches[0];
    const simulatedEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: canvas
    };
    if (type === 'start') startDrawing(simulatedEvent, canvas);
    else if (type === 'move') draw(simulatedEvent);
}

function startDrawing(e, canvas) {
    currentCanvas = canvas;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    startX = (e.clientX - rect.left) * scaleX;
    startY = (e.clientY - rect.top) * scaleY;
}

function draw(e) {
    if (!isDrawing || !currentCanvas) return;
    const rect = currentCanvas.getBoundingClientRect();
    const scaleX = currentCanvas.width / rect.width;
    const scaleY = currentCanvas.height / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    
    const ctx = currentCanvas.getContext('2d');
    ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
}

function endDrawing() {
    if (currentCanvas && isDrawing) {
        isDrawing = false;
        setTimeout(() => {
            const ctx = currentCanvas.getContext('2d');
            ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
            processRegion(startX, startY);
        }, 100);
    }
}

// ================== OCR识别与语音合成 ==================
async function processRegion(x, y) {
    const ctx = currentCanvas.getContext('2d');
    const imageData = ctx.getImageData(x, y, currentCanvas.width - x, currentCanvas.height - y);

    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.initialize('eng+chi_sim');
    const { data: { text } } = await worker.recognize(imageData);
    await worker.terminate();

    // 清洗文本保留连字符
    const cleanedText = text.replace(/[^\w\u4e00-\u9fff-\s]/g, ' ');
    speakText(cleanedText);
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        const voices = synth.getVoices().filter(v => v.lang === 'zh-CN' || v.lang.startsWith('en'));
        const utterance = new SpeechSynthesisUtterance(text);
        if (voices.length > 0) utterance.voice = voices[0];
        synth.speak(utterance);
    }
}