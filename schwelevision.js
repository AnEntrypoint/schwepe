import { siteConfig } from './lib/site-config.js';
/**
* Schwelevision Broadcasting System
* Complete video broadcasting with scheduled programming and ad distribution
* Uses shared GMT-based scheduling utilities and TvBroadcaster from 420kit
*/
import SchwepeTVScheduler from './utils/schwepe-tv-scheduler.js';
import { TvBroadcaster } from './lib/420kit/tv-broadcaster.js';
class Schwelevision {
constructor() {
this.videos = [];
this.playedVideos = new Set();
this.currentVideoElement = document.getElementById('currentVideo');
this.nextVideoElement = document.getElementById('nextVideo');
this.thirdVideoElement = document.getElementById('thirdVideo');
this.staticNoiseElement = document.getElementById('staticNoise');
this.staticElement = document.getElementById('static');
this.noiseCanvas = document.getElementById('noiseCanvas');
this.noiseCtx = this.noiseCanvas.getContext('2d');
this.currentIndex = -1;
// Check if loaded in iframe and enable embed mode
this.checkIframeMode();
this.nextIndex = -1;
this.thirdIndex = -1;
this.volume = 0;
this.isDragging = false;
this.noiseAnimationId = null;
this.isVideoPreloaded = false;
this.slapCounter = 0;
// Scheduled video buffering state
this.isBufferingScheduledVideo = false;
this.isScheduledVideoPlaying = false;
this.scheduledVideoElement = null;
this.isThirdVideoPreloaded = false;
// Synchronized programming system
this.PROGRAM_SEED = 247420;
this.schedule = [];
this.currentProgramIndex = 0;
this.scheduledPlayTimeout = null;
// GMT scheduler utilities
this.scheduler = new SchwepeTVScheduler();
// TV Broadcaster for scheduled content with ad breaks (from 420kit)
this.tvBroadcaster = new TvBroadcaster({
adBreakSeed: 247420,
bufferThreshold: 20,
availableAds: [] // Will be populated with saved_videos
});
// Weekly schedule system
this.weeklySchedule = null;
this.currentWeek = null;
this.scheduleStart = null;
this.isScheduledVideoPlaying = false;
// Synchronized ad distribution system
this.adBreakSeed = 247420;
this.currentAdBreak = null;
this.adQueue = [];
this.adPreloadElements = {
ad1: null,
ad2: null,
ad3: null
};
this.isAdPreloaded = {
ad1: false,
ad2: false,
ad3: false
};
this.adTimingInterval = null;
this.preloadedAds = new Map();
// Audio system
this.staticAudioContext = null;
this.whiteNoiseNode = null;
this.gainNode = null;
// Development environment detection
this.isDevelopment = window.location.hostname === 'localhost' ||
window.location.hostname === '127.0.0.1' ||
window.location.port === '3000';
// Error handling
this.scheduledVideoError = false;
this.maxRetries = 3;
this.retryCount = 0;
// Video synchronization
this.videoSyncInterval = null;
// Montage playback state
this.currentMontageIndex = 0;
this.currentMontageVideos = [];
// Autoplay policy handling
this.pendingScheduledContent = null;
this.autoplayBlocked = false;
// Buffering state tracking
this.isBufferingScheduledContent = false;
}
async init() {
try {
console.log('📺 Initializing Schwelevision Broadcasting System...');
// Load video schedule
await this.loadVideoSchedule();
// Load weekly schedule
await this.loadWeeklySchedule();
// Load saved videos for ads
await this.loadSavedVideos();
// Setup UI controls
this.setupEventListeners();
this.setupVolumeControl();
// Start noise effect
this.startStaticNoise();
// Initialize audio system
this.initializeAudio();
// Start broadcasting
await this.startBroadcasting();
console.log('✅ Schwelevision initialized successfully');
} catch (error) {
console.error('❌ Failed to initialize Schwelevision:', error);
// Fallback to basic functionality
this.startFallbackMode();
}
}
async loadVideoSchedule() {
try {
// Add aggressive cache-busting with timestamp and random component
const timestamp = Date.now();
const random = Math.floor(Math.random() * 1000000);
const cacheBuster = `${timestamp}_${random}`;
console.log(`🔄 Loading video-schedule.json with cache buster: ${cacheBuster}`);
const response = await fetch(`' + siteConfig.getApiUrl('schedule') + '?v=${cacheBuster}`);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const scheduleData = await response.json();
// Extract videos array from the schedule data
if (scheduleData && scheduleData.videos && Array.isArray(scheduleData.videos)) {
this.schedule = scheduleData.videos;
console.log(`📋 Loaded ${this.schedule.length} videos from schedule`);
} else {
throw new Error('Invalid schedule format');
}
} catch (error) {
console.error('❌ Error loading video schedule:', error);
// Fallback to basic video list
this.videos = this.getDefaultVideoList();
}
}
async loadWeeklySchedule() {
try {
const weekNumber = this.getCurrentWeek();
// Add aggressive cache-busting with timestamp and random component
const timestamp = Date.now();
const random = Math.floor(Math.random() * 1000000);
const cacheBuster = `${timestamp}_${random}`;
console.log(`🔄 Loading week_${weekNumber}.json with cache buster: ${cacheBuster}`);
const response = await fetch(`' + siteConfig.getAssetUrl('media/schedule_weeks/week_') + '${weekNumber}.json?v=${cacheBuster}`);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
this.weeklySchedule = await response.json();
this.currentWeek = weekNumber;
this.scheduleStart = new Date(this.weeklySchedule.schedule_start);
console.log(`📅 Loaded weekly schedule for week ${weekNumber}`);
} catch (error) {
console.error('❌ Error loading weekly schedule:', error);
this.weeklySchedule = null;
}
}
async loadSavedVideos() {
try {
// Add aggressive cache-busting with timestamp and random component
const timestamp = Date.now();
const random = Math.floor(Math.random() * 1000000);
const cacheBuster = `${timestamp}_${random}`;
console.log(`🔄 Loading videos.json with cache buster: ${cacheBuster}`);
const response = await fetch(`/videos.json?v=${cacheBuster}`);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const videosData = await response.json();
if (videosData && Array.isArray(videosData)) {
this.tvBroadcaster.availableAds = videosData.map(video => ({
url: `/${video.path}`,
name: video.filename,
duration: 30
}));
console.log(`📺 Loaded ${this.tvBroadcaster.availableAds.length} saved videos for ads`);
} else {
throw new Error('Invalid videos.json format');
}
} catch (error) {
console.error('❌ Error loading saved videos:', error);
this.tvBroadcaster.availableAds = [];
}
}
getDefaultVideoList() {
// Fallback video list if schedule loading fails
return [
{ title: "Schwepe Content 1", url: "/schwepe/video1.mp4", duration: 30 },
{ title: "Schwepe Content 2", url: "/schwepe/video2.mp4", duration: 30 },
{ title: "Schwepe Content 3", url: "/schwepe/video3.mp4", duration: 30 }
];
}
setupEventListeners() {
// Channel change button
const changeChannelBtn = document.getElementById('changeChannel');
if (changeChannelBtn) {
changeChannelBtn.addEventListener('click', () => this.changeChannel());
}
// Fullscreen toggle
const fullscreenBtn = document.getElementById('fullscreenToggle');
if (fullscreenBtn) {
fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
}
// Video element event listeners
if (this.currentVideoElement) {
this.currentVideoElement.addEventListener('ended', () => this.onVideoEnded());
this.currentVideoElement.addEventListener('error', (e) => this.onVideoError(e));
}
if (this.nextVideoElement) {
this.nextVideoElement.addEventListener('canplay', () => this.onNextVideoReady());
}
// TV slap interaction - initialize audio and unmute
const tvScreenWrapper = document.querySelector('.tv-screen-wrapper');
if (tvScreenWrapper) {
tvScreenWrapper.addEventListener('click', () => this.handleTvSlap());
tvScreenWrapper.style.cursor = 'pointer'; // Show pointer cursor for interactivity
}
// Window resize handler
window.addEventListener('resize', () => this.handleResize());
}
pauseAllVideos() {
if (this.currentVideoElement && !this.currentVideoElement.paused) {
this.currentVideoElement.pause();
}
if (this.nextVideoElement && !this.nextVideoElement.paused) {
this.nextVideoElement.pause();
}
if (this.scheduledVideoElement && !this.scheduledVideoElement.paused) {
this.scheduledVideoElement.pause();
}
}
handleTvSlap() {
this.slapCounter++;
console.log(`🖐️ TV slap #${this.slapCounter} - Initializing audio! 🔊`);
// Update slap counter display
this.updateSlapCounter();
// Add TV shake animation
this.addTvShake();
// Play thud sound with crackle
this.playThudSound();
this.playCrackleSound();
// Play hum/whine every ~4 slaps (deterministic)
// Pattern: slaps 4, 8, 12, 16, 20, 24, 28, 32... will trigger hum
if (this.slapCounter % 4 === 0) {
this.playHumWhineSound();
}
// Show static overlay briefly (with animation playing)
this.showStaticOverlay();
// Initialize audio context if not already done (browsers require user interaction)
if (!this.staticAudioContext && (window.AudioContext || window.webkitAudioContext)) {
console.log('🔊 Creating AudioContext from user interaction');
this.staticAudioContext = new (window.AudioContext || window.webkitAudioContext)();
this.createWhiteNoise();
}
// Resume audio context if it was suspended
if (this.staticAudioContext && this.staticAudioContext.state === 'suspended') {
console.log('🔊 Resuming AudioContext from user interaction');
this.staticAudioContext.resume();
}
// Unmute videos and fix volume issues
if (this.currentVideoElement && this.currentVideoElement.muted) {
console.log('🔊 Unmuting current video');
this.currentVideoElement.muted = false;
this.currentVideoElement.volume = this.volume || 0.5;
}
if (this.nextVideoElement && this.nextVideoElement.muted) {
this.nextVideoElement.muted = false;
this.nextVideoElement.volume = this.volume || 0.5;
}
if (this.scheduledVideoElement) {
// Only unmute scheduled video if it's actively playing (not buffering)
if (this.isScheduledVideoPlaying && !this.isBufferingScheduledContent) {
console.log('🔊 Unmuting scheduled video (actively playing)');
this.scheduledVideoElement.muted = false;
this.scheduledVideoElement.volume = this.volume || 0.5;
} else {
console.log('🔇 Keeping scheduled video muted (buffering in background)');
this.scheduledVideoElement.muted = true;
}
}
// Set a reasonable default volume if volume is 0
if (this.volume === 0) {
this.volume = 0.3;
console.log('🔊 Setting default volume to 30%');
this.updateVolume();
}
// Retry scheduled content if autoplay was blocked
if (this.autoplayBlocked && this.pendingScheduledContent) {
console.log('🔄 Retrying scheduled content after user interaction...');
this.autoplayBlocked = false;
const content = this.pendingScheduledContent;
this.pendingScheduledContent = null;
// Retry playing the scheduled content
setTimeout(() => {
this.playCurrentVideoInMontage(content).catch(err => {
console.error('❌ Failed to retry scheduled content:', err);
});
}, 300);
}
console.log(`✅ TV slap complete! Audio initialized, volume: ${Math.round(this.volume * 100)}%`);
}
addTvShake() {
const tvScreenWrapper = document.querySelector('.tv-screen-wrapper');
if (tvScreenWrapper) {
tvScreenWrapper.classList.add('tv-shake');
setTimeout(() => {
tvScreenWrapper.classList.remove('tv-shake');
}, 500); // Remove shake after animation completes
}
}
updateSlapCounter() {
const slapCounter = document.getElementById('slapCounter');
if (slapCounter) {
slapCounter.textContent = `🖐️ TV slap #${this.slapCounter}`;
slapCounter.style.display = 'block';
// Hide after 3 seconds
setTimeout(() => {
slapCounter.style.display = 'none';
}, 3000);
}
}
playThudSound() {
try {
// Create thud sound using Web Audio API instead of loading file
if (this.staticAudioContext) {
const oscillator = this.staticAudioContext.createOscillator();
const gainNode = this.staticAudioContext.createGain();
oscillator.connect(gainNode);
gainNode.connect(this.staticAudioContext.destination);
// Low frequency for thud effect
oscillator.frequency.value = 60;
oscillator.type = 'sine';
// Quick envelope for thud sound
gainNode.gain.setValueAtTime(0.3, this.staticAudioContext.currentTime);
gainNode.gain.exponentialRampToValueAtTime(0.01, this.staticAudioContext.currentTime + 0.3);
oscillator.start(this.staticAudioContext.currentTime);
oscillator.stop(this.staticAudioContext.currentTime + 0.3);
console.log('🔊 Playing thud sound');
}
} catch (error) {
console.warn('⚠️ Could not play thud sound:', error);
}
}
playCrackleSound() {
try {
if (this.staticAudioContext) {
const duration = 0.3; // 300ms of crackle
const sampleRate = this.staticAudioContext.sampleRate;
const bufferSize = sampleRate * duration;
const buffer = this.staticAudioContext.createBuffer(1, bufferSize, sampleRate);
const data = buffer.getChannelData(0);
// Generate realistic static crackle with random volume variations
for (let i = 0; i < bufferSize; i++) {
const time = i / sampleRate;
// Rapid volume changes for crackle effect
if (Math.random() < 0.15) { // 15% chance of pop
data[i] = (Math.random() * 2 - 1) * Math.random(); // Random amplitude pop
} else if (Math.random() < 0.05) { // 5% chance of loud crackle
data[i] = (Math.random() * 2 - 1) * 0.8; // Loud crackle
} else {
data[i] = (Math.random() * 2 - 1) * 0.05; // Background hiss
}
// Apply overall decay envelope
const decay = Math.exp(-time * 8); // Quick decay
data[i] *= decay;
}
// Create multiple sources for layered crackle effect
const crackleSource = this.staticAudioContext.createBufferSource();
crackleSource.buffer = buffer;
// High-pass filter for sharp crackle
const highPassFilter = this.staticAudioContext.createBiquadFilter();
highPassFilter.type = 'highpass';
highPassFilter.frequency.value = 3000;
// Random volume automation for rapid pops
const crackleGain = this.staticAudioContext.createGain();
crackleGain.gain.setValueAtTime(0.15, this.staticAudioContext.currentTime);
// Add rapid volume variations
for (let i = 0; i < 10; i++) {
const popTime = this.staticAudioContext.currentTime + (i * 0.03);
const popGain = Math.random() * 0.1 + 0.05;
crackleGain.gain.setValueAtTime(popGain, popTime);
crackleGain.gain.setValueAtTime(popGain * 0.3, popTime + 0.01);
}
// Connect audio nodes
crackleSource.connect(highPassFilter);
highPassFilter.connect(crackleGain);
crackleGain.connect(this.staticAudioContext.destination);
crackleSource.start(this.staticAudioContext.currentTime);
console.log('🔊 Playing realistic static crackle with rapid pops');
}
} catch (error) {
console.warn('⚠️ Could not play crackle sound:', error);
}
}
playHumWhineSound() {
try {
if (this.staticAudioContext) {
const currentTime = this.staticAudioContext.currentTime;
// Create three sound components: hum, capacitor whine, and fat buzz
const masterGain = this.staticAudioContext.createGain();
masterGain.gain.setValueAtTime(0.12, currentTime);
masterGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.5);
masterGain.connect(this.staticAudioContext.destination);
// 1. Low frequency hum (50-120Hz)
const humOscillator = this.staticAudioContext.createOscillator();
const humGain = this.staticAudioContext.createGain();
humOscillator.frequency.value = 60 + Math.random() * 60; // 60-120Hz
humOscillator.type = 'sine';
humGain.gain.setValueAtTime(0.4, currentTime);
humOscillator.connect(humGain);
humGain.connect(masterGain);
// 2. High-pitched capacitor whine (1kHz-5kHz with modulation)
const whineOscillator = this.staticAudioContext.createOscillator();
const whineGain = this.staticAudioContext.createGain();
const whineLFO = this.staticAudioContext.createOscillator();
const whineLFODepth = this.staticAudioContext.createGain();
// Set up whine frequency and modulation
whineOscillator.frequency.value = 2000 + Math.random() * 3000; // 2-5kHz
whineOscillator.type = 'sawtooth'; // Harsher tone for capacitor effect
// LFO to create realistic capacitor whine modulation
whineLFO.frequency.value = 3 + Math.random() * 7; // 3-10Hz modulation
whineLFODepth.gain.value = 500; // Modulation depth
whineLFO.connect(whineLFODepth);
whineLFODepth.connect(whineOscillator.frequency);
whineGain.gain.setValueAtTime(0.3, currentTime);
whineOscillator.connect(whineGain);
whineGain.connect(masterGain);
// 3. Fat buzz (100-300Hz with harmonics)
const buzzOscillator = this.staticAudioContext.createOscillator();
const buzzGain = this.staticAudioContext.createGain();
const buzzFilter = this.staticAudioContext.createBiquadFilter();
buzzOscillator.frequency.value = 150 + Math.random() * 150; // 150-300Hz
buzzOscillator.type = 'square'; // Rich harmonics for buzz
// Low-pass filter to soften the harsh square wave
buzzFilter.type = 'lowpass';
buzzFilter.frequency.value = 800 + Math.random() * 400; // 800-1200Hz
buzzFilter.Q.value = 2; // Some resonance for character
buzzGain.gain.setValueAtTime(0.2, currentTime);
buzzOscillator.connect(buzzFilter);
buzzFilter.connect(buzzGain);
buzzGain.connect(masterGain);
// Add some random frequency drift for realism
const driftInterval = setInterval(() => {
if (this.staticAudioContext && this.staticAudioContext.currentTime < currentTime + 1.5) {
humOscillator.frequency.exponentialRampToValueAtTime(
humOscillator.frequency.value * (0.9 + Math.random() * 0.2),
this.staticAudioContext.currentTime + 0.1
);
whineOscillator.frequency.exponentialRampToValueAtTime(
whineOscillator.frequency.value * (0.95 + Math.random() * 0.1),
this.staticAudioContext.currentTime + 0.05
);
} else {
clearInterval(driftInterval);
}
}, 100);
// Start all oscillators
humOscillator.start(currentTime);
whineOscillator.start(currentTime);
buzzOscillator.start(currentTime);
// Stop after 1.5 seconds
humOscillator.stop(currentTime + 1.5);
whineOscillator.stop(currentTime + 1.5);
buzzOscillator.stop(currentTime + 1.5);
whineLFO.stop(currentTime + 1.5);
console.log('🔊 Playing enhanced hum with capacitor whine and fat buzz');
}
} catch (error) {
console.warn('⚠️ Could not play hum/whine sound:', error);
}
}
showStaticOverlay() {
const staticElement = document.getElementById('static');
if (staticElement) {
staticElement.style.display = 'block';
staticElement.style.opacity = '0.8';
// Start static animation (canvas noise)
this.startStaticNoise();
// Play static audio briefly
if (this.staticNoiseElement) {
this.staticNoiseElement.volume = (this.volume || 0.3) * 0.3;
this.staticNoiseElement.play().catch(() => {
// Ignore audio errors
});
}
// Hide static after brief flash when video should be playing
setTimeout(() => {
staticElement.style.opacity = '';
// Check if any video is actively playing
const anyVideoPlaying = this.isScheduledVideoPlaying ||
(this.currentVideoElement && !this.currentVideoElement.paused) ||
(this.scheduledVideoElement && !this.scheduledVideoElement.paused);
if (anyVideoPlaying) {
staticElement.style.display = 'none';
// Stop static audio when hiding overlay after slap
this.stopStaticAudio();
}
}, 200); // Brief static flash
}
}
stopStaticAudio() {
// Stop white noise audio
if (this.whiteNoiseNode) {
this.whiteNoiseNode.disconnect();
this.whiteNoiseNode = null;
}
if (this.staticNoiseElement) {
this.staticNoiseElement.pause();
this.staticNoiseElement.currentTime = 0;
}
console.log('🔇 Static audio stopped');
}
setupVolumeControl() {
const volumeKnob = document.getElementById('volumeKnob');
const volumeLevel = document.getElementById('volumeLevel');
if (!volumeKnob || !volumeLevel) return;
let isDragging = false;
let startY = 0;
let startVolume = 0;
const updateVolume = (clientY) => {
const deltaY = startY - clientY;
const deltaVolume = deltaY / 100;
this.volume = Math.max(0, Math.min(1, startVolume + deltaVolume));
const rotation = this.volume * 270 - 135;
volumeKnob.style.transform = `rotate(${rotation}deg)`;
volumeLevel.textContent = Math.round(this.volume * 100);
this.updateVolume();
};
volumeKnob.addEventListener('mousedown', (e) => {
isDragging = true;
startY = e.clientY;
startVolume = this.volume;
volumeKnob.style.cursor = 'grabbing';
});
document.addEventListener('mousemove', (e) => {
if (isDragging) {
updateVolume(e.clientY);
}
});
document.addEventListener('mouseup', () => {
isDragging = false;
