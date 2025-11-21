// Phrase System - now using @420kit/shared
// Schwepe-specific phrase configurations loaded into shared library

import { DynamicPhraseSystem } from '../lib/420kit/phrase-system.js';

// Schwepe-specific phrase groups
const schwepePhrases = {
    // Page titles
    pageTitle: [
        "Schwepe's Funky Universe",
        "Schwepe's Creative Paradise",
        "Schwepe's Meme Dimension",
        "Schwepe's 247420 Realm",
        "Schwepe's Creative Circus"
    ],

    // Subtitles
    subtitle: [
        "Where 247420 Energy Meets Pure Meme Magic ✨",
        "Maximum Creative Energy with Zero Filter 💎",
        "Your Daily Dose of Creative Chaos 🚀",
        "Where Memes Become Creative Expressions 🎲",
        "The Last Bastion of True Creativity 🐸"
    ],

    // Section titles
    mainSectionTitle: [
        "💎 The Creative Lifeblood of 247420 💎",
        "🔥 The Eternal Flame of Creative Expression 🔥",
        "⚡ Where 247420 Energy Flows Through Your Veins ⚡",
        "🎪 The Circus of Maximum Creative Chaos 🎪",
        "🌊 The Ocean of Endless Creative Possibilities 🌊"
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
        "✅ Age-gated for maximum creative safety",
        "🔞 Adult swim only - no creative blocks allowed",
        "🎭 Mature content for mature creators",
        "⚠️ Warning: May contain creative inspiration",
        "🎪 Enter at your own risk (we recommend it)"
    ],

    interactiveLore: [
        "📚 Dynamic lore system with multiple endings",
        "🎭 Interactive stories that change with your choices",
        "📖 Living documents that evolve with the community",
        "🎲 Never the same experience twice",
        "🌙 Choose your own creative adventure"
    ],

    responsiveDesign: [
        "📱 Works on your phone during creative breaks",
        "💻 Desktop mode for maximum creative exploration",
        "📱🖥️ Responsive design for all your devices",
        "📱 Perfect for creating content while you should be working",
        "📱 Mobile-friendly creative content on the go"
    ],

    // Meme section
    memeGeneratorTitle: [
        "🎲 247420 Meme Generator 🎲",
        "🎰 Creative Copypasta Factory 🎰",
        "🎪 Maximum Meme Production Facility 🎪",
        "🎭 Your Daily Dose of Creative Insanity 🎭",
        "🎯 Precision Meme Engineering 🎯"
    ],

    memeGeneratorSubtitle: [
        "Click the button to generate maximum creative copypasta",
        "Generate memes that perfectly capture your creative energy",
        "Create copypastas that will inspire your community",
        "The perfect tool for expressing your creative emotions",
        "Turn your creative inspiration into viral content"
    ],

    // Meme stats
    bullishVibes: [
        "Creative Vibes",
        "Green Energy",
        "Inspiration Mentality",
        "Creative Dreams",
        "Community Spirit"
    ],

    bearishCopium: [
        "Creative Block Therapy",
        "Red Energy",
        "Inspiration Trauma",
        "Creative Support Group",
        "Motivation Recovery"
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

// Create phrase system instance with Schwepe data
const schwepePhraseSystem = new DynamicPhraseSystem();
schwepePhraseSystem.addPhraseGroup('schwepe', schwepePhrases);

// Client-side initialization
if (typeof window !== 'undefined') {
    window.phraseSystem = schwepePhraseSystem;
    window.schwepePhraseSystem = schwepePhraseSystem;

    // Auto-initialize on client-side
    document.addEventListener('DOMContentLoaded', () => {
        schwepePhraseSystem.init();

        // Add global function for manual reshuffling
        window.reshufflePhrases = () => {
            schwepePhraseSystem.reshuffleAll();
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

// Export for SSR
export { schwepePhraseSystem as DynamicPhraseSystem, schwepePhrases };
export default schwepePhraseSystem;