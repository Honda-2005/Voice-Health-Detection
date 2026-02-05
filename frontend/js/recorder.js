// recorder.js - Voice recording functionality for Voice Health System
import apiClient from './apiClient.js';

/**
 * ============================================================================
 * RECORDER MODULE
 * ============================================================================
 */

// Configuration
const RECORDER_CONFIG = {
    recordingDuration: 30000, // 30 seconds max recording
    sampleRate: 44100,
    audioFormat: 'audio/webm',
    apiBaseUrl: 'http://localhost:5000/api',
    demoMode: false,

    // Recording prompts
    prompts: [
        {
            type: 'passage',
            text: 'Please read the following passage clearly and at your normal speaking pace:',
            content: '"The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon."',
            duration: 10000 // 10 seconds
        },
        {
            type: 'vowel',
            text: 'Please hold the vowel sound "Ah" for as long as comfortably possible:',
            content: 'Ahhhhh...',
            duration: 5000 // 5 seconds
        },
        {
            type: 'conversation',
            text: 'Please describe your day in your own words for 15 seconds:',
            content: 'Speak naturally about your activities, feelings, or thoughts.',
            duration: 15000 // 15 seconds
        }
    ]
};

// Global state
const recorderState = {
    currentStep: 1,
    isRecording: false,
    isPaused: false,
    audioContext: null,
    mediaRecorder: null,
    audioChunks: [],
    recordingStartTime: 0,
    recordingTimer: null,
    currentPromptIndex: 0,
    waveformCanvas: null,
    waveformContext: null,
    analyser: null,
    animationFrame: null,
    audioBlob: null,
    isPlaying: false,
    playbackCurrentTime: 0
};

/**
 * ============================================================================
 * INITIALIZATION
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Voice Recorder Initialized');

    // Check authentication
    if (!window.Auth || !window.Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize recorder
    initializeRecorder();

    // Initialize event listeners
    initializeEventListeners();

    // Load user data
    loadUserData();

    // Initialize waveform canvas
    initializeWaveformCanvas();

    // Test microphone permissions
    testMicrophone();
});

/**
 * ============================================================================
 * INITIALIZATION FUNCTIONS
 * ============================================================================
 */

function initializeRecorder() {
    console.log('Initializing voice recorder...');

    // Show step 1 by default
    showStep(1);

    // Initialize audio context (for visualization)
    try {
        if (!recorderState.audioContext) {
            recorderState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (error) {
        console.error('Web Audio API is not supported:', error);
        showToast('Audio recording is not supported in this browser', 'error');
    }
}

function initializeEventListeners() {
    // Navigation
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Step 1: Preparation
    document.getElementById('startRecordingBtn')?.addEventListener('click', startRecordingFlow);
    document.getElementById('testMicrophoneBtn')?.addEventListener('click', testMicrophone);

    // Step 2: Recording
    document.getElementById('recordBtn')?.addEventListener('click', toggleRecording);
    document.getElementById('pauseRecordingBtn')?.addEventListener('click', togglePauseRecording);
    document.getElementById('stopRecordingBtn')?.addEventListener('click', stopRecording);

    // Step 3: Review
    document.getElementById('playBtn')?.addEventListener('click', togglePlayback);
    document.getElementById('rewindBtn')?.addEventListener('click', rewindPlayback);
    document.getElementById('forwardBtn')?.addEventListener('click', forwardPlayback);
    document.getElementById('volumeSlider')?.addEventListener('input', updateVolume);
    document.getElementById('recordAgainBtn')?.addEventListener('click', recordAgain);
    document.getElementById('submitRecordingBtn')?.addEventListener('click', submitRecording);

    // Carousel controls
    document.querySelectorAll('.carousel-btn').forEach(btn => {
        btn.addEventListener('click', handleCarouselNavigation);
    });

    // Checklist validation
    document.querySelectorAll('.preparation-checklist input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', validateChecklist);
    });

    // Handle window close/refresh
    window.addEventListener('beforeunload', handleBeforeUnload);
}

