export class TVScheduler {
  constructor() {
    this.scheduleCache = {};
    this.currentWeek = this.getWeekNumber();
  }

  getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay / 7) + 1;
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
