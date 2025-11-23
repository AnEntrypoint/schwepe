/**
 * Unit Tests for PlaybackHandler
 *
 * Tests core functionality of the video playback system:
 * - Time calculation methods
 * - Schedule index calculation
 * - Cache operations
 * - Error handling
 * - Volume normalization
 */

class MockPlaybackHandler {
  constructor() {
    this.scheduleEpoch = new Date('2025-11-14T00:00:00Z').getTime();
    this.durationCache = {};
    this.DEFAULT_SLOT_DURATION = 1800000;
    this.savedVideos = [];
    this.scheduledVideos = [];
    this.scheduleIndex = 0;
    this.fillerIndex = 0;
    this.normalizedVolume = 0.7;
  }

  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  calculateSchedulePosition(totalDuration) {
    const now = Date.now();
    const elapsed = now - this.scheduleEpoch;
    return elapsed % totalDuration;
  }

  calculateSlotIndex(positionInSchedule, slotDuration = this.DEFAULT_SLOT_DURATION) {
    return Math.floor(positionInSchedule / slotDuration);
  }

  cacheDuration(videoId, duration) {
    this.durationCache[videoId] = duration;
  }

  getCachedDuration(videoId) {
    return this.durationCache[videoId];
  }

  calculateCommercialBreaks(slotIndex, videoDuration, slotDuration) {
    const breaks = [];
    const remainingTime = slotDuration - videoDuration;

    if (remainingTime < 5000) {
      return breaks;
    }

    const seed = slotIndex * 7919;
    const breakCount = Math.floor(this.seededRandom(seed) * 3) + 2;

    for (let i = 0; i < breakCount; i++) {
      const ads = [];
      const adCount = Math.floor(this.seededRandom(seed + i) * 4) + 2;

      for (let j = 0; j < adCount; j++) {
        if (this.savedVideos.length > 0) {
          const adSeed = seed * 100 + i * 10 + j;
          const adIndex = Math.floor(this.seededRandom(adSeed) * this.savedVideos.length);
          ads.push(this.savedVideos[adIndex]);
        }
      }

      breaks.push({
        index: i,
        ads: ads,
        duration: ads.length * 15000
      });
    }

    return breaks;
  }

  pickCommercialBreak(slotIndex, breakIndex) {
    const seed = slotIndex * 1000 + breakIndex;
    const breakLength = Math.floor(this.seededRandom(seed) * 6) + 1;
    const ads = [];

    for (let i = 0; i < breakLength; i++) {
      if (this.savedVideos.length > 0) {
        const adSeed = seed * 100 + i;
        const adIndex = Math.floor(this.seededRandom(adSeed) * this.savedVideos.length);
        ads.push(this.savedVideos[adIndex]);
      }
    }
    return ads;
  }
}

const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function runTest(name, testFn) {
  testsRun++;
  try {
    await testFn();
    testsPassed++;
    log(`✓ ${name}`, COLORS.GREEN);
  } catch (error) {
    testsFailed++;
    log(`✗ ${name}`, COLORS.RED);
    console.error(`  Error: ${error.message}`);
  }
}

