// SSR-Compatible Dynamic Phrase System
// Provides multiple variations for every text element with server-side rendering support

class DynamicPhraseSystem {
    constructor() {
        this.phraseGroups = {
            // Page titles
            pageTitle: [
                "Schwepe's Funky Universe",
                "Schwepe's Degen Paradise",
                "Schwepe's Meme Dimension",
                "Schwepe's 247420 Realm",
                "Schwepe's Crypto Circus"
            ],

            // Subtitles
            subtitle: [
                "Where 247420 Energy Meets Pure Meme Magic ✨",
                "Maximum Degen Energy with Zero Filter 💎",
                "Your Daily Dose of Crypto Chaos 🚀",
                "Where Memes Become Financial Instruments 🎲",
                "The Last Bastion of True Degeneracy 🐸"
            ],

            // Section titles
            mainSectionTitle: [
                "💎 The Degenerate Lifeblood of 247420 💎",
                "🔥 The Eternal Flame of Crypto Degeneracy 🔥",
                "⚡ Where 247420 Energy Flows Through Your Veins ⚡",
                "🎪 The Circus of Maximum Financial Chaos 🎪",
                "🌊 The Ocean of Endless Memetic Possibilities 🌊"
            ],

            // Feature section titles
            featureTitle: [
                "🎯 Why We're All Here 🎯",
                "🎲 The Degen Experience 🎲",
                "🚀 Why This Space Exists 🚀",
                "💎 What Makes Us Special 💎",
                "🐸 The Frog Philosophy 🐸"
            ],

            // Feature descriptions
            ageVerification: [
                "✅ Age-gated for maximum degen safety",
                "🔞 Adult swim only - no paper hands allowed",
                "🎭 Mature content for mature degenerates",
                "⚠️ Warning: May contain financial trauma",
                "🎪 Enter at your own risk (we recommend it)"
            ],

            interactiveLore: [
                "📚 Dynamic lore system with multiple endings",
                "🎭 Interactive stories that change with your choices",
                "📖 Living documents that evolve with the community",
                "🎲 Never the same experience twice",
                "🌙 Choose your own degen adventure"
            ],

            responsiveDesign: [
                "📱 Works on your phone during bathroom trading",
                "💻 Desktop mode for maximum degen analysis",
                "📱🖥️ Responsive design for all your devices",
                "📱 Perfect for checking charts while you should be working",
                "📱 Mobile-friendly degen content on the go"
            ],

            // Meme section
            memeGeneratorTitle: [
                "🎲 247420 Meme Generator 🎲",
                "🎰 Degen Copypasta Factory 🎰",
                "🎪 Maximum Meme Production Facility 🎪",
                "🎭 Your Daily Dose of Crypto Insanity 🎭",
                "🎯 Precision Meme Engineering 🎯"
            ],

            memeGeneratorSubtitle: [
                "Click the button to generate maximum degen copypasta",
                "Generate memes that perfectly capture your financial pain",
                "Create copypastas that will haunt your portfolio",
                "The perfect tool for expressing your degen emotions",
                "Turn your trading trauma into viral content"
            ],

            // Meme stats
            bullishVibes: [
                "Bullish Vibes",
                "Green Candle Energy",
                "Moonshot Mentality",
                "Lambo Dreams",
                "WAGMI Spirit"
            ],

            bearishCopium: [
                "Bearish Copium",
                "Red Candle Therapy",
                "Portfolio Trauma",
                "Rekt Support Group",
                "NGMI Recovery"
            ],

            gamblingAddiction: [
                "Gambling Addiction",
                "Degen Instincts",
                "Risk Appetite",
                "YOLO Energy",
                "Ape Mode Active"
            ],

            diamondHands: [
                "Diamond Hands",
                "HODL Philosophy",
                "Never Selling",
                "Long Term Vision",
                "Diamond Conviction"
            ],

            // Token section
            tokenInfoTitle: [
                "🔥 Token Information & How to Join the Chaos 🔥",
                "💎 The Tokenomics of Maximum Degeneracy 💎",
                "🚀 How to Ape Into the Future 🚀",
                "🎪 Your Guide to Financial Madness 🎪",
                "🌊 Diving Into the Token Ocean 🌊"
            ],

            tokenAddressLabel: [
                "🎯 Token Address",
                "💎 Contract Address",
                "🚀 Token Contract",
                "🎪 The Magic String",
                "🌊 Your Gateway to Degeneracy"
            ],

            howToBuyTitle: [
                "🎮 How to Join the 247420 Revolution 🎮",
                "💎 Your Path to Maximum Degen Status 💎",
                "🚀 The Ultimate Ape Guide 🚀",
                "🎪 Step-by-Step Financial Destruction 🎪",
                "🌊 How to Dive Into the Meme Pool 🌊"
            ],

            // Navigation items
            navHome: [
                "Home",
                "Base",
                "Launchpad",
                "Hub",
                "Command Center"
            ],

            navLore: [
                "Lore",
                "Stories",
                "Saga",
                "Chronicles",
                "Legends"
            ],

            navStats: [
                "Stats",
                "Data",
                "Analytics",
                "Metrics",
                "Intel"
            ],

            // Age verification
            ageVerificationTitle: [
                "⚠️ Age Verification Required",
                "🔞 Adult Content Ahead",
                "🎭 Maturity Checkpoint",
                "⚠️ Degen Zone Entry",
                "🎪 Age Gate of Chaos"
            ],

            ageVerificationText: [
                "This content contains mature themes, strong language, and existential dread that may not be suitable for all audiences. By proceeding, you confirm that you are 18+ years of age and mentally prepared for the financial trauma ahead.",
                "Warning: This area contains maximum degen energy, unfiltered crypto culture, and content that may trigger trading PTSD. Enter only if you have diamond hands and a strong sense of humor.",
                "Attention: You are about to enter a space of unapologetic memetic warfare, financial chaos, and 247420 culture. Please verify you're emotionally and financially prepared for what lies ahead.",
                "Caution: Beyond this point lies content that celebrates financial irresponsibility, crypto gambling, and the beautiful tragedy of degen life. 18+ only.",
                "Alert: You're entering a dimension where memes have monetary value, losses are worn as badges of honor, and sanity is optional. Age verification required."
            ],

            enterButton: [
                "I'm 18+ and Ready to Lose Money",
                "I'm 18+ and 99% Ape",
                "I'm 18+ and Diamond Handed",
                "I'm 18+ and Ready to WAGMI",
                "I'm 18+ and Emotionally Prepared"
            ],

            // Stats page
            statsPageTitle: [
                "Schwepe Stats - Real-time Data",
                "247420 Analytics Dashboard",
                "Degen Metrics Central",
                "Schwepe Intelligence Agency",
                "Live Market Intelligence"
            ],

            statsHeader: [
                "🔥 Live Schwepe Intelligence Dashboard 🔥",
                "⚡ Real-time 247420 Analytics ⚡",
                "🎯 Degen Metrics Central 🎯",
                "📊 Live Market Intelligence 📊",
                "🚀 Schwepe Command Center 🚀"
            ],

            statsSubtitle: [
                "Real-time market data, degen scoring, and meme analytics",
                "Live metrics for the maximum degen experience",
                "Real-time intelligence for your trading decisions",
                "Live data feeds from the heart of 247420",
                "Continuous market surveillance for degens"
            ],

            // Lore page
            lorePageTitle: [
                "Schwepe Lore - The Complete Saga",
                "The Schwepe Chronicles",
                "247420 Story Collection",
                "The Complete Degen Saga",
                "Schwepe Universe History"
            ],

            // Error messages
            loadingError: [
                "Error loading content",
                "Failed to load degen content",
                "Something went horribly wrong",
                "Meme loading failed",
                "Degen system malfunction"
            ],

            // Random encouragement phrases
            encouragement: [
                "Keep hodling! 💪",
                "WAGMI! 🚀",
                "Stay degen! 🎲",
                "Diamond hands! 💎",
                "This is the way! ⚡",
                "Ape together strong! 🦍",
                "Moon soon! 🌙",
                "Trust the plan! 🎯",
                "We're all gonna make it! 💪",
                "Believe in the meme! 🐸"
            ]
        };

        this.initialized = false;
        this.currentSelections = new Map();
    }

