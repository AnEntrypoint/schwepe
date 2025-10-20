/**
 * TV Guide Scheduler Integration
 * Connects TV Guide with GMT-based scheduling system
 */

import SchwepeTVScheduler from './schwepe-tv-scheduler.js';

class TVGuideScheduler {
    constructor() {
        this.scheduler = new SchwepeTVScheduler();
        this.weeklySchedule = null;
        this.currentWeek = null;
    }

    async initialize() {
        await this.loadWeeklySchedule();
    }

    async loadWeeklySchedule() {
        try {
            const weekNumber = this.getCurrentWeek();
            const response = await fetch(`/schedule_weeks/week_${weekNumber}.json`);
            if (response.ok) {
                this.weeklySchedule = await response.json();
                this.currentWeek = weekNumber;
                console.log(`📅 TV Guide: Loaded week ${weekNumber} schedule`);
                return true;
            } else {
                // Try fallback to week 1
                const fallbackResponse = await fetch('/schedule_weeks/week_1.json');
                if (fallbackResponse.ok) {
                    this.weeklySchedule = await fallbackResponse.json();
                    this.currentWeek = 1;
                    console.log('📅 TV Guide: Using week 1 fallback schedule');
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ TV Guide: Error loading weekly schedule:', error);
        }
        return false;
    }

    getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((now - start) / (24 * 60 * 60 * 1000));
        return Math.floor(daysSinceStart / 7) + 1;
    }

    getCurrentScheduledContent() {
        if (!this.weeklySchedule || !this.weeklySchedule.v) return null;

        // Use the GMT scheduler to get current time slot
        const currentTimeSlot = this.scheduler.getCurrentTimeSlot();

        // Get all available content
        const scheduleEntries = Object.entries(this.weeklySchedule.v);

        // Use deterministic selection based on time slot
        const selection = this.scheduler.getDeterministicSelection(
            currentTimeSlot.slotKey,
            scheduleEntries,
            247420 // Schwepe seed
        );

        const [entryId, entryData] = scheduleEntries[selection.index];

        return {
            id: entryId,
            show: entryData.show || 'Unknown Show',
            episode: entryData.episode || '',
            description: entryData.desc || 'No description available',
            url: entryData.u,
            startTime: currentTimeSlot.slotStartMinute,
            actualStart: currentTimeSlot.gmtNow,
            duration_minutes: 30,
            timeSlot: currentTimeSlot.timeSlot,
            dayOfWeek: currentTimeSlot.dayOfWeek,
            dayName: currentTimeSlot.dayName,
            currentMinutes: currentTimeSlot.currentMinutes,
            elapsedMinutes: currentTimeSlot.elapsedMinutesInSlot,
            currentTimeSlot: currentTimeSlot
        };
    }

    getScheduleForDay(date = new Date()) {
        if (!this.weeklySchedule || !this.weeklySchedule.v) {
            return [];
        }

        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

        // Create 30-minute time slots for the entire day (48 slots)
        const dailySchedule = [];
        const shows = Object.values(this.weeklySchedule.v);

        for (let slotIndex = 0; slotIndex < 48; slotIndex++) {
            const slotStartHour = Math.floor(slotIndex / 2);
            const slotStartMinute = (slotIndex % 2) * 30;

            // Create time slot date in GMT
            const slotDate = new Date(Date.UTC(
                targetDate.getUTCFullYear(),
                targetDate.getUTCMonth(),
                targetDate.getUTCDate(),
                slotStartHour,
                slotStartMinute,
                0,
                0
            ));

            const timeSlotKey = `${dayOfWeek}-${slotIndex}`;

            // Use deterministic selection for this slot
            const selection = this.scheduler.getDeterministicSelection(
                timeSlotKey,
                shows,
                247420
            );

            const selectedShow = shows[selection.index];
            const slotEnd = new Date(slotDate.getTime() + 30 * 60 * 1000);

            dailySchedule.push({
                id: `${dayOfWeek}-${slotIndex}`,
                show: selectedShow?.show || 'Off Air',
                episode: selectedShow?.episode || '',
                description: selectedShow?.desc || 'No programming scheduled',
                url: selectedShow?.u,
                startTime: slotDate,
                endTime: slotEnd,
                timeSlot: slotIndex,
                timeString: this.formatTime(slotDate),
                dayName: this.getDayName(dayOfWeek),
                isLive: this.isCurrentTimeSlot(slotDate, slotEnd)
            });
        }

        return dailySchedule;
    }

    getScheduleForWeek(weekStart = new Date()) {
        const weeklySchedule = [];

        // Start from Sunday of the current week
        const startOfWeek = new Date(weekStart);
        const dayOfWeek = startOfWeek.getUTCDay();
        startOfWeek.setUTCDate(startOfWeek.getUTCDate() - dayOfWeek);
        startOfWeek.setUTCHours(0, 0, 0, 0);

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setUTCDate(startOfWeek.getUTCDate() + dayIndex);

            const daySchedule = this.getScheduleForDay(currentDay);
            weeklySchedule.push({
                date: currentDay,
                dayName: this.getDayName(currentDay.getUTCDay()),
                schedules: daySchedule
            });
        }

        return weeklySchedule;
    }

    isCurrentTimeSlot(startTime, endTime) {
        const now = new Date();
        const gmtNow = new Date(now.toUTCString());
        return gmtNow >= startTime && gmtNow < endTime;
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    }

    formatTime12Hour(date) {
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    }

    getDayName(dayIndex) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex];
    }

    // Enhanced TV guide grid data
    getTVGuideGridData() {
        const currentTimeSlot = this.scheduler.getCurrentTimeSlot();
        const weeklySchedule = this.getScheduleForWeek();

        // Create channel-like structure from time slots
        const channels = [
            { id: 'schwepe-main', name: 'SCHWEPEVISION MAIN', number: 1 },
            { id: 'schwepe-alt', name: 'SCHWEPEVISION ALT', number: 2 },
            { id: 'retro-archive', name: 'RETRO ARCHIVE', number: 3 }
        ];

        const timeSlots = [];
        for (let hour = 6; hour <= 23; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }

        const gridData = {};

        channels.forEach(channel => {
            gridData[channel.id] = {};

            weeklySchedule.forEach(dayData => {
                timeSlots.forEach(timeSlot => {
                    const [hour] = timeSlot.split(':').map(Number);
                    const slotIndex = hour * 2; // 30-minute slots, so 2 per hour

                    // Find the schedule for this time slot
                    const daySchedule = dayData.schedules;
                    const matchingSlot = daySchedule.find(slot => {
                        const slotHour = slot.startTime.getUTCHours();
                        return slotHour === hour && (slot.startTime.getUTCMinutes() === 0 || slot.startTime.getUTCMinutes() === 30);
                    });

                    if (matchingSlot) {
                        const gridKey = `${dayData.dayName}-${timeSlot}`;
                        gridData[channel.id][gridKey] = {
                            ...matchingSlot,
                            channel: channel.name,
                            isLive: this.isCurrentTimeSlot(matchingSlot.startTime, matchingSlot.endTime)
                        };
                    }
                });
            });
        });

        return {
            channels,
            timeSlots,
            gridData,
            weeklySchedule,
            currentTime: currentTimeSlot.gmtNow,
            currentSlot: currentTimeSlot.slotKey
        };
    }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TVGuideScheduler;
} else if (typeof window !== 'undefined') {
    window.TVGuideScheduler = TVGuideScheduler;
}

export default TVGuideScheduler;