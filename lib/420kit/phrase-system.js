// SSR-Compatible Dynamic Phrase System
// Provides multiple variations for every text element with server-side rendering support

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DynamicPhraseSystem {
    constructor(options = {}) {
        this.phraseGroups = {};
        this.initialized = false;
        this.currentSelections = new Map();
        this.options = {
            localStorageKey: 'phraseSelections',
            enablePersistence: true,
            enableSSR: true,
            reshuffleKeybind: 'ctrl+shift+r',
            ...options
        };
    }

    // Add phrase groups programmatically
    addPhraseGroup(groupName, phrases) {
        this.phraseGroups[groupName] = phrases;
        return this;
    }

    // Load phrases from JSON file
    loadPhrasesFromFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const phrases = JSON.parse(content);
            Object.assign(this.phraseGroups, phrases);
            // console.log(`✅ Loaded phrases from ${filePath}`); // Silenced for production
        } catch (error) {
            // console.warn(`⚠️ Failed to load phrases from ${filePath}:`, error.message); // Silenced for production
        }
        return this;
    }

    // Load phrases from directory of JSON files
    loadPhrasesFromDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            // console.warn(`⚠️ Phrase directory not found: ${dirPath}`); // Silenced for production
            return this;
        }

        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(dirPath, file);
                this.loadPhrasesFromFile(filePath);
            }
        });
        return this;
    }

    // Initialize the phrase system
    init() {
        if (this.initialized) return;

        // Load saved selections from localStorage (for client-side consistency)
        if (this.options.enablePersistence && typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(this.options.localStorageKey);
            if (saved) {
                try {
                    this.currentSelections = new Map(JSON.parse(saved));
                } catch (e) {
                    // console.warn('Failed to parse saved phrase selections:', e); // Silenced for production
                }
            }
        }

        this.initialized = true;
        this.processPage();
    }

    // Process the current page for dynamic phrases
    processPage() {
        if (typeof document === 'undefined') return;

        // Find all elements with data-phrase-group attribute
        const phraseElements = document.querySelectorAll('[data-phrase-group]');

        phraseElements.forEach(element => {
            const group = element.getAttribute('data-phrase-group');
            const key = element.getAttribute('data-phrase-key');

            if (group && key && this.phraseGroups[group] && this.phraseGroups[group][key]) {
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
        if (typeof document !== 'undefined') {
            const elements = document.querySelectorAll(`[data-phrase-group="${group}"][data-phrase-key="${key}"]`);
            elements.forEach(element => {
                this.setDynamicText(element, phrases, group, key);
            });
        }
    }

    // Save selections to localStorage
    saveSelections() {
        if (this.options.enablePersistence && typeof localStorage !== 'undefined') {
            try {
                const selections = Array.from(this.currentSelections.entries());
                localStorage.setItem(this.options.localStorageKey, JSON.stringify(selections));
            } catch (e) {
                // console.warn('Failed to save phrase selections:', e); // Silenced for production
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
            averagePhrasesPerKey: totalKeys > 0 ? totalPhrases / totalKeys : 0
        };
    }

    // Validate phrase groups meet minimum requirements
    validatePhraseGroups() {
        const errors = [];
        const warnings = [];

        Object.keys(this.phraseGroups).forEach(group => {
            Object.keys(this.phraseGroups[group]).forEach(key => {
                const phrases = this.phraseGroups[group][key];

                if (!Array.isArray(phrases)) {
                    errors.push(`${group}.${key}: Phrases must be an array`);
                    return;
                }

                if (phrases.length === 0) {
                    errors.push(`${group}.${key}: Must have at least one phrase`);
                } else if (phrases.length === 1) {
                    warnings.push(`${group}.${key}: Only has one phrase (consider adding more for variation)`);
                }

                phrases.forEach((phrase, index) => {
                    if (typeof phrase !== 'string') {
                        errors.push(`${group}.${key}[${index}]: Phrase must be a string`);
                    } else if (phrase.trim().length === 0) {
                        warnings.push(`${group}.${key}[${index}]: Empty phrase`);
                    }
                });
            });
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats: this.getStats()
        };
    }

    // Export phrases to JSON
    exportPhrases() {
        return JSON.stringify(this.phraseGroups, null, 2);
    }

    // Import phrases from JSON
    importPhrases(jsonString) {
        try {
            const phrases = JSON.parse(jsonString);
            this.phraseGroups = phrases;
            return true;
        } catch (error) {
            // console.error('Failed to import phrases:', error); // Silenced for production
            return false;
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        if (typeof document === 'undefined') return;

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.reshuffleAll();
            }
        });
    }
}

// Build-time phrase system for static site generation
export class BuildTimePhraseSystem extends DynamicPhraseSystem {
    constructor(options = {}) {
        super(options);
        this.buildSelections = {};
        this.generateBuildSelections();
    }

    // Generate deterministic selections for build time
    generateBuildSelections() {
        Object.keys(this.phraseGroups).forEach(group => {
            this.buildSelections[group] = {};
            Object.keys(this.phraseGroups[group]).forEach(key => {
                const phrases = this.phraseGroups[group][key];
                if (phrases && phrases.length > 0) {
                    // Use a simple hash-based selection for consistency
                    const seed = `${group}_${key}`;
                    const hash = this.simpleHash(seed);
                    const selectedIndex = Math.abs(hash) % phrases.length;

                    this.buildSelections[group][key] = {
                        selectedIndex,
                        selectedPhrase: phrases[selectedIndex],
                        totalPhrases: phrases.length
                    };
                }
            });
        });
    }

    // Simple hash function for deterministic selection
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    // Get phrase for build time
    getPhrase(group, key, selections = null) {
        const buildSelections = selections || this.buildSelections;
        if (buildSelections[group] && buildSelections[group][key]) {
            return buildSelections[group][key].selectedPhrase;
        }
        return '';
    }

    // Get build selections
    getBuildSelections() {
        return this.buildSelections;
    }

    // Replace phrases in HTML content
    replacePhrasesInHTML(htmlContent) {
        let processedHTML = htmlContent;

        // Replace data-phrase attributes with selected phrases
        processedHTML = processedHTML.replace(
            /<([a-zA-Z0-9]+)([^>]*data-phrase-group="([^"]+)"[^>]*data-phrase-key="([^"]+)"[^>]*)>([^<]*)<\/\1>/g,
            (match, tag, attributes, group, key, content) => {
                const phrase = this.getPhrase(group, key);
                return `<${tag}${attributes} data-phrase-selected="${phrase}">${phrase}</${tag}>`;
            }
        );

        // Replace self-closing and void elements
        processedHTML = processedHTML.replace(
            /<([a-zA-Z0-9]+)([^>]*data-phrase-group="([^"]+)"[^>]*data-phrase-key="([^"]+)"[^>]*?)\/>/g,
            (match, tag, attributes, group, key) => {
                const phrase = this.getPhrase(group, key);
                return `<${tag}${attributes} data-phrase-selected="${phrase}">${phrase}</${tag}>`;
            }
        );

        return processedHTML;
    }
}

// Export for both SSR and client-side use
export function createPhraseSystem(options = {}) {
    return new DynamicPhraseSystem(options);
}

export function createBuildTimePhraseSystem(options = {}) {
    return new BuildTimePhraseSystem(options);
}

// Default export
export default DynamicPhraseSystem;