function initializeWaveformCanvas() {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;

    recorderState.waveformCanvas = canvas;
    recorderState.waveformContext = canvas.getContext('2d');

    // Set canvas size
    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawEmptyWaveform();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function drawEmptyWaveform() {
    const ctx = recorderState.waveformContext;
    const canvas = recorderState.waveformCanvas;

    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw "Ready to record" text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ready to record...', canvas.width / 2, canvas.height / 2);
}

function loadUserData() {
    const user = window.Auth.getUser();
    if (user) {
        document.getElementById('userName').textContent = user.name || 'User';
        document.getElementById('userEmail').textContent = user.email || 'user@example.com';

        // Update avatar
        const avatar = document.getElementById('userAvatar');
        if (avatar && user.name) {
            const initials = getInitials(user.name);
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4361ee&color=fff&size=100`;
        }
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

/**
 * ============================================================================
 * STEP MANAGEMENT
 * ============================================================================
 */

function showStep(stepNumber) {
    // Update steps indicator
    document.querySelectorAll('.recording-steps .step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) <= stepNumber) {
            step.classList.add('active');
        }
    });

    // Hide all steps
    document.querySelectorAll('.recording-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.querySelector(`.recording-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update recorder state
    recorderState.currentStep = stepNumber;

    // Step-specific initialization
    switch (stepNumber) {
        case 1:
            validateChecklist();
            break;
        case 2:
            initializeRecording();
            break;
        case 3:
            initializeReview();
            break;
        case 4:
            startAnalysis();
            break;
    }
}

function validateChecklist() {
    const checkboxes = document.querySelectorAll('.preparation-checklist input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const startBtn = document.getElementById('startRecordingBtn');

    if (startBtn) {
        startBtn.disabled = !allChecked;
        startBtn.title = allChecked ? 'Start recording session' : 'Complete all checklist items';
    }
}

/**
 * ============================================================================
 * MICROPHONE & PERMISSIONS
 * ============================================================================
 */

async function testMicrophone() {
    try {
        showToast('Testing microphone...', 'info');

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: RECORDER_CONFIG.sampleRate
            }
        });

        // Update UI
        updateMicrophoneStatus(true);

        // Visualize test audio
        visualizeTestAudio(stream);

        // Stop after 3 seconds
        setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            showToast('Microphone test successful!', 'success');
        }, 3000);

    } catch (error) {
        console.error('Microphone error:', error);
        updateMicrophoneStatus(false);
        showToast('Microphone access denied or not available', 'error');
    }
}

function updateMicrophoneStatus(isAvailable) {
    const statusIndicator = document.querySelector('.microphone-status .status-indicator');
    const deviceName = document.getElementById('deviceName');
    const permissionStatus = document.querySelector('.permission-status');

    if (statusIndicator) {
        statusIndicator.classList.toggle('active', isAvailable);
        statusIndicator.querySelector('span').textContent = isAvailable ? 'Connected' : 'Not Connected';
    }

    if (deviceName) {
        deviceName.textContent = isAvailable ? 'Built-in Microphone' : 'Not Available';
        deviceName.style.color = isAvailable ? 'var(--success)' : 'var(--danger)';
    }

    if (permissionStatus) {
        const icon = permissionStatus.querySelector('i');
        const title = permissionStatus.querySelector('h4');
        const text = permissionStatus.querySelector('p');

        if (isAvailable) {
            icon.className = 'fas fa-check-circle';
            icon.style.color = 'var(--success)';
            title.textContent = 'Permissions Granted';
            text.textContent = 'Your browser has microphone access';
        } else {
            icon.className = 'fas fa-times-circle';
            icon.style.color = 'var(--danger)';
            title.textContent = 'Permissions Required';
            text.textContent = 'Please allow microphone access';
        }
    }
}

