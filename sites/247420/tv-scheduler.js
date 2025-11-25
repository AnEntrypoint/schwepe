export class TVScheduler {
  constructor() {
    this.scheduleCache = {};
    this.currentWeek = this.getWeekNumber();
  }

  getWeekNumber() {
    // Use UTC-based calculation aligned with schedule epoch for timezone consistency
    // All viewers worldwide will get the same week number at the same moment
    const scheduleEpoch = new Date('2025-11-14T00:00:00Z').getTime();
    const now = Date.now(); // Always returns UTC milliseconds
    const elapsed = now - scheduleEpoch;
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // If before epoch, default to week 1
    if (elapsed < 0) {
      return 1;
    }

    // Calculate week number (1-indexed, wrapping at 78 weeks)
    const weekNum = Math.floor(elapsed / oneWeek) + 1;
    return ((weekNum - 1) % 78) + 1; // Wrap to 1-78 range
  }

  async loadScheduleForWeek(week) {
    if (this.scheduleCache[week]) {
      return this.scheduleCache[week];
    }

    try {
      const response = await fetch(`/public/schedule_weeks/week_${week}.json`);
      const data = await response.json();
      this.scheduleCache[week] = data.v || {};
      return this.scheduleCache[week];
    } catch (e) {
      console.log('Schedule load error for week ' + week + ':', e.message);
      return {};
    }
  }

  async getCurrentSchedule() {
    return this.loadScheduleForWeek(this.currentWeek);
  }

  async getScheduleVideos() {
    const schedule = await this.getCurrentSchedule();
    return Object.entries(schedule).map(([id, entry]) => ({
      id,
      show: entry.show,
      episode: entry.episode,
      desc: entry.desc,
      u: entry.u,
      type: 'scheduled'
    }));
  }
}
