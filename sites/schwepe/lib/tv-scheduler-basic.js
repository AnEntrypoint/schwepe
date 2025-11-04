/**
 * Schwelevision Scheduler Module
 * Advanced scheduling and automation
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { ProgramScheduler, utils } from './tv-core.js';

/**
 * Advanced scheduling system with time-based programming
 */
export class AdvancedScheduler extends ProgramScheduler {
  constructor() {
    super();
    this.timeSlots = new Map();
    this.specialEvents = [];
    this.autoFillEnabled = true;
  }

  /**
   * Add time slot programming
   */
  addTimeSlot(startTime, duration, programType, fallbackContent) {
    const slot = {
      startTime,
      duration,
      programType,
      fallbackContent,
      id: utils.generateBroadcastId()
    };
    
    this.timeSlots.set(slot.id, slot);
    return slot;
  }

  /**
   * Get current time slot
   */
  getCurrentTimeSlot() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const slot of this.timeSlots.values()) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const slotStart = startHour * 60 + startMin;
      const slotEnd = slotStart + slot.duration;
      
      if (currentTime >= slotStart && currentTime < slotEnd) {
        return slot;
      }
    }
    
    return null;
  }

  /**
   * Schedule program based on time slots
   */
  scheduleForTimeSlot(program, timeSlotId) {
    const timeSlot = this.timeSlots.get(timeSlotId);
    if (!timeSlot) {
      throw new Error('Time slot not found');
    }

    return this.addProgram({
      ...program,
      scheduledFor: timeSlotId,
      type: timeSlot.programType
    });
  }

  /**
   * Auto-fill empty time slots
   */
  autoFillSchedule(contentLibrary) {
    if (!this.autoFillEnabled || !contentLibrary || contentLibrary.length === 0) {
      return;
    }

    const currentSlot = this.getCurrentTimeSlot();
    if (currentSlot && this.schedule.length === 0) {
      // Fill with content matching the time slot type
      const suitableContent = contentLibrary.filter(
        content => content.type === currentSlot.programType
      );

      if (suitableContent.length > 0) {
        const randomContent = suitableContent[Math.floor(Math.random() * suitableContent.length)];
        this.addProgram({
          ...randomContent,
          scheduledFor: currentSlot.id
        });
      } else if (currentSlot.fallbackContent) {
        this.addProgram(currentSlot.fallbackContent);
      }
    }
  }
}

/**
 * Content library manager
 */
export class ContentLibrary {
  constructor() {
    this.content = new Map();
    this.categories = new Map();
    this.tags = new Set();
  }

  /**
   * Add content to library
   */
  addContent(content) {
    const contentId = content.id || utils.generateBroadcastId();
    const contentWithMeta = {
      ...content,
      id: contentId,
      addedAt: new Date(),
      playCount: 0,
      lastPlayed: null
    };

    this.content.set(contentId, contentWithMeta);
    this.indexContent(contentWithMeta);
    
    return contentId;
  }

  /**
   * Index content by categories and tags
   */
  indexContent(content) {
    if (content.category) {
      if (!this.categories.has(content.category)) {
        this.categories.set(content.category, new Set());
      }
      this.categories.get(content.category).add(content.id);
    }

    if (content.tags) {
      content.tags.forEach(tag => {
        this.tags.add(tag);
      });
    }
  }

  /**
   * Get content by category
   */
  getContentByCategory(category) {
    const categoryIds = this.categories.get(category);
    if (!categoryIds) return [];

    return Array.from(categoryIds).map(id => this.content.get(id)).filter(Boolean);
  }

  /**
   * Get content by tag
   */
  getContentByTag(tag) {
    return Array.from(this.content.values()).filter(
      content => content.tags && content.tags.includes(tag)
    );
  }

  /**
   * Get random content
   */
  getRandomContent(category = null, count = 1) {
    let availableContent = Array.from(this.content.values());
    
    if (category) {
      availableContent = this.getContentByCategory(category);
    }

    if (availableContent.length === 0) return [];

    const shuffled = [...availableContent].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Update content statistics
   */
  updateContentStats(contentId) {
    const content = this.content.get(contentId);
    if (content) {
      content.playCount++;
      content.lastPlayed = new Date();
    }
  }

  /**
   * Get library statistics
   */
  getStats() {
    return {
      totalContent: this.content.size,
      categories: this.categories.size,
      tags: this.tags.size,
      totalPlayCount: Array.from(this.content.values()).reduce(
        (sum, content) => sum + content.playCount, 0
      )
    };
  }
}

/**
 * Play history tracker
 */
export class PlayHistory {
  constructor() {
    this.entries = [];
  }

  addEntry(program, startTime, endTime) {
    this.entries.push({
      program,
      startTime,
      endTime,
      duration: endTime - startTime,
      timestamp: new Date()
    });
  }

  getHistory(limit = 50) {
    return this.entries.slice(-limit).reverse();
  }

  clear() {
    this.entries = [];
  }
}