function visualizeTestAudio(stream) {
    if (!recorderState.audioContext || !recorderState.waveformContext) return;

    const analyser = recorderState.audioContext.createAnalyser();
    const source = recorderState.audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        recorderState.animationFrame = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        const ctx = recorderState.waveformContext;
        const canvas = recorderState.waveformCanvas;

        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Draw waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4cc9f0';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Update volume bar
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const volumePercentage = Math.min(100, (average / 128) * 100);
        updateVolumeBar(volumePercentage);
    }

    draw();

    // Stop visualization after 3 seconds
    setTimeout(() => {
        if (recorderState.animationFrame) {
            cancelAnimationFrame(recorderState.animationFrame);
        }
        drawEmptyWaveform();
    }, 3000);
}

function updateVolumeBar(percentage) {
    const volumeBar = document.getElementById('volumeBar');
    if (volumeBar) {
        volumeBar.style.width = `${percentage}%`;
        volumeBar.style.background = percentage > 90 ? 'var(--danger)' :
            percentage > 70 ? 'var(--warning)' :
                percentage > 30 ? 'var(--success)' :
                    'var(--gray)';
    }
}

/**
 * ============================================================================
 * RECORDING FUNCTIONS
 * ============================================================================
 */

function startRecordingFlow() {
    showStep(2);
}

async function initializeRecording() {
    try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: RECORDER_CONFIG.sampleRate
            }
        });

        // Initialize MediaRecorder
        recorderState.mediaRecorder = new MediaRecorder(stream, {
            mimeType: RECORDER_CONFIG.audioFormat
        });

        // Set up audio visualization
        setupAudioVisualization(stream);

        // Set up recording event handlers
        setupRecordingHandlers();

        // Update UI
        updateRecordingUI(true);
        updatePrompt(0);

        // Auto-start recording after 1 second
        setTimeout(() => {
            if (!recorderState.isRecording) {
                startRecording();
            }
        }, 1000);

    } catch (error) {
        console.error('Recording initialization error:', error);
        showToast('Failed to initialize recording', 'error');
        showStep(1);
    }
}

function setupAudioVisualization(stream) {
    if (!recorderState.audioContext) return;

    const source = recorderState.audioContext.createMediaStreamSource(stream);
    recorderState.analyser = recorderState.audioContext.createAnalyser();

    recorderState.analyser.fftSize = 2048;
    source.connect(recorderState.analyser);

    // Start visualization
    visualizeRecording();
}

function visualizeRecording() {
    if (!recorderState.analyser || !recorderState.waveformContext) return;

    const bufferLength = recorderState.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!recorderState.isRecording && !recorderState.isPaused) {
            drawEmptyWaveform();
            return;
        }

        recorderState.animationFrame = requestAnimationFrame(draw);

        recorderState.analyser.getByteTimeDomainData(dataArray);

        const ctx = recorderState.waveformContext;
        const canvas = recorderState.waveformCanvas;

        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Draw waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = recorderState.isPaused ? 'var(--warning)' : 'var(--danger)';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Update volume bar
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const volumePercentage = Math.min(100, (average / 128) * 100);
        updateVolumeBar(volumePercentage);
    }

    draw();
}

function setupRecordingHandlers() {
    if (!recorderState.mediaRecorder) return;

    recorderState.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recorderState.audioChunks.push(event.data);
        }
    };

    recorderState.mediaRecorder.onstop = () => {
        // Create audio blob
        recorderState.audioBlob = new Blob(recorderState.audioChunks, {
            type: RECORDER_CONFIG.audioFormat
        });

        // Stop visualization
        if (recorderState.animationFrame) {
            cancelAnimationFrame(recorderState.animationFrame);
        }

        // Stop all tracks
        if (recorderState.mediaRecorder.stream) {
            recorderState.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        // Move to review step
        showStep(3);
    };
}

