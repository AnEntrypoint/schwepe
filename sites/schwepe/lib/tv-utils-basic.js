/**
 * Schwelevision Utils Module
 * Utilities and main broadcasting system
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { BroadcastState, StreamManager, ContentValidator, utils, broadcastConfig } from './tv-core-basic.js';
import { AdvancedScheduler, ContentLibrary, PlayHistory } from './tv-scheduler-basic.js';

/**
 * Main Schwelevision broadcasting system
 */
export class SchwelevisionSystem {
  constructor(options = {}) {
    this.config = { ...broadcastConfig, ...options };
    this.state = new BroadcastState();
    this.streamManager = new StreamManager();
    this.scheduler = new AdvancedScheduler();
    this.contentLibrary = new ContentLibrary();
    this.playHistory = new PlayHistory();
    
    this.isAutoMode = false;
    this.autoModeInterval = null;
  }

  /**
   * Initialize the broadcasting system
   */
  async initialize() {
    console.log('Initializing Schwelevision System...');
    
    // Load default content if available
    await this.loadDefaultContent();
    
    // Start auto mode if enabled
    if (this.isAutoMode) {
      this.startAutoMode();
    }
    
    console.log('Schwelevision System initialized');
    return true;
  }

  /**
   * Start broadcasting
   */
  async startBroadcast(program = null) {
    if (this.state.isBroadcasting) {
      console.log('Broadcast already running');
      return false;
    }

    const selectedProgram = program || this.scheduler.getCurrentProgram();
    if (!selectedProgram) {
      throw new Error('No program available to broadcast');
    }

    // Validate program
    ContentValidator.validateProgram(selectedProgram);
    ContentValidator.validateSource(selectedProgram.source);

    // Start the broadcast
    this.state.startBroadcast(selectedProgram);
    this.contentLibrary.updateContentStats(selectedProgram.id);

    return selectedProgram;
  }

  /**
   * Stop broadcasting
   */
  stopBroadcast() {
    if (!this.state.isBroadcasting) {
      console.log('No broadcast running');
      return false;
    }

    const currentProgram = this.state.currentProgram;
    
    // Add to play history
    this.playHistory.addEntry(
      currentProgram,
      this.state.startTime,
      new Date()
    );

    this.state.stopBroadcast();
    
    // Clean up streams
    this.streamManager.getActiveStreams().forEach(stream => {
      this.streamManager.closeStream(stream.id);
    });

    return true;
  }

  /**
   * Start automatic mode
   */
  startAutoMode() {
    if (this.isAutoMode) return;

    this.isAutoMode = true;
    
    this.autoModeInterval = setInterval(() => {
      this.handleAutoMode();
    }, 60000); // Check every minute

    console.log('Auto mode started');
  }

  /**
   * Stop automatic mode
   */
  stopAutoMode() {
    if (!this.isAutoMode) return;

    this.isAutoMode = false;
    
    if (this.autoModeInterval) {
      clearInterval(this.autoModeInterval);
      this.autoModeInterval = null;
    }

    console.log('Auto mode stopped');
  }

  /**
   * Handle automatic mode logic
   */
  handleAutoMode() {
    if (!this.state.isBroadcasting) {
      // Auto-fill schedule if needed
      this.scheduler.autoFillSchedule(this.contentLibrary.getRandomContent());
      
      // Start next program
      const nextProgram = this.scheduler.nextProgram();
      if (nextProgram) {
        this.startBroadcast(nextProgram);
      }
    } else {
      // Check if current program should end
      const currentProgram = this.state.currentProgram;
      const elapsed = Date.now() - this.state.startTime.getTime();
      
      if (currentProgram.duration && elapsed >= currentProgram.duration) {
        this.stopBroadcast();
        // Next program will be started in the next auto-mode cycle
      }
    }
  }

  /**
   * Load default content
   */
  async loadDefaultContent() {
    try {
      // Try to load from default JSON file
      const defaultContentPath = './sites/schwepe/schedule.json';
      const fs = await import('fs');
      
      if (fs.existsSync(defaultContentPath)) {
        const contentData = JSON.parse(fs.readFileSync(defaultContentPath, 'utf8'));
        
        if (Array.isArray(contentData)) {
          contentData.forEach(item => {
            this.contentLibrary.addContent(item);
          });
        }
      }
    } catch (error) {
      console.log('No default content found, using empty library');
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isBroadcasting: this.state.isBroadcasting,
      currentProgram: this.state.currentProgram,
      startTime: this.state.startTime,
      contentCount: this.contentLibrary.getContentCount(),
      playHistoryCount: this.playHistory.entries.length,
      isAutoMode: this.isAutoMode,
      uptime: Date.now() - (this.state.startTime?.getTime() || Date.now())
    };
  }
}

export function createSchwelevisionSystem(options = {}) {
  return new SchwelevisionSystem(options);
}

export async function quickSetup(options = {}) {
  const system = new SchwelevisionSystem(options);
  await system.initialize();
  return system;
}

export default SchwelevisionSystem;