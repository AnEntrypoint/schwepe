console.log('Navbar loaded');

// TV Schedule Modal functionality
class TVSchedule {
  constructor() {
    this.modal = document.getElementById('tv-schedule-modal');
    this.scheduleBtn = document.getElementById('schedule-btn');
    this.closeBtn = document.querySelector('.schedule-close');
    this.scheduleGrid = document.getElementById('schedule-grid');
    this.weekNumEl = document.getElementById('schedule-week-num');
    this.currentTimeEl = document.getElementById('schedule-current-time');
    this.scheduleEpoch = new Date('2025-11-14T00:00:00Z').getTime();
    this.DEFAULT_SLOT_DURATION = 1800000; // 30 minutes
    this.updateInterval = null;
    
    this.init();
  }

  init() {
    if (!this.scheduleBtn || !this.modal) return;

    this.scheduleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.open();
    });

    this.closeBtn?.addEventListener('click', () => this.close());
    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }

  getWeekNumber() {
    const now = Date.now();
    const elapsed = now - this.scheduleEpoch;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    if (elapsed < 0) return 1;
    
    const weekNum = Math.floor(elapsed / oneWeek) + 1;
    return ((weekNum - 1) % 78) + 1;
  }

  async loadSchedule(week) {
    try {
      const response = await fetch(`/public/schedule_weeks/week_${week}.json`);
      const data = await response.json();
      return data.v || {};
    } catch (e) {
      console.error('Failed to load schedule:', e);
      return {};
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  getCurrentSlot() {
    const now = Date.now();
    const elapsed = now - this.scheduleEpoch;
    const totalSlots = Object.keys(this.currentSchedule || {}).length;
    
    if (totalSlots === 0) return { index: 0, position: 0 };
    
    const totalCycleDuration = totalSlots * this.DEFAULT_SLOT_DURATION;
    const positionInCycle = elapsed % totalCycleDuration;
    const slotIndex = Math.floor(positionInCycle / this.DEFAULT_SLOT_DURATION);
    const positionInSlot = positionInCycle % this.DEFAULT_SLOT_DURATION;
    
    return { index: slotIndex, position: positionInSlot };
  }

  async generateSchedule() {
    const week = this.getWeekNumber();
    this.currentSchedule = await this.loadSchedule(week);
    
    const scheduleEntries = Object.entries(this.currentSchedule);
    
    if (scheduleEntries.length === 0) {
      this.scheduleGrid.innerHTML = '<div class="schedule-loading">No schedule available for this week</div>';
      return;
    }

    const currentSlot = this.getCurrentSlot();
    const now = Date.now();
    const elapsed = now - this.scheduleEpoch;
    
    // Calculate when the current cycle started
    const totalSlots = scheduleEntries.length;
    const totalCycleDuration = totalSlots * this.DEFAULT_SLOT_DURATION;
    const cycleStartTime = now - (elapsed % totalCycleDuration);
    
    let html = '';
    
    // Show previous slot, current slot, and next 5 slots
    const slotsToShow = 7;
    const startSlot = Math.max(0, currentSlot.index - 1);
    
    for (let i = 0; i < slotsToShow; i++) {
      const slotIndex = (startSlot + i) % totalSlots;
      const [id, entry] = scheduleEntries[slotIndex];
      
      const slotStartTime = cycleStartTime + (slotIndex * this.DEFAULT_SLOT_DURATION);
      const slotEndTime = slotStartTime + this.DEFAULT_SLOT_DURATION;
      const slotDate = new Date(slotStartTime);
      
      const isNowPlaying = slotIndex === currentSlot.index;
      const isPast = now > slotEndTime;
      
      const slotClass = isNowPlaying ? 'schedule-slot now-playing' : 'schedule-slot';
      const badge = isNowPlaying ? '<span class="slot-badge live">● LIVE NOW</span>' : '';
      
      html += `
        <div class="${slotClass}">
          <div class="slot-header">
            <div class="slot-time">${this.formatTime(slotDate)}</div>
            <div class="slot-duration">${this.formatDuration(this.DEFAULT_SLOT_DURATION)}</div>
          </div>
          <div class="slot-show">${entry.show}${badge}</div>
          <div class="slot-episode">${entry.episode}</div>
        </div>
      `;
    }
    
    this.scheduleGrid.innerHTML = html;
  }

  updateClock() {
    const now = new Date();
    this.currentTimeEl.textContent = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  async open() {
    this.modal.classList.add('active');
    this.weekNumEl.textContent = this.getWeekNumber();
    this.updateClock();
    
    this.scheduleGrid.innerHTML = '<div class="schedule-loading">Loading TV Guide...</div>';
    
    await this.generateSchedule();
    
    // Update clock every second
    this.updateInterval = setInterval(() => {
      this.updateClock();
      // Regenerate schedule every minute to update current slot
      if (new Date().getSeconds() === 0) {
        this.generateSchedule();
      }
    }, 1000);
  }

  close() {
    this.modal.classList.remove('active');
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Initialize TV Schedule when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.tvSchedule = new TVSchedule();
  });
} else {
  window.tvSchedule = new TVSchedule();
}