function startRecording() {
    if (!recorderState.mediaRecorder || recorderState.isRecording) return;

    // Reset state
    recorderState.audioChunks = [];
    recorderState.isRecording = true;
    recorderState.isPaused = false;
    recorderState.recordingStartTime = Date.now();

    // Start recording
    recorderState.mediaRecorder.start(100); // Collect data every 100ms

    // Start timer
    startRecordingTimer();

    // Start prompt timer
    startPromptTimer();

    // Update UI
    updateRecordingUI(true);

    showToast('Recording started', 'info');
}

function toggleRecording() {
    if (!recorderState.isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function togglePauseRecording() {
    if (!recorderState.mediaRecorder || !recorderState.isRecording) return;

    if (recorderState.isPaused) {
        // Resume recording
        recorderState.mediaRecorder.resume();
        recorderState.isPaused = false;
        updateRecordingUI(true);
        showToast('Recording resumed', 'info');
    } else {
        // Pause recording
        recorderState.mediaRecorder.pause();
        recorderState.isPaused = true;
        updateRecordingUI(false);
        showToast('Recording paused', 'warning');
    }
}

function stopRecording() {
    if (!recorderState.mediaRecorder || !recorderState.isRecording) return;

    // Stop recording
    recorderState.mediaRecorder.stop();
    recorderState.isRecording = false;

    // Clear timers
    clearInterval(recorderState.recordingTimer);
    clearTimeout(recorderState.promptTimer);

    showToast('Recording stopped', 'info');
}

function startRecordingTimer() {
    const timerElement = document.getElementById('recordingTimer');
    if (!timerElement) return;

    // Clear any existing timer
    if (recorderState.recordingTimer) {
        clearInterval(recorderState.recordingTimer);
    }

    recorderState.recordingTimer = setInterval(() => {
        const elapsed = Date.now() - recorderState.recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);

        const displaySeconds = seconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;

        timerElement.textContent = timeString;

        // Auto-stop after max duration
        if (elapsed >= RECORDER_CONFIG.recordingDuration) {
            stopRecording();
        }
    }, 1000);
}

function updateRecordingUI(isActive) {
    const recordBtn = document.getElementById('recordBtn');
    const pauseBtn = document.getElementById('pauseRecordingBtn');
    const stopBtn = document.getElementById('stopRecordingBtn');

    if (recordBtn) {
        if (isActive) {
            recordBtn.classList.add('active');
            recordBtn.innerHTML = '<i class="fas fa-circle"></i><span>Recording...</span>';
        } else {
            recordBtn.classList.remove('active');
            recordBtn.innerHTML = '<i class="fas fa-circle"></i><span>Record</span>';
        }
    }

    if (pauseBtn) {
        pauseBtn.disabled = !recorderState.isRecording;
        pauseBtn.innerHTML = recorderState.isPaused ?
            '<i class="fas fa-play"></i><span>Resume</span>' :
            '<i class="fas fa-pause"></i><span>Pause</span>';
    }

    if (stopBtn) {
        stopBtn.disabled = !recorderState.isRecording;
    }
}

/**
 * ============================================================================
 * PROMPT MANAGEMENT
 * ============================================================================
 */

function updatePrompt(index) {
    if (index >= RECORDER_CONFIG.prompts.length) return;

    recorderState.currentPromptIndex = index;
    const prompt = RECORDER_CONFIG.prompts[index];

    // Update prompt display
    const promptElement = document.getElementById('currentPrompt');
    const passageElement = document.querySelector('.passage-text');
    const promptNumber = document.querySelector('.prompt-number');
    const promptType = document.querySelector('.prompt-type');
    const progressFill = document.querySelector('.progress-fill');

    if (promptElement) promptElement.textContent = prompt.text;
    if (passageElement) passageElement.innerHTML = `<p>${prompt.content}</p>`;
    if (promptNumber) promptNumber.textContent = `${index + 1}/${RECORDER_CONFIG.prompts.length}`;
    if (promptType) promptType.textContent = prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1);
    if (progressFill) {
        const progress = ((index + 1) / RECORDER_CONFIG.prompts.length) * 100;
        progressFill.style.width = `${progress}%`;
        document.querySelector('.prompt-progress span').textContent = `${Math.round(progress)}% Complete`;
    }
}

