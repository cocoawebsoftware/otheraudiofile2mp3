// FFmpeg instance
let FFmpeg;
const { FFmpeg: FFmpegLib, fetchFile } = window;

// App State
const appState = {
    files: [],
    history: [],
    isConverting: false,
    currentConvertIndex: 0,
    errors: [],
    isDarkMode: localStorage.getItem('darkMode') === 'true',
};

// Initialize FFmpeg
async function initFFmpeg() {
    FFmpeg = new FFmpegLib.FFmpeg();
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist';
    
    try {
        await FFmpeg.load({
            coreURL: `${baseURL}/ffmpeg-core.js`,
            wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        });
        console.log('FFmpeg initialized successfully');
    } catch (error) {
        addError('FFmpeg初期化エラー: ' + error.message);
        console.error('FFmpeg initialization error:', error);
    }
}

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const convertBtn = document.getElementById('convertBtn');
const cancelBtn = document.getElementById('cancelBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const themeToggle = document.getElementById('themeToggle');
const fileQueue = document.getElementById('fileQueue');
const queueCount = document.getElementById('queueCount');
const progressSection = document.getElementById('progressSection');
const progressFileName = document.getElementById('progressFileName');
const progressPercent = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const historyList = document.getElementById('historyList');
const bitrate = document.getElementById('bitrate');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const errorSection = document.getElementById('errorSection');
const errorLog = document.getElementById('errorLog');
const closeErrorBtn = document.getElementById('closeErrorBtn');

// Theme Toggle
function initTheme() {
    if (appState.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }
}

themeToggle.addEventListener('click', () => {
    appState.isDarkMode = !appState.isDarkMode;
    localStorage.setItem('darkMode', appState.isDarkMode);
    
    if (appState.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
    }
});

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// File Selection
selectFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Handle Files
function handleFiles(files) {
    for (const file of files) {
        if (isValidAudioFile(file)) {
            appState.files.push({
                file: file,
                name: file.name,
                size: file.size,
                status: 'pending', // pending, processing, completed, error
                outputSize: estimateOutputSize(file.size, parseInt(bitrate.value)),
                outputFile: null,
                error: null,
            });
        }
    }
    updateQueueUI();
}

// Validate Audio File
function isValidAudioFile(file) {
    const validExtensions = ['wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'awa', 'mp4', 'webm'];
    const ext = file.name.split('.').pop().toLowerCase();
    return validExtensions.includes(ext);
}

// Estimate Output Size
function estimateOutputSize(inputSize, bitrateKbps) {
    // Rough estimation: bitrate * duration
    // Assuming average audio duration ratio
    const estimatedDurationSeconds = (inputSize / 1024) / 1; // Very rough
    return (bitrateKbps * 1024 / 8) * (inputSize / 1024 / 100); // Rough estimate
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Update Queue UI
function updateQueueUI() {
    queueCount.textContent = `${appState.files.length} ファイル`;
    convertBtn.disabled = appState.files.length === 0;
    
    if (appState.files.length === 0) {
        fileQueue.innerHTML = '<p class="empty-message">ファイルが追加されていません</p>';
        return;
    }
    
    fileQueue.innerHTML = appState.files.map((fileItem, index) => `
        <div class="queue-item ${fileItem.status}">
            <div class="queue-info">
                <div class="queue-filename">📄 ${fileItem.name}</div>
                <div class="queue-details">
                    サイズ: ${formatFileSize(fileItem.size)} → 推定: ${formatFileSize(fileItem.outputSize)}
                    ${fileItem.status === 'completed' ? ' ✓' : ''}
                    ${fileItem.status === 'error' ? ' ✗' : ''}
                </div>
            </div>
            <div class="queue-actions">
                ${fileItem.status === 'completed' && fileItem.outputFile ? `
                    <button class="queue-action-btn download" onclick="downloadFile(${index})" title="ダウンロード">⬇</button>
                ` : ''}
                ${fileItem.status !== 'processing' ? `
                    <button class="queue-action-btn remove" onclick="removeFile(${index})" title="削除">✕</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Remove File from Queue
function removeFile(index) {
    appState.files.splice(index, 1);
    updateQueueUI();
}

// Download File
function downloadFile(index) {
    const fileItem = appState.files[index];
    if (fileItem.outputFile) {
        const url = URL.createObjectURL(fileItem.outputFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileItem.name.replace(/\.[^/.]+$/, '.mp3');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Convert Files
convertBtn.addEventListener('click', startConversion);
cancelBtn.addEventListener('click', cancelConversion);

async function startConversion() {
    if (!FFmpeg.isLoaded()) {
        addError('FFmpegがまだ読み込まれていません');
        return;
    }
    
    appState.isConverting = true;
    appState.currentConvertIndex = 0;
    convertBtn.style.display = 'none';
    cancelBtn.style.display = 'block';
    progressSection.style.display = 'block';
    downloadAllBtn.style.display = 'none';
    
    // Reset file statuses
    appState.files.forEach(f => {
        if (f.status !== 'error') {
            f.status = 'pending';
        }
    });
    
    await convertNextFile();
}

async function convertNextFile() {
    if (!appState.isConverting || appState.currentConvertIndex >= appState.files.length) {
        finishConversion();
        return;
    }
    
    const fileItem = appState.files[appState.currentConvertIndex];
    
    if (fileItem.status === 'error') {
        appState.currentConvertIndex++;
        await convertNextFile();
        return;
    }
    
    fileItem.status = 'processing';
    updateQueueUI();
    
    try {
        await convertFile(fileItem);
        fileItem.status = 'completed';
        appState.history.push({
            name: fileItem.name,
            timestamp: new Date().toLocaleString('ja-JP'),
            size: formatFileSize(fileItem.outputSize),
        });
        updateHistoryUI();
    } catch (error) {
        fileItem.status = 'error';
        fileItem.error = error.message;
        addError(`${fileItem.name}: ${error.message}`);
    }
    
    updateQueueUI();
    appState.currentConvertIndex++;
    await convertNextFile();
}

function cancelConversion() {
    appState.isConverting = false;
    finishConversion();
}

function finishConversion() {
    convertBtn.style.display = 'block';
    cancelBtn.style.display = 'none';
    progressSection.style.display = 'none';
    
    const completedCount = appState.files.filter(f => f.status === 'completed').length;
    if (completedCount > 0) {
        downloadAllBtn.style.display = 'block';
    }
    
    updateQueueUI();
}

// Convert Single File
async function convertFile(fileItem) {
    const inputName = 'input_' + Date.now();
    const outputName = 'output_' + Date.now() + '.mp3';
    
    try {
        // Write input file to FFmpeg filesystem
        await FFmpeg.writeFile(inputName, await fetchFile(fileItem.file));
        
        // Update progress
        progressFileName.textContent = fileItem.name;
        progressPercent.textContent = '処理中...';
        progressBar.style.width = '50%';
        
        // Convert to MP3
        const bitrateValue = parseInt(bitrate.value);
        await FFmpeg.exec([
            '-i', inputName,
            '-q:a', '5', // Quality
            '-b:a', bitrateValue + 'k',
            '-y',
            outputName
        ]);
        
        // Read output file
        const data = await FFmpeg.readFile(outputName);
        fileItem.outputFile = new Blob([data.buffer], { type: 'audio/mpeg' });
        fileItem.outputSize = fileItem.outputFile.size;
        
        // Cleanup
        await FFmpeg.deleteFile(inputName);
        await FFmpeg.deleteFile(outputName);
        
        progressPercent.textContent = '100%';
        progressBar.style.width = '100%';
    } catch (error) {
        throw new Error(`変換失敗: ${error.message}`);
    }
}

// Download All as ZIP
downloadAllBtn.addEventListener('click', async () => {
    const zip = new JSZip();
    const completedFiles = appState.files.filter(f => f.status === 'completed' && f.outputFile);
    
    if (completedFiles.length === 0) {
        alert('ダウンロードできるファイルがありません');
        return;
    }
    
    for (const fileItem of completedFiles) {
        const filename = fileItem.name.replace(/\.[^/.]+$/, '.mp3');
        zip.file(filename, fileItem.outputFile);
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_audio_' + new Date().getTime() + '.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// History Management
function updateHistoryUI() {
    if (appState.history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">変換履歴がありません</p>';
        return;
    }
    
    historyList.innerHTML = appState.history.map((item, index) => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-filename">✓ ${item.name}</div>
                <div class="history-details">${item.timestamp} - ${item.size}</div>
            </div>
            <button class="history-download" onclick="downloadFromHistory(${index})">
                ⬇ ダウンロード
            </button>
        </div>
    `).join('');
}

function downloadFromHistory(index) {
    // History tracking - in a real app, this would download from storage
    alert('この機能は完全実装版で利用可能です');
}

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('変換履歴をすべてクリアしますか？')) {
        appState.history = [];
        updateHistoryUI();
    }
});

// Error Management
function addError(message) {
    appState.errors.push({
        message: message,
        timestamp: new Date().toLocaleTimeString('ja-JP'),
    });
    
    errorSection.style.display = 'block';
    updateErrorLog();
}

function updateErrorLog() {
    errorLog.innerHTML = appState.errors.map(error => `
        <div class="error-item">
            <div>${error.message}</div>
            <div class="error-time">${error.timestamp}</div>
        </div>
    `).join('');
    
    // Auto-scroll to bottom
    errorLog.scrollTop = errorLog.scrollHeight;
}

closeErrorBtn.addEventListener('click', () => {
    errorSection.style.display = 'none';
});

// Initialize App
window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await initFFmpeg();
    updateQueueUI();
    updateHistoryUI();
});

// Prevent default drag behavior on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());