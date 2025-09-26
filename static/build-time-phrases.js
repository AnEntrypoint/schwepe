// Build-Time Phrase System for Static Site Generation
// Phrases are selected at build time, not runtime, for true SSR

class BuildTimePhraseSystem {
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

        this.buildSelections = new Map();
    }

    // Build-time phrase selection
    selectBuildPhrases() {
        const selections = {};

        Object.keys(this.phraseGroups).forEach(group => {
            const groupData = this.phraseGroups[group];

            // Check if the group data is an array (direct phrases) or an object (nested structure)
            if (Array.isArray(groupData)) {
                // Direct array structure like pageTitle: ["phrase1", "phrase2", ...]
                const randomIndex = Math.floor(Math.random() * groupData.length);
                selections[group] = {
                    selectedIndex: randomIndex,
                    selectedPhrase: groupData[randomIndex],
                    totalPhrases: groupData.length,
                    allPhrases: groupData
                };
            } else {
                // Nested object structure like category: { key: ["phrase1", "phrase2", ...] }
                selections[group] = {};
                Object.keys(groupData).forEach(key => {
                    const phrases = groupData[key];
                    const randomIndex = Math.floor(Math.random() * phrases.length);
                    selections[group][key] = {
                        selectedIndex: randomIndex,
                        selectedPhrase: phrases[randomIndex],
                        totalPhrases: phrases.length,
                        allPhrases: phrases
                    };
                });
            }
        });

        return selections;
    }

    // Generate phrase data for decap CMS
    generateDecapData() {
        const decapData = {
            phrases: {}
        };

        Object.keys(this.phraseGroups).forEach(group => {
            decapData.phrases[group] = {};
            Object.keys(this.phraseGroups[group]).forEach(key => {
                decapData.phrases[group][key] = {
                    phrases: this.phraseGroups[group][key],
                    selected: this.phraseGroups[group][key][0], // Default to first
                    selectedIndex: 0
                };
            });
        });

        return decapData;
    }

    // Get phrase selection for a specific group and key
    getPhrase(group, key, selections = null) {
        if (!selections) {
            selections = this.selectBuildPhrases();
        }

        // Check if the group selection is a direct phrase (array structure) or nested (object structure)
        if (selections[group]) {
            if (selections[group].selectedPhrase !== undefined) {
                // Direct array structure
                return selections[group].selectedPhrase;
            } else if (selections[group][key]) {
                // Nested object structure
                return selections[group][key].selectedPhrase;
            }
        }

        // Fallback to original data structure
        const groupData = this.phraseGroups[group];
        if (Array.isArray(groupData)) {
            return groupData[0] || '';
        } else {
            return groupData?.[key]?.[0] || '';
        }
    }

    // Get all selections for a build
    getBuildSelections() {
        return this.selectBuildPhrases();
    }

    // Generate HTML with phrases embedded
    generateHTMLWithPhrases(htmlContent, selections) {
        let processedHTML = htmlContent;

        // Replace data-phrase attributes with selected phrases
        processedHTML = processedHTML.replace(
            /data-phrase-group="([^"]+)"\s+data-phrase-key="([^"]+)"/g,
            (match, group, key) => {
                const phrase = this.getPhrase(group, key, selections);
                return `data-phrase-group="${group}" data-phrase-key="${key}" data-phrase-selected="${phrase}"`;
            }
        );

        return processedHTML;
    }

    // Create a build-time phrase replacement function
    createPhraseReplacer(selections) {
        return (group, key) => {
            return this.getPhrase(group, key, selections);
        };
    }

    // Export for build process
    exportForBuild() {
        return {
            selections: this.getBuildSelections(),
            phrases: this.phraseGroups,
            replacer: this.createPhraseReplacer(this.getBuildSelections())
        };
    }

    // Validate that all phrase groups have at least 3 candidates
    validatePhraseGroups() {
        const errors = [];

        Object.keys(this.phraseGroups).forEach(group => {
            Object.keys(this.phraseGroups[group]).forEach(key => {
                const phrases = this.phraseGroups[group][key];
                if (phrases.length < 3) {
                    errors.push(`${group}.${key} has only ${phrases.length} phrases (minimum 3 required)`);
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get statistics
    getStats() {
        let totalPhrases = 0;
        let totalGroups = 0;
        let totalKeys = 0;
        const phraseCounts = [];

        Object.keys(this.phraseGroups).forEach(group => {
            totalGroups++;
            Object.keys(this.phraseGroups[group]).forEach(key => {
                totalKeys++;
                const count = this.phraseGroups[group][key].length;
                totalPhrases += count;
                phraseCounts.push({ group, key, count });
            });
        });

        return {
            totalPhrases,
            totalGroups,
            totalKeys,
            averagePhrasesPerKey: totalPhrases / totalKeys,
            phraseCounts,
            validation: this.validatePhraseGroups()
        };
    }
}

// Export for use in build process
export { BuildTimePhraseSystem };

if (typeof window !== 'undefined') {
    window.BuildTimePhraseSystem = BuildTimePhraseSystem;
}