    // Initialize the phrase system
    init() {
        if (this.initialized) return;

        // Load saved selections from localStorage (for client-side consistency)
        const saved = localStorage.getItem('phraseSelections');
        if (saved) {
            try {
                this.currentSelections = new Map(JSON.parse(saved));
            } catch (e) {
                console.warn('Failed to parse saved phrase selections:', e);
            }
        }

        this.initialized = true;
        this.processPage();
    }

    // Process the current page for dynamic phrases
    processPage() {
        // Find all elements with data-phrase-group attribute
        const phraseElements = document.querySelectorAll('[data-phrase-group]');

        phraseElements.forEach(element => {
            const group = element.getAttribute('data-phrase-group');
            const key = element.getAttribute('data-phrase-key');

            if (group && key && this.phraseGroups[group]) {
                const phrases = this.getPhrases(group, key);
                if (phrases && phrases.length > 0) {
                    this.setDynamicText(element, phrases, group, key);
                }
            }
        });

        // Save current selections
        this.saveSelections();
    }

    // Get phrases for a specific group and key
    getPhrases(group, key) {
        if (this.phraseGroups[group] && this.phraseGroups[group][key]) {
            return this.phraseGroups[group][key];
        }
        return null;
    }

    // Get or create a selection for a phrase group
    getSelection(group, key) {
        const selectionKey = `${group}_${key}`;

        if (!this.currentSelections.has(selectionKey)) {
            const phrases = this.getPhrases(group, key);
            if (phrases && phrases.length > 0) {
                const randomIndex = Math.floor(Math.random() * phrases.length);
                this.currentSelections.set(selectionKey, randomIndex);
            }
        }

        return this.currentSelections.get(selectionKey) || 0;
    }