function startPromptTimer() {
    const prompt = RECORDER_CONFIG.prompts[recorderState.currentPromptIndex];
    if (!prompt) return;

    // Clear any existing timer
    if (recorderState.promptTimer) {
        clearTimeout(recorderState.promptTimer);
    }

    // Move to next prompt after duration
    recorderState.promptTimer = setTimeout(() => {
        const nextIndex = recorderState.currentPromptIndex + 1;
        if (nextIndex < RECORDER_CONFIG.prompts.length) {
            updatePrompt(nextIndex);
            startPromptTimer(); // Start timer for next prompt
        }
    }, prompt.duration);
}

/**
 * ============================================================================
 * REVIEW FUNCTIONS
 * ============================================================================
 */

function initializeReview() {
    if (!recorderState.audioBlob) {
        showToast('No recording found', 'error');
        showStep(2);
        return;
    }

    // Create audio URL for playback
    const audioUrl = URL.createObjectURL(recorderState.audioBlob);
    recorderState.audioUrl = audioUrl;

    // Create audio element for playback
    recorderState.audioElement = new Audio(audioUrl);

    // Set up playback event handlers
    setupPlaybackHandlers();

    // Update UI with recording info
    updateReviewUI();
}

function setupPlaybackHandlers() {
    if (!recorderState.audioElement) return;

    recorderState.audioElement.addEventListener('timeupdate', updatePlaybackProgress);
    recorderState.audioElement.addEventListener('ended', () => {
        recorderState.isPlaying = false;
        updatePlayButton();
    });

    recorderState.audioElement.addEventListener('loadedmetadata', () => {
        const totalTime = document.getElementById('totalTime');
        if (totalTime) {
            totalTime.textContent = formatTime(recorderState.audioElement.duration);
        }
    });
}

function updateReviewUI() {
    // Update recording length
    if (recorderState.audioElement) {
        const lengthElement = document.getElementById('recordingLength');
        if (lengthElement) {
            lengthElement.textContent = formatTime(recorderState.audioElement.duration || 30);
        }
    }

    // Generate random quality metrics for demo
    if (RECORDER_CONFIG.demoMode) {
        const metrics = [
            { width: Math.floor(Math.random() * 30) + 70, quality: 'Good' },
            { width: Math.floor(Math.random() * 40) + 60, quality: 'Fair' },
            { width: Math.floor(Math.random() * 20) + 10, quality: 'Good' }
        ];

        const metricBars = document.querySelectorAll('.quality-metric .metric-fill');
        const metricValues = document.querySelectorAll('.metric-value');

        metricBars.forEach((bar, index) => {
            bar.style.width = `${metrics[index].width}%`;
        });

        metricValues.forEach((value, index) => {
            value.textContent = metrics[index].quality;
            value.className = `metric-value ${metrics[index].quality.toLowerCase()}`;
        });
    }
}

function togglePlayback() {
    if (!recorderState.audioElement) return;

    if (recorderState.isPlaying) {
        recorderState.audioElement.pause();
        recorderState.isPlaying = false;
    } else {
        recorderState.audioElement.play();
        recorderState.isPlaying = true;
    }

    updatePlayButton();
}

