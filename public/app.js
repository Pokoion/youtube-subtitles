// DOM Elements
const youtubeUrlInput = document.getElementById('youtubeUrl');
const clearBtn = document.getElementById('clearBtn');
const languageSelect = document.getElementById('language');
const fetchBtn = document.getElementById('fetchBtn');
const validationMessage = document.getElementById('validationMessage');
const videoPreview = document.getElementById('videoPreview');
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoMeta = document.getElementById('videoMeta');
const loading = document.getElementById('loading');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const subtitlesSection = document.getElementById('subtitlesSection');
const subtitlesMeta = document.getElementById('subtitlesMeta');
const subtitlesContainer = document.getElementById('subtitlesContainer');
const searchSubtitles = document.getElementById('searchSubtitles');
const copyBtn = document.getElementById('copyBtn');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const downloadSrtBtn = document.getElementById('downloadSrtBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// State
let currentSubtitles = [];
let currentVideoId = '';

// YouTube URL Validation
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function isValidYoutubeUrl(url) {
    return youtubeRegex.test(url) || /^[a-zA-Z0-9_-]{11}$/.test(url);
}

function showValidation(message, type) {
    validationMessage.textContent = message;
    validationMessage.className = `validation-message show ${type}`;
}

function hideValidation() {
    validationMessage.className = 'validation-message';
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

function formatTime(seconds) {
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours();
    const mins = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    
    if (hours > 0) {
        return `${hours}:${mins}:${secs}`;
    }
    return `${mins}:${secs}`;
}

function formatSrtTime(seconds) {
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const mins = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    
    return `${hours}:${mins}:${secs},${ms}`;
}

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Input Events
youtubeUrlInput.addEventListener('input', () => {
    const url = youtubeUrlInput.value.trim();
    
    // Show/hide clear button
    clearBtn.classList.toggle('visible', url.length > 0);
    
    if (url.length === 0) {
        hideValidation();
        videoPreview.classList.add('hidden');
        return;
    }
    
    if (isValidYoutubeUrl(url)) {
        const videoId = extractVideoId(url);
        if (videoId) {
            showValidation('✓ Valid YouTube link', 'success');
            showVideoPreview(videoId);
        }
    } else {
        showValidation('✗ Enter a valid YouTube link', 'error');
        videoPreview.classList.add('hidden');
    }
});

youtubeUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchBtn.click();
    }
});

clearBtn.addEventListener('click', () => {
    youtubeUrlInput.value = '';
    clearBtn.classList.remove('visible');
    hideValidation();
    videoPreview.classList.add('hidden');
    subtitlesSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    youtubeUrlInput.focus();
});

function showVideoPreview(videoId) {
    thumbnail.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    videoTitle.textContent = 'YouTube Video';
    videoMeta.textContent = `ID: ${videoId}`;
    videoPreview.classList.remove('hidden');
}

// Fetch Subtitles
fetchBtn.addEventListener('click', async () => {
    const url = youtubeUrlInput.value.trim();
    
    if (!url) {
        showValidation('Please enter a YouTube link', 'error');
        youtubeUrlInput.focus();
        return;
    }
    
    if (!isValidYoutubeUrl(url)) {
        showValidation('Invalid link. Enter a valid YouTube link', 'error');
        return;
    }
    
    const videoId = extractVideoId(url);
    if (!videoId) {
        showValidation('Could not extract video ID', 'error');
        return;
    }
    
    currentVideoId = videoId;
    const lang = languageSelect.value;
    
    // UI Updates
    fetchBtn.disabled = true;
    loading.classList.remove('hidden');
    subtitlesSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    hideValidation();
    
    try {
        const response = await fetch('/api/subtitles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, lang })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error getting subtitles');
        }
        
        if (data.success && data.subtitles) {
            currentSubtitles = data.subtitles;
            displaySubtitles(data.subtitles, data.language, data.count);
        } else {
            throw new Error('No subtitles found');
        }
        
    } catch (error) {
        showError(error.message);
    } finally {
        fetchBtn.disabled = false;
        loading.classList.add('hidden');
    }
});

function displaySubtitles(subtitles, language, count) {
    subtitlesSection.classList.remove('hidden');
    subtitlesMeta.textContent = `${count} lines • Language: ${language.toUpperCase()}`;
    
    renderSubtitles(subtitles);
}

function renderSubtitles(subtitles, searchTerm = '') {
    subtitlesContainer.innerHTML = '';
    
    subtitles.forEach((sub, index) => {
        const div = document.createElement('div');
        div.className = 'subtitle-item';
        div.dataset.index = index;
        
        const time = document.createElement('span');
        time.className = 'subtitle-time';
        time.textContent = formatTime(parseFloat(sub.start));
        
        const text = document.createElement('span');
        text.className = 'subtitle-text';
        
        let decodedText = decodeHtmlEntities(sub.text);
        
        if (searchTerm) {
            const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
            decodedText = decodedText.replace(regex, '<mark>$1</mark>');
            div.classList.add('highlight');
        }
        
        text.innerHTML = decodedText;
        
        div.appendChild(time);
        div.appendChild(text);
        subtitlesContainer.appendChild(div);
    });
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showError(message) {
    errorSection.classList.remove('hidden');
    errorMessage.textContent = message;
}

// Search
searchSubtitles.addEventListener('input', () => {
    const searchTerm = searchSubtitles.value.trim().toLowerCase();
    
    if (!searchTerm) {
        renderSubtitles(currentSubtitles);
        return;
    }
    
    const filtered = currentSubtitles.filter(sub => 
        decodeHtmlEntities(sub.text).toLowerCase().includes(searchTerm)
    );
    
    renderSubtitles(filtered, searchTerm);
});

// Copy to Clipboard
copyBtn.addEventListener('click', async () => {
    const text = currentSubtitles
        .map(sub => `[${formatTime(parseFloat(sub.start))}] ${decodeHtmlEntities(sub.text)}`)
        .join('\n');
    
    try {
        await navigator.clipboard.writeText(text);
        showToast('Subtitles copied to clipboard!');
    } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Subtitles copied to clipboard!');
    }
});

// Download TXT
downloadTxtBtn.addEventListener('click', () => {
    const text = currentSubtitles
        .map(sub => `[${formatTime(parseFloat(sub.start))}] ${decodeHtmlEntities(sub.text)}`)
        .join('\n');
    
    downloadFile(text, `subtitles_${currentVideoId}.txt`, 'text/plain');
    showToast('TXT file downloaded!');
});

// Download SRT
downloadSrtBtn.addEventListener('click', () => {
    let srt = '';
    
    currentSubtitles.forEach((sub, index) => {
        const startTime = parseFloat(sub.start);
        const duration = parseFloat(sub.dur) || 3;
        const endTime = startTime + duration;
        
        srt += `${index + 1}\n`;
        srt += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
        srt += `${decodeHtmlEntities(sub.text)}\n\n`;
    });
    
    downloadFile(srt, `subtitles_${currentVideoId}.srt`, 'text/srt');
    showToast('SRT file downloaded!');
});

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    youtubeUrlInput.focus();
});
