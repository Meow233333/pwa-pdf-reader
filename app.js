// app.js - 文件上传与渲染
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let startX, startY, endX, endY;

// 文件上传监听
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 清空画布和预览
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('textPreview').textContent = '';

    // 根据文件类型处理
    if (file.type === 'application/pdf') {
        await renderPDF(file);
    } else if (file.type.startsWith('image/')) {
        await renderImage(file);
    } else if (file.type === 'text/plain') {
        await renderText(file);
    }
});

// PDF渲染
async function renderPDF(file) {
    const url = URL.createObjectURL(file);
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ 
        canvasContext: ctx, 
        viewport: viewport 
    }).promise;
}

// 高亮逻辑（支持鼠标和触控）
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', endDrawing);

function startDrawing(e) {
    isDrawing = true;
    startX = e.clientX - canvas.offsetLeft;
    startY = e.clientY - canvas.offsetTop;
}

function draw(e) {
    if (!isDrawing) return;
    // 绘制临时高亮框（略，需计算坐标）
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    startX = touch.clientX - canvas.offsetLeft;
    startY = touch.clientY - canvas.offsetTop;
    isDrawing = true;
}

function handleTouchMove(e) {
    e.preventDefault();
    // 触控绘制（类似鼠标移动处理）
}
