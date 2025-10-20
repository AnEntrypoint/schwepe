import { siteConfig } from './lib/site-config.js';
    1→/**
    2→ * Schwelevision Broadcasting System
    3→ * Complete video broadcasting with scheduled programming and ad distribution
    4→ * Uses shared GMT-based scheduling utilities and TvBroadcaster from 420kit
    5→ */
    6→
    7→import SchwepeTVScheduler from './utils/schwepe-tv-scheduler.js';
    8→import { TvBroadcaster } from './lib/420kit/tv-broadcaster.js';
    9→
   10→class Schwelevision {
   11→    constructor() {
   12→        this.videos = [];
   13→        this.playedVideos = new Set();
   14→        this.currentVideoElement = document.getElementById('currentVideo');
   15→        this.nextVideoElement = document.getElementById('nextVideo');
   16→        this.thirdVideoElement = document.getElementById('thirdVideo');
   17→        this.staticNoiseElement = document.getElementById('staticNoise');
   18→        this.staticElement = document.getElementById('static');
   19→        this.noiseCanvas = document.getElementById('noiseCanvas');
   20→        this.noiseCtx = this.noiseCanvas.getContext('2d');
   21→        this.currentIndex = -1;
   22→
   23→        // Check if loaded in iframe and enable embed mode
   24→        this.checkIframeMode();
   25→        this.nextIndex = -1;
   26→        this.thirdIndex = -1;
   27→        this.volume = 0;
   28→        this.isDragging = false;
   29→        this.noiseAnimationId = null;
   30→        this.isVideoPreloaded = false;
   31→        this.slapCounter = 0;
   32→
   33→        // Scheduled video buffering state
   34→        this.isBufferingScheduledVideo = false;
   35→        this.isScheduledVideoPlaying = false;
   36→        this.scheduledVideoElement = null;
   37→        this.isThirdVideoPreloaded = false;
   38→
   39→        // Synchronized programming system
   40→        this.PROGRAM_SEED = 247420;
   41→        this.schedule = [];
   42→        this.currentProgramIndex = 0;
   43→        this.scheduledPlayTimeout = null;
   44→
   45→        // GMT scheduler utilities
   46→        this.scheduler = new SchwepeTVScheduler();
   47→
   48→        // TV Broadcaster for scheduled content with ad breaks (from 420kit)
   49→        this.tvBroadcaster = new TvBroadcaster({
   50→            adBreakSeed: 247420,
   51→            bufferThreshold: 20,
   52→            availableAds: [] // Will be populated with saved_videos
   53→        });
   54→
   55→        // Weekly schedule system
   56→        this.weeklySchedule = null;
   57→        this.currentWeek = null;
   58→        this.scheduleStart = null;
   59→        this.isScheduledVideoPlaying = false;
   60→
   61→        // Synchronized ad distribution system
   62→        this.adBreakSeed = 247420;
   63→        this.currentAdBreak = null;
   64→        this.adQueue = [];
   65→        this.adPreloadElements = {
   66→            ad1: null,
   67→            ad2: null,
   68→            ad3: null
   69→        };
   70→        this.isAdPreloaded = {
   71→            ad1: false,
   72→            ad2: false,
   73→            ad3: false
   74→        };
   75→        this.adTimingInterval = null;
   76→        this.preloadedAds = new Map();
   77→
   78→        // Audio system
   79→        this.staticAudioContext = null;
   80→        this.whiteNoiseNode = null;
   81→        this.gainNode = null;
   82→
   83→        // Development environment detection
   84→        this.isDevelopment = window.location.hostname === 'localhost' ||
   85→                           window.location.hostname === '127.0.0.1' ||
   86→                           window.location.port === '3000';
   87→
   88→        // Error handling
   89→        this.scheduledVideoError = false;
   90→        this.maxRetries = 3;
   91→        this.retryCount = 0;
   92→
   93→        // Video synchronization
   94→        this.videoSyncInterval = null;
   95→
   96→        // Montage playback state
   97→        this.currentMontageIndex = 0;
   98→        this.currentMontageVideos = [];
   99→
  100→        // Autoplay policy handling
  101→        this.pendingScheduledContent = null;
  102→        this.autoplayBlocked = false;
  103→
  104→        // Buffering state tracking
  105→        this.isBufferingScheduledContent = false;
  106→    }
  107→
  108→    async init() {
  109→        try {
  110→            console.log('📺 Initializing Schwelevision Broadcasting System...');
  111→
  112→            // Load video schedule
  113→            await this.loadVideoSchedule();
  114→
  115→            // Load weekly schedule
  116→            await this.loadWeeklySchedule();
  117→
  118→            // Load saved videos for ads
  119→            await this.loadSavedVideos();
  120→
  121→            // Setup UI controls
  122→            this.setupEventListeners();
  123→            this.setupVolumeControl();
  124→
  125→            // Start noise effect
  126→            this.startStaticNoise();
  127→
  128→            // Initialize audio system
  129→            this.initializeAudio();
  130→
  131→            // Start broadcasting
  132→            await this.startBroadcasting();
  133→
  134→            console.log('✅ Schwelevision initialized successfully');
  135→        } catch (error) {
  136→            console.error('❌ Failed to initialize Schwelevision:', error);
  137→            // Fallback to basic functionality
  138→            this.startFallbackMode();
  139→        }
  140→    }
  141→
  142→    async loadVideoSchedule() {
  143→        try {
  144→            // Add aggressive cache-busting with timestamp and random component
  145→            const timestamp = Date.now();
  146→            const random = Math.floor(Math.random() * 1000000);
  147→            const cacheBuster = `${timestamp}_${random}`;
  148→            console.log(`🔄 Loading video-schedule.json with cache buster: ${cacheBuster}`);
  149→            const response = await fetch(`' + siteConfig.getApiUrl('schedule') + '?v=${cacheBuster}`);
  150→            if (!response.ok) throw new Error(`HTTP ${response.status}`);
  151→            const scheduleData = await response.json();
  152→
  153→            // Extract videos array from the schedule data
  154→            if (scheduleData && scheduleData.videos && Array.isArray(scheduleData.videos)) {
  155→                this.schedule = scheduleData.videos;
  156→                console.log(`📋 Loaded ${this.schedule.length} videos from schedule`);
  157→            } else {
  158→                throw new Error('Invalid schedule format');
  159→            }
  160→        } catch (error) {
  161→            console.error('❌ Error loading video schedule:', error);
  162→            // Fallback to basic video list
  163→            this.videos = this.getDefaultVideoList();
  164→        }
  165→    }
  166→
  167→    async loadWeeklySchedule() {
  168→        try {
  169→            const weekNumber = this.getCurrentWeek();
  170→            // Add aggressive cache-busting with timestamp and random component
  171→            const timestamp = Date.now();
  172→            const random = Math.floor(Math.random() * 1000000);
  173→            const cacheBuster = `${timestamp}_${random}`;
  174→            console.log(`🔄 Loading week_${weekNumber}.json with cache buster: ${cacheBuster}`);
  175→            const response = await fetch(`' + siteConfig.getAssetUrl('media/schedule_weeks/week_') + '${weekNumber}.json?v=${cacheBuster}`);
  176→            if (!response.ok) throw new Error(`HTTP ${response.status}`);
  177→            this.weeklySchedule = await response.json();
  178→            this.currentWeek = weekNumber;
  179→            this.scheduleStart = new Date(this.weeklySchedule.schedule_start);
  180→            console.log(`📅 Loaded weekly schedule for week ${weekNumber}`);
  181→        } catch (error) {
  182→            console.error('❌ Error loading weekly schedule:', error);
  183→            this.weeklySchedule = null;
  184→        }
  185→    }
  186→
  187→    async loadSavedVideos() {
  188→        try {
  189→            // Add aggressive cache-busting with timestamp and random component
  190→            const timestamp = Date.now();
  191→            const random = Math.floor(Math.random() * 1000000);
  192→            const cacheBuster = `${timestamp}_${random}`;
  193→            console.log(`🔄 Loading videos.json with cache buster: ${cacheBuster}`);
  194→            const response = await fetch(`/videos.json?v=${cacheBuster}`);
  195→            if (!response.ok) throw new Error(`HTTP ${response.status}`);
  196→            const videosData = await response.json();
  197→
  198→            if (videosData && Array.isArray(videosData)) {
  199→                this.tvBroadcaster.availableAds = videosData.map(video => ({
  200→                    url: `/${video.path}`,
  201→                    name: video.filename,
  202→                    duration: 30
  203→                }));
  204→                console.log(`📺 Loaded ${this.tvBroadcaster.availableAds.length} saved videos for ads`);
  205→            } else {
  206→                throw new Error('Invalid videos.json format');
  207→            }
  208→        } catch (error) {
  209→            console.error('❌ Error loading saved videos:', error);
  210→            this.tvBroadcaster.availableAds = [];
  211→        }
  212→    }
  213→
  214→    getDefaultVideoList() {
  215→        // Fallback video list if schedule loading fails
  216→        return [
  217→            { title: "Schwepe Content 1", url: "/schwepe/video1.mp4", duration: 30 },
  218→            { title: "Schwepe Content 2", url: "/schwepe/video2.mp4", duration: 30 },
  219→            { title: "Schwepe Content 3", url: "/schwepe/video3.mp4", duration: 30 }
  220→        ];
  221→    }
  222→
  223→    setupEventListeners() {
  224→        // Channel change button
  225→        const changeChannelBtn = document.getElementById('changeChannel');
  226→        if (changeChannelBtn) {
  227→            changeChannelBtn.addEventListener('click', () => this.changeChannel());
  228→        }
  229→
  230→        // Fullscreen toggle
  231→        const fullscreenBtn = document.getElementById('fullscreenToggle');
  232→        if (fullscreenBtn) {
  233→            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
  234→        }
  235→
  236→        // Video element event listeners
  237→        if (this.currentVideoElement) {
  238→            this.currentVideoElement.addEventListener('ended', () => this.onVideoEnded());
  239→            this.currentVideoElement.addEventListener('error', (e) => this.onVideoError(e));
  240→        }
  241→
  242→        if (this.nextVideoElement) {
  243→            this.nextVideoElement.addEventListener('canplay', () => this.onNextVideoReady());
  244→        }
  245→
  246→        // TV slap interaction - initialize audio and unmute
  247→        const tvScreenWrapper = document.querySelector('.tv-screen-wrapper');
  248→        if (tvScreenWrapper) {
  249→            tvScreenWrapper.addEventListener('click', () => this.handleTvSlap());
  250→            tvScreenWrapper.style.cursor = 'pointer'; // Show pointer cursor for interactivity
  251→        }
  252→
  253→        // Window resize handler
  254→        window.addEventListener('resize', () => this.handleResize());
  255→    }
  256→
  257→    pauseAllVideos() {
  258→        if (this.currentVideoElement && !this.currentVideoElement.paused) {
  259→            this.currentVideoElement.pause();
  260→        }
  261→        if (this.nextVideoElement && !this.nextVideoElement.paused) {
  262→            this.nextVideoElement.pause();
  263→        }
  264→        if (this.scheduledVideoElement && !this.scheduledVideoElement.paused) {
  265→            this.scheduledVideoElement.pause();
  266→        }
  267→    }
  268→
  269→    handleTvSlap() {
  270→        this.slapCounter++;
  271→        console.log(`🖐️ TV slap #${this.slapCounter} - Initializing audio! 🔊`);
  272→
  273→        // Update slap counter display
  274→        this.updateSlapCounter();
  275→
  276→        // Add TV shake animation
  277→        this.addTvShake();
  278→
  279→        // Play thud sound with crackle
  280→        this.playThudSound();
  281→        this.playCrackleSound();
  282→
  283→        // Play hum/whine every ~4 slaps (deterministic)
  284→        // Pattern: slaps 4, 8, 12, 16, 20, 24, 28, 32... will trigger hum
  285→        if (this.slapCounter % 4 === 0) {
  286→            this.playHumWhineSound();
  287→        }
  288→
  289→        // Show static overlay briefly (with animation playing)
  290→        this.showStaticOverlay();
  291→
  292→        // Initialize audio context if not already done (browsers require user interaction)
  293→        if (!this.staticAudioContext && (window.AudioContext || window.webkitAudioContext)) {
  294→            console.log('🔊 Creating AudioContext from user interaction');
  295→            this.staticAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  296→            this.createWhiteNoise();
  297→        }
  298→
  299→        // Resume audio context if it was suspended
  300→        if (this.staticAudioContext && this.staticAudioContext.state === 'suspended') {
  301→            console.log('🔊 Resuming AudioContext from user interaction');
  302→            this.staticAudioContext.resume();
  303→        }
  304→
  305→        // Unmute videos and fix volume issues
  306→        if (this.currentVideoElement && this.currentVideoElement.muted) {
  307→            console.log('🔊 Unmuting current video');
  308→            this.currentVideoElement.muted = false;
  309→            this.currentVideoElement.volume = this.volume || 0.5;
  310→        }
  311→
  312→        if (this.nextVideoElement && this.nextVideoElement.muted) {
  313→            this.nextVideoElement.muted = false;
  314→            this.nextVideoElement.volume = this.volume || 0.5;
  315→        }
  316→
  317→        if (this.scheduledVideoElement) {
  318→            // Only unmute scheduled video if it's actively playing (not buffering)
  319→            if (this.isScheduledVideoPlaying && !this.isBufferingScheduledContent) {
  320→                console.log('🔊 Unmuting scheduled video (actively playing)');
  321→                this.scheduledVideoElement.muted = false;
  322→                this.scheduledVideoElement.volume = this.volume || 0.5;
  323→            } else {
  324→                console.log('🔇 Keeping scheduled video muted (buffering in background)');
  325→                this.scheduledVideoElement.muted = true;
  326→            }
  327→        }
  328→
  329→        // Set a reasonable default volume if volume is 0
  330→        if (this.volume === 0) {
  331→            this.volume = 0.3;
  332→            console.log('🔊 Setting default volume to 30%');
  333→            this.updateVolume();
  334→        }
  335→
  336→        // Retry scheduled content if autoplay was blocked
  337→        if (this.autoplayBlocked && this.pendingScheduledContent) {
  338→            console.log('🔄 Retrying scheduled content after user interaction...');
  339→            this.autoplayBlocked = false;
  340→            const content = this.pendingScheduledContent;
  341→            this.pendingScheduledContent = null;
  342→
  343→            // Retry playing the scheduled content
  344→            setTimeout(() => {
  345→                this.playCurrentVideoInMontage(content).catch(err => {
  346→                    console.error('❌ Failed to retry scheduled content:', err);
  347→                });
  348→            }, 300);
  349→        }
  350→
  351→        console.log(`✅ TV slap complete! Audio initialized, volume: ${Math.round(this.volume * 100)}%`);
  352→    }
  353→
  354→    addTvShake() {
  355→        const tvScreenWrapper = document.querySelector('.tv-screen-wrapper');
  356→        if (tvScreenWrapper) {
  357→            tvScreenWrapper.classList.add('tv-shake');
  358→            setTimeout(() => {
  359→                tvScreenWrapper.classList.remove('tv-shake');
  360→            }, 500); // Remove shake after animation completes
  361→        }
  362→    }
  363→
  364→    updateSlapCounter() {
  365→        const slapCounter = document.getElementById('slapCounter');
  366→        if (slapCounter) {
  367→            slapCounter.textContent = `🖐️ TV slap #${this.slapCounter}`;
  368→            slapCounter.style.display = 'block';
  369→
  370→            // Hide after 3 seconds
  371→            setTimeout(() => {
  372→                slapCounter.style.display = 'none';
  373→            }, 3000);
  374→        }
  375→    }
  376→
  377→    playThudSound() {
  378→        try {
  379→            // Create thud sound using Web Audio API instead of loading file
  380→            if (this.staticAudioContext) {
  381→                const oscillator = this.staticAudioContext.createOscillator();
  382→                const gainNode = this.staticAudioContext.createGain();
  383→
  384→                oscillator.connect(gainNode);
  385→                gainNode.connect(this.staticAudioContext.destination);
  386→
  387→                // Low frequency for thud effect
  388→                oscillator.frequency.value = 60;
  389→                oscillator.type = 'sine';
  390→
  391→                // Quick envelope for thud sound
  392→                gainNode.gain.setValueAtTime(0.3, this.staticAudioContext.currentTime);
  393→                gainNode.gain.exponentialRampToValueAtTime(0.01, this.staticAudioContext.currentTime + 0.3);
  394→
  395→                oscillator.start(this.staticAudioContext.currentTime);
  396→                oscillator.stop(this.staticAudioContext.currentTime + 0.3);
  397→
  398→                console.log('🔊 Playing thud sound');
  399→            }
  400→        } catch (error) {
  401→            console.warn('⚠️ Could not play thud sound:', error);
  402→        }
  403→    }
  404→
  405→    playCrackleSound() {
  406→        try {
  407→            if (this.staticAudioContext) {
  408→                const duration = 0.3; // 300ms of crackle
  409→                const sampleRate = this.staticAudioContext.sampleRate;
  410→                const bufferSize = sampleRate * duration;
  411→                const buffer = this.staticAudioContext.createBuffer(1, bufferSize, sampleRate);
  412→                const data = buffer.getChannelData(0);
  413→
  414→                // Generate realistic static crackle with random volume variations
  415→                for (let i = 0; i < bufferSize; i++) {
  416→                    const time = i / sampleRate;
  417→
  418→                    // Rapid volume changes for crackle effect
  419→                    if (Math.random() < 0.15) { // 15% chance of pop
  420→                        data[i] = (Math.random() * 2 - 1) * Math.random(); // Random amplitude pop
  421→                    } else if (Math.random() < 0.05) { // 5% chance of loud crackle
  422→                        data[i] = (Math.random() * 2 - 1) * 0.8; // Loud crackle
  423→                    } else {
  424→                        data[i] = (Math.random() * 2 - 1) * 0.05; // Background hiss
  425→                    }
  426→
  427→                    // Apply overall decay envelope
  428→                    const decay = Math.exp(-time * 8); // Quick decay
  429→                    data[i] *= decay;
  430→                }
  431→
  432→                // Create multiple sources for layered crackle effect
  433→                const crackleSource = this.staticAudioContext.createBufferSource();
  434→                crackleSource.buffer = buffer;
  435→
  436→                // High-pass filter for sharp crackle
  437→                const highPassFilter = this.staticAudioContext.createBiquadFilter();
  438→                highPassFilter.type = 'highpass';
  439→                highPassFilter.frequency.value = 3000;
  440→
  441→                // Random volume automation for rapid pops
  442→                const crackleGain = this.staticAudioContext.createGain();
  443→                crackleGain.gain.setValueAtTime(0.15, this.staticAudioContext.currentTime);
  444→
  445→                // Add rapid volume variations
  446→                for (let i = 0; i < 10; i++) {
  447→                    const popTime = this.staticAudioContext.currentTime + (i * 0.03);
  448→                    const popGain = Math.random() * 0.1 + 0.05;
  449→                    crackleGain.gain.setValueAtTime(popGain, popTime);
  450→                    crackleGain.gain.setValueAtTime(popGain * 0.3, popTime + 0.01);
  451→                }
  452→
  453→                // Connect audio nodes
  454→                crackleSource.connect(highPassFilter);
  455→                highPassFilter.connect(crackleGain);
  456→                crackleGain.connect(this.staticAudioContext.destination);
  457→
  458→                crackleSource.start(this.staticAudioContext.currentTime);
  459→                console.log('🔊 Playing realistic static crackle with rapid pops');
  460→            }
  461→        } catch (error) {
  462→            console.warn('⚠️ Could not play crackle sound:', error);
  463→        }
  464→    }
  465→
  466→    playHumWhineSound() {
  467→        try {
  468→            if (this.staticAudioContext) {
  469→                const currentTime = this.staticAudioContext.currentTime;
  470→
  471→                // Create three sound components: hum, capacitor whine, and fat buzz
  472→                const masterGain = this.staticAudioContext.createGain();
  473→                masterGain.gain.setValueAtTime(0.12, currentTime);
  474→                masterGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.5);
  475→                masterGain.connect(this.staticAudioContext.destination);
  476→
  477→                // 1. Low frequency hum (50-120Hz)
  478→                const humOscillator = this.staticAudioContext.createOscillator();
  479→                const humGain = this.staticAudioContext.createGain();
  480→                humOscillator.frequency.value = 60 + Math.random() * 60; // 60-120Hz
  481→                humOscillator.type = 'sine';
  482→                humGain.gain.setValueAtTime(0.4, currentTime);
  483→
  484→                humOscillator.connect(humGain);
  485→                humGain.connect(masterGain);
  486→
  487→                // 2. High-pitched capacitor whine (1kHz-5kHz with modulation)
  488→                const whineOscillator = this.staticAudioContext.createOscillator();
  489→                const whineGain = this.staticAudioContext.createGain();
  490→                const whineLFO = this.staticAudioContext.createOscillator();
  491→                const whineLFODepth = this.staticAudioContext.createGain();
  492→
  493→                // Set up whine frequency and modulation
  494→                whineOscillator.frequency.value = 2000 + Math.random() * 3000; // 2-5kHz
  495→                whineOscillator.type = 'sawtooth'; // Harsher tone for capacitor effect
  496→
  497→                // LFO to create realistic capacitor whine modulation
  498→                whineLFO.frequency.value = 3 + Math.random() * 7; // 3-10Hz modulation
  499→                whineLFODepth.gain.value = 500; // Modulation depth
  500→
  501→                whineLFO.connect(whineLFODepth);
  502→                whineLFODepth.connect(whineOscillator.frequency);
  503→
  504→                whineGain.gain.setValueAtTime(0.3, currentTime);
  505→
  506→                whineOscillator.connect(whineGain);
  507→                whineGain.connect(masterGain);
  508→
  509→                // 3. Fat buzz (100-300Hz with harmonics)
  510→                const buzzOscillator = this.staticAudioContext.createOscillator();
  511→                const buzzGain = this.staticAudioContext.createGain();
  512→                const buzzFilter = this.staticAudioContext.createBiquadFilter();
  513→
  514→                buzzOscillator.frequency.value = 150 + Math.random() * 150; // 150-300Hz
  515→                buzzOscillator.type = 'square'; // Rich harmonics for buzz
  516→
  517→                // Low-pass filter to soften the harsh square wave
  518→                buzzFilter.type = 'lowpass';
  519→                buzzFilter.frequency.value = 800 + Math.random() * 400; // 800-1200Hz
  520→                buzzFilter.Q.value = 2; // Some resonance for character
  521→
  522→                buzzGain.gain.setValueAtTime(0.2, currentTime);
  523→
  524→                buzzOscillator.connect(buzzFilter);
  525→                buzzFilter.connect(buzzGain);
  526→                buzzGain.connect(masterGain);
  527→
  528→                // Add some random frequency drift for realism
  529→                const driftInterval = setInterval(() => {
  530→                    if (this.staticAudioContext && this.staticAudioContext.currentTime < currentTime + 1.5) {
  531→                        humOscillator.frequency.exponentialRampToValueAtTime(
  532→                            humOscillator.frequency.value * (0.9 + Math.random() * 0.2),
  533→                            this.staticAudioContext.currentTime + 0.1
  534→                        );
  535→                        whineOscillator.frequency.exponentialRampToValueAtTime(
  536→                            whineOscillator.frequency.value * (0.95 + Math.random() * 0.1),
  537→                            this.staticAudioContext.currentTime + 0.05
  538→                        );
  539→                    } else {
  540→                        clearInterval(driftInterval);
  541→                    }
  542→                }, 100);
  543→
  544→                // Start all oscillators
  545→                humOscillator.start(currentTime);
  546→                whineOscillator.start(currentTime);
  547→                buzzOscillator.start(currentTime);
  548→
  549→                // Stop after 1.5 seconds
  550→                humOscillator.stop(currentTime + 1.5);
  551→                whineOscillator.stop(currentTime + 1.5);
  552→                buzzOscillator.stop(currentTime + 1.5);
  553→                whineLFO.stop(currentTime + 1.5);
  554→
  555→                console.log('🔊 Playing enhanced hum with capacitor whine and fat buzz');
  556→            }
  557→        } catch (error) {
  558→            console.warn('⚠️ Could not play hum/whine sound:', error);
  559→        }
  560→    }
  561→
  562→    showStaticOverlay() {
  563→        const staticElement = document.getElementById('static');
  564→        if (staticElement) {
  565→            staticElement.style.display = 'block';
  566→            staticElement.style.opacity = '0.8';
  567→
  568→            // Start static animation (canvas noise)
  569→            this.startStaticNoise();
  570→
  571→            // Play static audio briefly
  572→            if (this.staticNoiseElement) {
  573→                this.staticNoiseElement.volume = (this.volume || 0.3) * 0.3;
  574→                this.staticNoiseElement.play().catch(() => {
  575→                    // Ignore audio errors
  576→                });
  577→            }
  578→
  579→            // Hide static after brief flash when video should be playing
  580→            setTimeout(() => {
  581→                staticElement.style.opacity = '';
  582→
  583→                // Check if any video is actively playing
  584→                const anyVideoPlaying = this.isScheduledVideoPlaying ||
  585→                    (this.currentVideoElement && !this.currentVideoElement.paused) ||
  586→                    (this.scheduledVideoElement && !this.scheduledVideoElement.paused);
  587→
  588→                if (anyVideoPlaying) {
  589→                    staticElement.style.display = 'none';
  590→                    // Stop static audio when hiding overlay after slap
  591→                    this.stopStaticAudio();
  592→                }
  593→            }, 200); // Brief static flash
  594→        }
  595→    }
  596→
  597→    stopStaticAudio() {
  598→        // Stop white noise audio
  599→        if (this.whiteNoiseNode) {
  600→            this.whiteNoiseNode.disconnect();
  601→            this.whiteNoiseNode = null;
  602→        }
  603→
  604→        if (this.staticNoiseElement) {
  605→            this.staticNoiseElement.pause();
  606→            this.staticNoiseElement.currentTime = 0;
  607→        }
  608→
  609→        console.log('🔇 Static audio stopped');
  610→    }
  611→
  612→    setupVolumeControl() {
  613→        const volumeKnob = document.getElementById('volumeKnob');
  614→        const volumeLevel = document.getElementById('volumeLevel');
  615→
  616→        if (!volumeKnob || !volumeLevel) return;
  617→
  618→        let isDragging = false;
  619→        let startY = 0;
  620→        let startVolume = 0;
  621→
  622→        const updateVolume = (clientY) => {
  623→            const deltaY = startY - clientY;
  624→            const deltaVolume = deltaY / 100;
  625→            this.volume = Math.max(0, Math.min(1, startVolume + deltaVolume));
  626→
  627→            const rotation = this.volume * 270 - 135;
  628→            volumeKnob.style.transform = `rotate(${rotation}deg)`;
  629→            volumeLevel.textContent = Math.round(this.volume * 100);
  630→
  631→            this.updateVolume();
  632→        };
  633→
  634→        volumeKnob.addEventListener('mousedown', (e) => {
  635→            isDragging = true;
  636→            startY = e.clientY;
  637→            startVolume = this.volume;
  638→            volumeKnob.style.cursor = 'grabbing';
  639→        });
  640→
  641→        document.addEventListener('mousemove', (e) => {
  642→            if (isDragging) {
  643→                updateVolume(e.clientY);
  644→            }
  645→        });
  646→
  647→        document.addEventListener('mouseup', () => {
  648→            isDragging = false;
  649→     