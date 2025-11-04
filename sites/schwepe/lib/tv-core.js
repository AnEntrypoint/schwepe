/**
 * Schwelevision Core Broadcasting Module
 * Core broadcasting system functionality
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Core broadcasting configuration
export const broadcastConfig = {
  stationId: 'schwepe-tv',
  version: '2.0.0',
  supportedFormats: ['mp4', 'webm', 'jpg', 'png'],
  maxConcurrentStreams: 10,
  defaultQuality: '720p',
  bufferSize: 1024 * 1024 // 1MB
};

/**
 * Broadcasting system state manager
 */
export class BroadcastState {
  constructor() {
    this.isBroadcasting = false;
    this.currentProgram = null;
    this.viewerCount = 0;
    this.startTime = null;
    this.activeStreams = new Map();
  }

  startBroadcast(program) {
    this.isBroadcasting = true;
    this.currentProgram = program;
    this.startTime = new Date();
    console.log(`Broadcast started: ${program.name}`);
  }

  stopBroadcast() {
    this.isBroadcasting = false;
    this.currentProgram = null;
    this.startTime = null;
    console.log('Broadcast stopped');
  }

  addViewer() {
    this.viewerCount++;
    return this.viewerCount;
  }

  removeViewer() {
    this.viewerCount = Math.max(0, this.viewerCount - 1);
    return this.viewerCount;
  }

  getBroadcastInfo() {
    return {
      isBroadcasting: this.isBroadcasting,
      currentProgram: this.currentProgram,
      viewerCount: this.viewerCount,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      activeStreams: this.activeStreams.size
    };
  }
}

/**
 * Media stream manager
 */
export class StreamManager {
  constructor() {
    this.streams = new Map();
    this.maxStreams = broadcastConfig.maxConcurrentStreams;
  }

  createStream(streamId, source) {
    if (this.streams.size >= this.maxStreams) {
      throw new Error('Maximum concurrent streams reached');
    }

    const stream = {
      id: streamId,
      source: source,
      startTime: Date.now(),
      bytesTransferred: 0,
      isActive: true
    };

    this.streams.set(streamId, stream);
    return stream;
  }

  getStream(streamId) {
    return this.streams.get(streamId);
  }

  updateStream(streamId, data) {
    const stream = this.streams.get(streamId);
    if (stream) {
      Object.assign(stream, data);
    }
  }

  closeStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.isActive = false;
      this.streams.delete(streamId);
      return true;
    }
    return false;
  }

  getActiveStreams() {
    return Array.from(this.streams.values()).filter(s => s.isActive);
  }
}

/**
 * Program scheduler core
 */
export class ProgramScheduler {
  constructor() {
    this.schedule = [];
    this.currentIndex = 0;
    this.isLooping = true;
  }

  addProgram(program) {
    this.schedule.push({
      ...program,
      id: Date.now().toString(),
      addedAt: new Date()
    });
  }

  removeProgram(programId) {
    this.schedule = this.schedule.filter(p => p.id !== programId);
  }

  getCurrentProgram() {
    if (this.schedule.length === 0) return null;
    return this.schedule[this.currentIndex] || this.schedule[0];
  }

  nextProgram() {
    if (this.schedule.length === 0) return null;
    
    this.currentIndex = (this.currentIndex + 1) % this.schedule.length;
    return this.getCurrentProgram();
  }

  setSchedule(schedule) {
    this.schedule = schedule;
    this.currentIndex = 0;
  }

  getScheduleInfo() {
    return {
      totalPrograms: this.schedule.length,
      currentIndex: this.currentIndex,
      isLooping: this.isLooping,
      currentProgram: this.getCurrentProgram()
    };
  }
}

/**
 * Content validator
 */
export class ContentValidator {
  static validateProgram(program) {
    const required = ['name', 'type', 'source'];
    const missing = required.filter(field => !program[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!broadcastConfig.supportedFormats.includes(program.format)) {
      throw new Error(`Unsupported format: ${program.format}`);
    }

    return true;
  }

  static validateSource(source) {
    if (typeof source !== 'string' && typeof source !== 'object') {
      throw new Error('Source must be a string or object');
    }

    return true;
  }
}

/**
 * Utility functions
 */
export const utils = {
  /**
   * Generate unique broadcast ID
   */
  generateBroadcastId: () => `schwepe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Format duration for display
   */
  formatDuration: (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  },

  /**
   * Calculate bandwidth usage
   */
  calculateBandwidth: (bytes, timeMs) => {
    if (timeMs === 0) return 0;
    return Math.round((bytes * 8) / (timeMs / 1000)); // bits per second
  },

  /**
   * Get appropriate quality based on bandwidth
   */
  getQualityForBandwidth: (bandwidthBps) => {
    if (bandwidthBps < 1000000) return '360p';
    if (bandwidthBps < 2500000) return '480p';
    if (bandwidthBps < 5000000) return '720p';
    return '1080p';
  }
};