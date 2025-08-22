// 全局变量
let currentImage = null;
let canvas = null;
let ctx = null;
let originalImageData = null;

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const controlPanel = document.getElementById('controlPanel');
const previewSection = document.getElementById('previewSection');
const previewCanvas = document.getElementById('previewCanvas');
const previewBackground = document.getElementById('previewBackground');
const opacitySlider = document.getElementById('opacitySlider');
const opacityInput = document.getElementById('opacityInput');
const colorPresets = document.querySelectorAll('.color-preset');
const colorPicker = document.getElementById('colorPicker');
const filenameInput = document.getElementById('filenameInput');
const fileExtension = document.getElementById('fileExtension');
const downloadBtn = document.getElementById('downloadBtn');
const imageInfo = document.getElementById('imageInfo');
const currentOpacity = document.getElementById('currentOpacity');
const currentBgColor = document.getElementById('currentBgColor');
const toast = document.getElementById('toast');
const formatOptions = document.querySelectorAll('input[name="outputFormat"]');
const jpgBackgroundColor = document.getElementById('jpgBackgroundColor');
const jpgBgOptions = document.querySelectorAll('input[name="jpgBgColor"]');
const currentBgPreview = document.getElementById('currentBgPreview');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    canvas = previewCanvas;
    ctx = canvas.getContext('2d');
});

// 初始化事件监听器
function initializeEventListeners() {
    // 文件上传相关事件
    uploadArea.addEventListener('click', handleUploadAreaClick);
    uploadBtn.addEventListener('click', handleUploadBtnClick);
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传事件
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 透明度控制事件
    opacitySlider.addEventListener('input', handleOpacityChange);
    opacityInput.addEventListener('input', handleOpacityInputChange);
    
    // 背景色控制事件
    colorPresets.forEach(preset => {
        preset.addEventListener('click', handleColorPresetClick);
    });
    colorPicker.addEventListener('change', handleColorPickerChange);
    
    // 下载相关事件
    downloadBtn.addEventListener('click', handleDownload);

    // 格式选择事件
    formatOptions.forEach(option => {
        option.addEventListener('change', handleFormatChange);
    });

    // 防止页面默认拖拽行为
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
}

// 处理上传区域点击
function handleUploadAreaClick(event) {
    // 如果点击的是上传按钮，不处理（避免重复触发）
    if (event.target === uploadBtn || uploadBtn.contains(event.target)) {
        return;
    }
    fileInput.click();
}

// 处理上传按钮点击
function handleUploadBtnClick(event) {
    event.stopPropagation(); // 阻止事件冒泡
    fileInput.click();
}

// 处理文件选择
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

// 处理拖拽悬停
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

// 处理拖拽离开
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

// 处理文件拖拽放置
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// 处理文件
function processFile(file) {
    // 验证文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('请选择有效的图片文件（PNG、JPG、JPEG、GIF、WebP）', 'error');
        return;
    }
    
    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('文件大小不能超过10MB', 'error');
        return;
    }
    
    // 显示上传进度
    showUploadProgress();
    
    // 读取文件
    const reader = new FileReader();
    reader.onload = function(e) {
        loadImage(e.target.result, file.name);
    };
    reader.onerror = function() {
        showToast('文件读取失败', 'error');
        hideUploadProgress();
    };
    reader.readAsDataURL(file);
}

// 显示上传进度
function showUploadProgress() {
    uploadProgress.style.display = 'block';
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
    }, 100);
}

// 隐藏上传进度
function hideUploadProgress() {
    uploadProgress.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
}