async function runUnitTests() {
  log('\n=== PlaybackHandler Unit Tests ===\n', COLORS.BLUE);

  log('Test Suite: Time Calculation Methods', COLORS.CYAN);

  await runTest('seededRandom produces values between 0 and 1', async () => {
    const handler = new MockPlaybackHandler();
    for (let i = 0; i < 100; i++) {
      const value = handler.seededRandom(i);
      assert(value >= 0 && value <= 1, `Value ${value} not in range [0, 1]`);
    }
  });

  await runTest('seededRandom is deterministic', async () => {
    const handler1 = new MockPlaybackHandler();
    const handler2 = new MockPlaybackHandler();
    const seed = 12345;
    const value1 = handler1.seededRandom(seed);
    const value2 = handler2.seededRandom(seed);
    assert(value1 === value2, `Values not deterministic: ${value1} vs ${value2}`);
  });

  await runTest('calculateSchedulePosition returns positive number', async () => {
    const handler = new MockPlaybackHandler();
    const position = handler.calculateSchedulePosition(3600000);
    assert(position >= 0, `Position should be positive, got ${position}`);
  });

  await runTest('calculateSchedulePosition respects total duration', async () => {
    const handler = new MockPlaybackHandler();
    const totalDuration = 1000000;
    const position = handler.calculateSchedulePosition(totalDuration);
    assert(position < totalDuration, `Position ${position} should be less than ${totalDuration}`);
  });

  log('\nTest Suite: Schedule Index Calculation', COLORS.CYAN);

  await runTest('calculateSlotIndex returns correct slot for position', async () => {
    const handler = new MockPlaybackHandler();
    const slotDuration = 1800000;
    const position = 500000;
    const slotIndex = handler.calculateSlotIndex(position, slotDuration);
    assert(slotIndex === 0, `Slot index should be 0, got ${slotIndex}`);
  });

  await runTest('calculateSlotIndex handles multiple slots correctly', async () => {
    const handler = new MockPlaybackHandler();
    const slotDuration = 1000000;
    const position = 2500000;
    const slotIndex = handler.calculateSlotIndex(position, slotDuration);
    assert(slotIndex === 2, `Slot index should be 2, got ${slotIndex}`);
  });

  await runTest('calculateSlotIndex handles edge case at slot boundary', async () => {
    const handler = new MockPlaybackHandler();
    const slotDuration = 1800000;
    const position = 1800000;
    const slotIndex = handler.calculateSlotIndex(position, slotDuration);
    assert(slotIndex === 1, `Slot index should be 1, got ${slotIndex}`);
  });

  log('\nTest Suite: Cache Operations', COLORS.CYAN);

  await runTest('cacheDuration stores and retrieves duration', async () => {
    const handler = new MockPlaybackHandler();
    const videoId = 'test_video_1';
    const duration = 120000;
    handler.cacheDuration(videoId, duration);
    const retrieved = handler.getCachedDuration(videoId);
    assert(retrieved === duration, `Retrieved ${retrieved}, expected ${duration}`);
  });

  await runTest('cacheDuration handles multiple entries', async () => {
    const handler = new MockPlaybackHandler();
    handler.cacheDuration('video1', 100000);
    handler.cacheDuration('video2', 200000);
    handler.cacheDuration('video3', 300000);
    assert(handler.getCachedDuration('video1') === 100000, 'video1 duration mismatch');
    assert(handler.getCachedDuration('video2') === 200000, 'video2 duration mismatch');
    assert(handler.getCachedDuration('video3') === 300000, 'video3 duration mismatch');
  });

  await runTest('getCachedDuration returns undefined for missing video', async () => {
    const handler = new MockPlaybackHandler();
    const retrieved = handler.getCachedDuration('nonexistent_video');
    assert(retrieved === undefined, `Expected undefined, got ${retrieved}`);
  });

  log('\nTest Suite: Commercial Break Calculation', COLORS.CYAN);

  await runTest('calculateCommercialBreaks returns array', async () => {
    const handler = new MockPlaybackHandler();
    handler.savedVideos = [
      { id: 'ad1', filename: 'ad1.mp4' },
      { id: 'ad2', filename: 'ad2.mp4' }
    ];
    const breaks = handler.calculateCommercialBreaks(0, 600000, 1800000);
    assert(Array.isArray(breaks), 'calculateCommercialBreaks should return array');
  });

  await runTest('calculateCommercialBreaks returns empty array when insufficient time', async () => {
    const handler = new MockPlaybackHandler();
    handler.savedVideos = [{ id: 'ad1', filename: 'ad1.mp4' }];
    const breaks = handler.calculateCommercialBreaks(0, 1800000, 1800000);
    assert(breaks.length === 0, `Should return empty array, got ${breaks.length} breaks`);
  });

  await runTest('calculateCommercialBreaks respects ad count limits', async () => {
    const handler = new MockPlaybackHandler();
    handler.savedVideos = [
      { id: 'ad1', filename: 'ad1.mp4' },
      { id: 'ad2', filename: 'ad2.mp4' }
    ];
    const breaks = handler.calculateCommercialBreaks(0, 600000, 1800000);
    breaks.forEach(breakItem => {
      assert(breakItem.ads.length > 0, 'Break should have at least one ad');
      assert(breakItem.ads.length <= 10, `Break should not have excessive ads, got ${breakItem.ads.length}`);
    });
  });

  await runTest('pickCommercialBreak returns array of ads', async () => {
    const handler = new MockPlaybackHandler();
    handler.savedVideos = [
      { id: 'ad1', filename: 'ad1.mp4' },
      { id: 'ad2', filename: 'ad2.mp4' },
      { id: 'ad3', filename: 'ad3.mp4' }
    ];
    const ads = handler.pickCommercialBreak(0, 0);
    assert(Array.isArray(ads), 'pickCommercialBreak should return array');
    assert(ads.length > 0, 'Should have at least one ad');
  });

  await runTest('pickCommercialBreak returns empty array when no saved videos', async () => {
    const handler = new MockPlaybackHandler();
    handler.savedVideos = [];
    const ads = handler.pickCommercialBreak(0, 0);
    assert(ads.length === 0, `Should return empty array, got ${ads.length} ads`);
  });

  await runTest('pickCommercialBreak is deterministic', async () => {
    const handler1 = new MockPlaybackHandler();
    const handler2 = new MockPlaybackHandler();
    const testAds = [
      { id: 'ad1', filename: 'ad1.mp4' },
      { id: 'ad2', filename: 'ad2.mp4' }
    ];
    handler1.savedVideos = testAds;
    handler2.savedVideos = testAds;
    const ads1 = handler1.pickCommercialBreak(5, 3);
    const ads2 = handler2.pickCommercialBreak(5, 3);
    assert(ads1.length === ads2.length, `Ad counts should match: ${ads1.length} vs ${ads2.length}`);
  });

  log('\nTest Suite: Volume and State Management', COLORS.CYAN);

  await runTest('normalizedVolume is set to 0.7 by default', async () => {
    const handler = new MockPlaybackHandler();
    assert(handler.normalizedVolume === 0.7, `Expected 0.7, got ${handler.normalizedVolume}`);
  });

  await runTest('initial scheduleIndex is 0', async () => {
    const handler = new MockPlaybackHandler();
    assert(handler.scheduleIndex === 0, `Expected 0, got ${handler.scheduleIndex}`);
  });

  await runTest('initial fillerIndex is 0', async () => {
    const handler = new MockPlaybackHandler();
    assert(handler.fillerIndex === 0, `Expected 0, got ${handler.fillerIndex}`);
  });

  log('\nTest Suite: Epoch and Schedule Duration', COLORS.CYAN);

  await runTest('scheduleEpoch is set to 2025-11-14T00:00:00Z', async () => {
    const handler = new MockPlaybackHandler();
    const expected = new Date('2025-11-14T00:00:00Z').getTime();
    assert(handler.scheduleEpoch === expected, `Epoch mismatch: ${handler.scheduleEpoch} vs ${expected}`);
  });

  await runTest('DEFAULT_SLOT_DURATION is 30 minutes (1800000ms)', async () => {
    const handler = new MockPlaybackHandler();
    assert(handler.DEFAULT_SLOT_DURATION === 1800000, `Expected 1800000, got ${handler.DEFAULT_SLOT_DURATION}`);
  });

  log('\n=== Summary ===', COLORS.BLUE);
  log(`Total tests: ${testsRun}`, COLORS.YELLOW);
  log(`Passed: ${testsPassed}`, COLORS.GREEN);
  log(`Failed: ${testsFailed}`, COLORS.RED);

  return testsFailed === 0;
}

runUnitTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`Fatal error: ${error.message}`, COLORS.RED);
  process.exit(1);
});