    // Set dynamic text on an element
    setDynamicText(element, phrases, group, key) {
        const selectedIndex = this.getSelection(group, key);
        const selectedPhrase = phrases[selectedIndex];

        if (selectedPhrase) {
            element.textContent = selectedPhrase;
            element.setAttribute('data-phrase-index', selectedIndex);
            element.setAttribute('data-phrase-total', phrases.length);

            // Add hover effect to show alternatives
            element.title = `Alternative: ${phrases[(selectedIndex + 1) % phrases.length]}`;
        }
    }

    // Rotate to next phrase in a group
    rotatePhrase(group, key) {
        const phrases = this.getPhrases(group, key);
        if (!phrases || phrases.length <= 1) return;

        const selectionKey = `${group}_${key}`;
        const currentIndex = this.currentSelections.get(selectionKey) || 0;
        const nextIndex = (currentIndex + 1) % phrases.length;

        this.currentSelections.set(selectionKey, nextIndex);
        this.saveSelections();

        // Update all elements with this group/key
        const elements = document.querySelectorAll(`[data-phrase-group="${group}"][data-phrase-key="${key}"]`);
        elements.forEach(element => {
            this.setDynamicText(element, phrases, group, key);
        });
    }

    // Save selections to localStorage
    saveSelections() {
        if (typeof localStorage !== 'undefined') {
            try {
                const selections = Array.from(this.currentSelections.entries());
                localStorage.setItem('phraseSelections', JSON.stringify(selections));
            } catch (e) {
                console.warn('Failed to save phrase selections:', e);
            }
        }
    }

    // SSR helper - generate selection data for server-side rendering
    generateSSRData() {
        const ssrData = {};

        Object.keys(this.phraseGroups).forEach(group => {
            ssrData[group] = {};
            Object.keys(this.phraseGroups[group]).forEach(key => {
                const phrases = this.phraseGroups[group][key];
                const randomIndex = Math.floor(Math.random() * phrases.length);
                ssrData[group][key] = {
                    selectedIndex: randomIndex,
                    selectedPhrase: phrases[randomIndex],
                    totalPhrases: phrases.length
                };
            });
        });

        return ssrData;
    }

    // Apply SSR data to the page
    applySSRData(ssrData) {
        Object.keys(ssrData).forEach(group => {
            Object.keys(ssrData[group]).forEach(key => {
                const data = ssrData[group][key];
                const selectionKey = `${group}_${key}`;
                this.currentSelections.set(selectionKey, data.selectedIndex);
            });
        });
    }

    // Get all phrases for a group (for debugging/development)
    getAllPhrases(group) {
        return this.phraseGroups[group] || {};
    }

    // Add new phrases dynamically
    addPhrases(group, key, phrases) {
        if (!this.phraseGroups[group]) {
            this.phraseGroups[group] = {};
        }
        if (!this.phraseGroups[group][key]) {
            this.phraseGroups[group][key] = [];
        }

        this.phraseGroups[group][key].push(...phrases);
    }

    // Reset all selections to new random values
    reshuffleAll() {
        this.currentSelections.clear();
        this.processPage();
    }

    // Get statistics about the phrase system
    getStats() {
        let totalPhrases = 0;
        let totalGroups = 0;
        let totalKeys = 0;

        Object.keys(this.phraseGroups).forEach(group => {
            totalGroups++;
            Object.keys(this.phraseGroups[group]).forEach(key => {
                totalKeys++;
                totalPhrases += this.phraseGroups[group][key].length;
            });
        });

        return {
            totalPhrases,
            totalGroups,
            totalKeys,
            averagePhrasesPerKey: totalPhrases / totalKeys
        };
    }
}

// Export for both SSR and client-side use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicPhraseSystem;
} else if (typeof window !== 'undefined') {
    window.DynamicPhraseSystem = DynamicPhraseSystem;

    // Auto-initialize on client-side
    document.addEventListener('DOMContentLoaded', () => {
        window.phraseSystem = new DynamicPhraseSystem();
        window.phraseSystem.init();

        // Add global function for manual reshuffling
        window.reshufflePhrases = () => {
            window.phraseSystem.reshuffleAll();
        };

        // Add keyboard shortcut for reshuffling (Ctrl+Shift+R)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                window.reshufflePhrases();
            }
        });
    });
}