// 加载图片
function loadImage(src, filename) {
    const img = new Image();
    img.onload = function() {
        currentImage = img;
        
        // 设置canvas尺寸
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = calculateDisplaySize(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;
        
        // 保存原始图片数据
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        originalImageData = ctx.getImageData(0, 0, width, height);
        
        // 更新界面
        updateImageInfo(img.width, img.height, filename);
        setDefaultFilename(filename);
        showControlsAndPreview();
        updatePreview();
        hideUploadProgress();
        
        showToast('图片上传成功！', 'success');
    };
    img.onerror = function() {
        showToast('图片加载失败', 'error');
        hideUploadProgress();
    };
    img.src = src;
}

// 计算显示尺寸
function calculateDisplaySize(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
}

// 更新图片信息
function updateImageInfo(width, height, filename) {
    imageInfo.textContent = `${filename} (${width} × ${height})`;
}

// 设置默认文件名
function setDefaultFilename(originalFilename) {
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
    filenameInput.value = nameWithoutExt + '_transparent';
}

// 处理格式选择变化
function handleFormatChange(event) {
    const selectedFormat = event.target.value;

    // 更新文件扩展名显示
    fileExtension.textContent = '.' + selectedFormat;

    // 显示或隐藏JPG背景色选择
    if (selectedFormat === 'jpg') {
        jpgBackgroundColor.style.display = 'block';
        updateJpgBackgroundPreview();
    } else {
        jpgBackgroundColor.style.display = 'none';
    }
}

// 更新JPG背景色预览
function updateJpgBackgroundPreview() {
    const currentColor = colorPicker.value;
    currentBgPreview.style.backgroundColor = currentColor;
}

// 显示控制面板和预览区域
function showControlsAndPreview() {
    controlPanel.style.display = 'block';
    previewSection.style.display = 'block';
}

// 处理透明度滑块变化
function handleOpacityChange(event) {
    const opacity = parseInt(event.target.value);
    opacityInput.value = opacity;
    updatePreview();
    updateCurrentSettings();
}

// 处理透明度输入框变化
function handleOpacityInputChange(event) {
    let opacity = parseInt(event.target.value);
    if (isNaN(opacity)) opacity = 100;
    if (opacity < 0) opacity = 0;
    if (opacity > 100) opacity = 100;
    
    event.target.value = opacity;
    opacitySlider.value = opacity;
    updatePreview();
    updateCurrentSettings();
}

// 处理预设颜色点击
function handleColorPresetClick(event) {
    const button = event.currentTarget;
    const color = button.dataset.color;
    
    // 更新选中状态
    colorPresets.forEach(preset => preset.classList.remove('active'));
    button.classList.add('active');
    
    // 更新颜色选择器
    colorPicker.value = color;
    
    // 更新预览
    updatePreview();
    updateCurrentSettings();
}

// 处理自定义颜色选择
function handleColorPickerChange(event) {
    const color = event.target.value;

    // 取消所有预设颜色的选中状态
    colorPresets.forEach(preset => preset.classList.remove('active'));

    // 更新JPG背景色预览
    updateJpgBackgroundPreview();

    // 更新预览
    updatePreview();
    updateCurrentSettings();
}

// 更新预览
function updatePreview() {
    if (!currentImage || !originalImageData) return;

    const opacity = parseInt(opacitySlider.value) / 100;
    const backgroundColor = colorPicker.value;

    // 设置背景色
    previewBackground.style.backgroundColor = backgroundColor;

    // 如果透明度很低，显示棋盘格背景
    if (opacity < 0.3) {
        previewBackground.classList.add('checkerboard');
    } else {
        previewBackground.classList.remove('checkerboard');
    }

    // 创建新的图片数据
    const imageData = ctx.createImageData(originalImageData.width, originalImageData.height);
    const data = imageData.data;
    const originalData = originalImageData.data;

    // 应用透明度
    for (let i = 0; i < originalData.length; i += 4) {
        data[i] = originalData[i];     // R
        data[i + 1] = originalData[i + 1]; // G
        data[i + 2] = originalData[i + 2]; // B
        data[i + 3] = originalData[i + 3] * opacity; // A
    }

    // 绘制到canvas
    ctx.putImageData(imageData, 0, 0);
}

// 更新当前设置显示
function updateCurrentSettings() {
    const opacity = opacitySlider.value;
    const bgColor = colorPicker.value;

    currentOpacity.textContent = opacity + '%';
    currentBgColor.textContent = bgColor;
}

// 处理下载
function handleDownload() {
    if (!currentImage) {
        showToast('请先上传图片', 'warning');
        return;
    }

    const filename = filenameInput.value.trim() || 'transparent_image';
    const opacity = parseInt(opacitySlider.value) / 100;
    const selectedFormat = document.querySelector('input[name="outputFormat"]:checked').value;

    // 创建下载用的canvas
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');

    // 设置为原始图片尺寸
    downloadCanvas.width = currentImage.width;
    downloadCanvas.height = currentImage.height;

    if (selectedFormat === 'jpg') {
        // JPG格式处理
        const jpgBgColor = document.querySelector('input[name="jpgBgColor"]:checked').value;
        let backgroundColor;

        if (jpgBgColor === 'white') {
            backgroundColor = '#ffffff';
        } else {
            backgroundColor = colorPicker.value;
        }

        // 填充背景色
        downloadCtx.fillStyle = backgroundColor;
        downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

        // 绘制图片并应用透明度
        downloadCtx.globalAlpha = opacity;
        downloadCtx.drawImage(currentImage, 0, 0);

        // 创建下载链接
        downloadCanvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename + '.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('JPG图片下载成功！', 'success');
        }, 'image/jpeg', 0.9);

    } else {
        // PNG格式处理（保持透明度）
        downloadCtx.globalAlpha = opacity;
        downloadCtx.drawImage(currentImage, 0, 0);

        // 创建下载链接
        downloadCanvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('PNG图片下载成功！', 'success');
        }, 'image/png');
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 工具函数：将十六进制颜色转换为RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 工具函数：判断颜色是否为亮色
function isLightColor(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return true;

    // 使用相对亮度公式
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
}

// 键盘快捷键支持
document.addEventListener('keydown', function(event) {
    // Ctrl+O 或 Cmd+O 打开文件
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        fileInput.click();
    }

    // Ctrl+S 或 Cmd+S 下载文件
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (currentImage) {
            handleDownload();
        }
    }

    // 方向键调整透明度
    if (currentImage && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        let opacity = parseInt(opacitySlider.value);

        if (event.key === 'ArrowLeft') {
            opacity = Math.max(0, opacity - 1);
        } else {
            opacity = Math.min(100, opacity + 1);
        }

        opacitySlider.value = opacity;
        opacityInput.value = opacity;
        updatePreview();
        updateCurrentSettings();
    }
});

// 页面可见性变化时的处理
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && currentImage) {
        // 页面重新可见时刷新预览
        updatePreview();
    }
});

// 窗口大小变化时的处理
window.addEventListener('resize', function() {
    if (currentImage) {
        // 延迟执行以避免频繁调用
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            updatePreview();
        }, 250);
    }
});

// 错误处理
window.addEventListener('error', function(event) {
    console.error('发生错误:', event.error);
    showToast('发生了一个错误，请刷新页面重试', 'error');
});

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 检查浏览器兼容性
    if (!window.FileReader) {
        showToast('您的浏览器不支持文件读取功能，请升级浏览器', 'error');
        return;
    }

    if (!document.createElement('canvas').getContext) {
        showToast('您的浏览器不支持Canvas功能，请升级浏览器', 'error');
        return;
    }

    // 显示使用提示
    setTimeout(() => {
        if (!currentImage) {
            showToast('拖拽图片到上传区域或点击选择文件开始使用', 'info');
        }
    }, 1000);
});