function updatePlayButton() {
    const playBtn = document.getElementById('playBtn');
    if (!playBtn) return;

    const icon = playBtn.querySelector('i');
    if (icon) {
        icon.className = recorderState.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}

function updatePlaybackProgress() {
    if (!recorderState.audioElement) return;

    const progress = document.getElementById('playbackProgress');
    const currentTime = document.getElementById('currentTime');

    if (progress) {
        const percentage = (recorderState.audioElement.currentTime / recorderState.audioElement.duration) * 100;
        progress.style.width = `${percentage}%`;
    }

    if (currentTime) {
        currentTime.textContent = formatTime(recorderState.audioElement.currentTime);
    }
}

function rewindPlayback() {
    if (!recorderState.audioElement) return;

    recorderState.audioElement.currentTime = Math.max(0, recorderState.audioElement.currentTime - 5);
}

function forwardPlayback() {
    if (!recorderState.audioElement) return;

    recorderState.audioElement.currentTime = Math.min(
        recorderState.audioElement.duration,
        recorderState.audioElement.currentTime + 5
    );
}

function updateVolume(event) {
    if (!recorderState.audioElement) return;

    const volume = event.target.value / 100;
    recorderState.audioElement.volume = volume;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function recordAgain() {
    // Clean up audio resources
    if (recorderState.audioUrl) {
        URL.revokeObjectURL(recorderState.audioUrl);
    }

    if (recorderState.audioElement) {
        recorderState.audioElement.pause();
        recorderState.audioElement = null;
    }

    recorderState.audioBlob = null;
    recorderState.isPlaying = false;

    // Go back to recording step
    showStep(2);
}

async function submitRecording() {
    if (!recorderState.audioBlob) {
        showToast('No recording to submit', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.getElementById('submitRecordingBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    try {
        // In demo mode, simulate processing
        if (RECORDER_CONFIG.demoMode) {
            await simulateRecordingSubmission();
        } else {
            await submitToBackend();
        }

        // Move to analysis step
        showStep(4);

    } catch (error) {
        console.error('Recording submission error:', error);
        showToast('Failed to submit recording', 'error');
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Analyze Recording';
        }
    }
}

async function simulateRecordingSubmission() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                recordingId: 'rec_' + Date.now(),
                message: 'Recording submitted successfully'
            });
        }, 1500);
    });
}

async function submitToBackend() {
    if (!recorderState.audioBlob) {
        throw new Error('No audio recording available');
    }

    const filename = `recording_${Date.now()}.webm`;
    const duration = recorderState.audioElement?.duration || 0;

    const result = await apiClient.uploadRecording(
        recorderState.audioBlob,
        filename,
        duration
    );

    if (!result.success) {
        throw new Error(result.message || 'Failed to submit recording');
    }

    return result;
}

/**
 * ============================================================================
 * ANALYSIS FUNCTIONS
 * ============================================================================
 */

function startAnalysis() {
    // Start progress animation
    animateProgress();

    // Simulate analysis steps
    simulateAnalysisSteps();
}

function animateProgress() {
    const circle = document.querySelector('.circle-progress');
    const progressText = document.getElementById('progressPercent');
    const progressMessage = document.getElementById('progressMessage');
    const timeRemaining = document.getElementById('timeRemaining');

    if (!circle || !progressText) return;

    let progress = 0;
    const messages = [
        'Initializing audio processing...',
        'Cleaning audio signal...',
        'Extracting vocal features...',
        'Analyzing pitch patterns...',
        'Processing spectral data...',
        'Running AI models...',
        'Generating health insights...',
        'Compiling final report...'
    ];

    const totalTime = 45000; // 45 seconds
    const messageInterval = totalTime / messages.length;

    const interval = setInterval(() => {
        progress += 1;

        // Update circle progress
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // Update text
        progressText.textContent = `${progress}%`;

        // Update message
        if (progressMessage) {
            const messageIndex = Math.floor((progress / 100) * messages.length);
            if (messageIndex < messages.length) {
                progressMessage.textContent = messages[messageIndex];
            }
        }

        // Update time remaining
        if (timeRemaining) {
            const remainingSeconds = Math.max(0, Math.ceil((totalTime * (100 - progress)) / 100000));
            timeRemaining.textContent = `${remainingSeconds} seconds`;
        }

        // Update processing steps
        updateProcessingSteps(progress);

        // Complete
        if (progress >= 100) {
            clearInterval(interval);

            // Redirect to results page after 1 second
            setTimeout(() => {
                window.location.href = `prediction_result.html?id=rec_${Date.now()}`;
            }, 1000);
        }
    }, totalTime / 100);
}

