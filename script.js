// FFmpeg instance
let FFmpeg;

// App State
const appState = {
    files: [],
    history: [],
    isConverting: false,
    currentConvertIndex: 0,
    errors: [],
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    isFFmpegReady: false,
    isFFmpegLoading: false,
};

// Wait for FFmpeg library to load with fallback CDNs
function waitForFFmpegLib(timeout = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkFFmpeg = setInterval(() => {
            if (typeof window.FFmpeg !== 'undefined' && window.FFmpeg.FFmpeg) {
                clearInterval(checkFFmpeg);
                console.log('✓ FFmpeg library loaded successfully');
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkFFmpeg);
                const errorMsg = `FFmpeg library failed to load within ${timeout/1000}s timeout`;
                console.error('✗ ' + errorMsg);
                reject(new Error(errorMsg));
            }
        }, 100);
    });
}

// Load external library with fallback CDNs
async function loadExternalLibrary(urls, name) {
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`Loading ${name} (${i + 1}/${urls.length}): ${url}`);
        
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                mode: 'no-cors'
            });
            
            // Create script element
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            // Add to document
            document.body.appendChild(script);
            
            console.log(`✓ ${name} script loaded from: ${url}`);
            return true;
        } catch (error) {
            console.warn(`✗ Failed to load ${name} from ${url}: ${error.message}`);
            continue;
        }
    }
    
    throw new Error(`Failed to load ${name} from all CDN sources`);
}

// Initialize FFmpeg
async function initFFmpeg() {
    if (appState.isFFmpegLoading) return; // Prevent multiple initializations
    
    appState.isFFmpegLoading = true;
    updateConvertButtonState();
    
    try {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Show loading message
        convertBtn.textContent = '📥 FFmpeg読み込み中...';
        
        // Clear browser cache to ensure fresh load
        clearCacheIfNeeded();
        
        // Wait for FFmpeg library to be available (increased timeout to 30s)
        console.log('Waiting for FFmpeg library (timeout: 30s)...');
        await waitForFFmpegLib(30000);
        
        // Check if FFmpegLib is available
        if (!window.FFmpeg || !window.FFmpeg.FFmpeg) {
            throw new Error('FFmpeg library not found in window object after loading');
        }
        
        console.log('FFmpeg library found, initializing...');
        FFmpeg = new window.FFmpeg.FFmpeg();
        
        // Try multiple CDN sources for WASM files
        const wasmUrls = [
            'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist',
            'https://unpkg.com/@ffmpeg/core@0.12.10/dist',
            'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg.js/0.12.10/dist'
        ];
        
        let loadSuccess = false;
        for (let i = 0; i < wasmUrls.length; i++) {
            try {
                const baseURL = wasmUrls[i];
                console.log(`Attempting to load FFmpeg WASM from (${i + 1}/${wasmUrls.length}): ${baseURL}`);
                
                await FFmpeg.load({
                    coreURL: `${baseURL}/ffmpeg-core.js`,
                    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
                });
                
                console.log('✓ FFmpeg WASM loaded successfully');
                loadSuccess = true;
                break;
            } catch (error) {
                console.warn(`✗ Failed to load from ${wasmUrls[i]}: ${error.message}`);
                if (i < wasmUrls.length - 1) {
                    console.log('Trying next CDN...');
                }
            }
        }
        
        if (!loadSuccess) {
            throw new Error('Failed to load FFmpeg WASM from all CDN sources');
        }
        
        appState.isFFmpegReady = true;
        appState.isFFmpegLoading = false;
        console.log('✓ FFmpeg initialized successfully');
        addError('✓ FFmpegが正常に読み込まれました');
    } catch (error) {
        appState.isFFmpegLoading = false;
        appState.isFFmpegReady = false;
        const errorMsg = 'FFmpeg初期化エラー: ' + error.message;
        addError(errorMsg);
        console.error('✗ FFmpeg initialization error:', error);
        
        // Suggest user actions
        addError('💡 解決方法: ページをリロードするか、ブラウザのキャッシュをクリアしてください');
    } finally {
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    updateConvertButtonState();
}

// Clear cache if needed
function clearCacheIfNeeded() {
    // Check if cache is stale (older than 1 day)
    const lastCacheTime = localStorage.getItem('ffmpegCacheTime');
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    if (!lastCacheTime || (now - parseInt(lastCacheTime)) > ONE_DAY) {
        console.log('Clearing old FFmpeg cache...');
        // Note: Actual cache clearing is browser-dependent
        // We just update the timestamp
        localStorage.setItem('ffmpegCacheTime', now.toString());
    }
}

// Update Convert Button State
function updateConvertButtonState() {
    if (appState.isFFmpegLoading) {
        convertBtn.disabled = true;
        convertBtn.textContent = '📥 FFmpeg読み込み中...';
    } else if (!appState.isFFmpegReady) {
        convertBtn.disabled = true;
        convertBtn.textContent = '⚠️ FFmpeg初期化失敗';
    } else if (appState.files.length === 0 || appState.isConverting) {
        convertBtn.disabled = true;
    } else {
        convertBtn.disabled = false;
        convertBtn.textContent = '✓ 変換を開始';
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
    updateConvertButtonState();
    
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
    // Safety checks
    if (!appState.isFFmpegReady) {
        addError('❌ FFmpegが準備できていません。ページをリロードしてください。');
        return;
    }
    
    if (!FFmpeg || typeof FFmpeg.isLoaded !== 'function') {
        addError('❌ FFmpeg object is not properly initialized');
        return;
    }
    
    if (!FFmpeg.isLoaded()) {
        addError('❌ FFmpegがまだ読み込まれていません');
        return;
    }
    
    if (appState.files.length === 0) {
        addError('⚠️ ファイルを追加してください');
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
    appState.isConverting = false;
    convertBtn.style.display = 'block';
    cancelBtn.style.display = 'none';
    progressSection.style.display = 'none';
    
    const completedCount = appState.files.filter(f => f.status === 'completed').length;
    if (completedCount > 0) {
        downloadAllBtn.style.display = 'block';
    }
    
    updateConvertButtonState();
    updateQueueUI();
}

// Convert Single File
async function convertFile(fileItem) {
    const inputName = 'input_' + Date.now();
    const outputName = 'output_' + Date.now() + '.mp3';
    
    try {
        // Check if fetchFile is available
        if (typeof fetchFile === 'undefined') {
            throw new Error('fetchFile function is not available from FFmpeg library');
        }
        
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
    if (typeof JSZip === 'undefined') {
        alert('JSZipライブラリが読み込まれていません');
        return;
    }
    
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

// Get fetchFile from FFmpeg library
function getFetchFile() {
    if (typeof window.FFmpeg !== 'undefined' && window.FFmpeg.fetchFile) {
        return window.FFmpeg.fetchFile;
    }
    return null;
}

// Initialize App
window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    updateConvertButtonState(); // Set initial button state
    await initFFmpeg();
    
    // Get fetchFile after FFmpeg is loaded
    const fetchFile = getFetchFile();
    if (!fetchFile) {
        addError('⚠️ fetchFile関数が利用できません。ページをリロードしてください。');
    }
    
    updateQueueUI();
    updateHistoryUI();
});

// Prevent default drag behavior on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