function updateProcessingSteps(progress) {
    const steps = document.querySelectorAll('.processing-step');
    const stepPercent = 100 / steps.length;

    steps.forEach((step, index) => {
        const stepProgress = (progress - (index * stepPercent)) / stepPercent * 100;

        if (stepProgress >= 100) {
            step.classList.add('active');
            const statusIcon = step.querySelector('.step-status i');
            if (statusIcon) {
                statusIcon.className = 'fas fa-check';
            }
        } else if (stepProgress > 0) {
            step.classList.add('active');
            const statusIcon = step.querySelector('.step-status i');
            if (statusIcon) {
                statusIcon.className = 'fas fa-spinner fa-spin';
            }
        }
    });
}

function simulateAnalysisSteps() {
    // This function is called by animateProgress
    // The steps are updated based on progress percentage
}

/**
 * ============================================================================
 * UI UTILITIES
 * ============================================================================
 */

function handleCarouselNavigation(event) {
    const carousel = event.target.closest('.carousel-controls');
    if (!carousel) return;

    const isNext = event.target.closest('.next') || event.target.classList.contains('next');
    const tips = carousel.parentElement.querySelectorAll('.tip');
    const dots = carousel.querySelectorAll('.dot');

    let currentIndex = 0;
    tips.forEach((tip, index) => {
        if (tip.classList.contains('active')) {
            currentIndex = index;
            tip.classList.remove('active');
            dots[index].classList.remove('active');
        }
    });

    let newIndex = isNext ?
        (currentIndex + 1) % tips.length :
        (currentIndex - 1 + tips.length) % tips.length;

    tips[newIndex].classList.add('active');
    dots[newIndex].classList.add('active');
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

function handleLogout(e) {
    e.preventDefault();
    if (window.Auth && window.Auth.logout) {
        window.Auth.logout();
    } else {
        window.location.href = 'login.html';
    }
}

function handleBeforeUnload(event) {
    if (recorderState.isRecording) {
        event.preventDefault();
        event.returnValue = 'You are currently recording. Are you sure you want to leave?';
        return event.returnValue;
    }
}

function showToast(message, type = 'info') {
    if (window.UI && window.UI.showToast) {
        window.UI.showToast(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * ============================================================================
 * CLEANUP
 * ============================================================================
 */

function cleanup() {
    // Stop recording if active
    if (recorderState.isRecording && recorderState.mediaRecorder) {
        recorderState.mediaRecorder.stop();
    }

    // Stop audio playback
    if (recorderState.audioElement) {
        recorderState.audioElement.pause();
        recorderState.audioElement = null;
    }

    // Revoke audio URL
    if (recorderState.audioUrl) {
        URL.revokeObjectURL(recorderState.audioUrl);
    }

    // Stop visualization
    if (recorderState.animationFrame) {
        cancelAnimationFrame(recorderState.animationFrame);
    }

    // Close audio context
    if (recorderState.audioContext && recorderState.audioContext.state !== 'closed') {
        recorderState.audioContext.close();
    }

    // Clear timers
    if (recorderState.recordingTimer) clearInterval(recorderState.recordingTimer);
    if (recorderState.promptTimer) clearTimeout(recorderState.promptTimer);
}

// Cleanup on page unload
window.addEventListener('unload', cleanup);

/**
 * ============================================================================
 * EXPORT RECORDER FUNCTIONS
 * ============================================================================
 */

window.Recorder = {
    startRecording,
    stopRecording,
    toggleRecording,
    togglePlayback,
    submitRecording,
    testMicrophone,
    cleanup
};