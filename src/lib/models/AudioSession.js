/**
 * AudioSession model - Represents an active text-to-speech reading session
 */

class AudioSession {
  constructor({
    contentId,
    pageUrl,
    text = '',
    startWordIndex = 0,
    speed = 1.0,
    volume = 1.0,
    tabId,
  }) {
    // Validation
    if (!contentId) throw new Error('contentId is required');
    if (!pageUrl) throw new Error('pageUrl is required');
    if (!text) throw new Error('text is required');
    if (tabId === undefined) throw new Error('tabId is required');

    // Generate unique session ID
    this.sessionId = this._generateSessionId();

    // Core session data
    this.contentId = contentId;
    this.pageUrl = pageUrl;
    this.tabId = tabId;

    // Speech content
    this.text = text;
    this.words = this._extractWords(text);
    this.totalWords = this.words.length;

    // Playback state
    this.currentPosition = Math.max(0, Math.min(startWordIndex, this.totalWords - 1));
    this.isPlaying = false;
    this.isPaused = false;

    // Audio settings
    this.speed = this._validateSpeed(speed);
    this.volume = this._validateVolume(volume);

    // Timestamps
    this.createdAt = new Date();
    this.lastActiveAt = new Date();
  }

  /**
   * Update session state
   */
  updateState({ isPlaying, isPaused, currentPosition, speed, volume }) {
    if (isPlaying !== undefined) this.isPlaying = isPlaying;
    if (isPaused !== undefined) this.isPaused = isPaused;
    if (currentPosition !== undefined) {
      this.currentPosition = Math.max(0, Math.min(currentPosition, this.totalWords - 1));
    }
    if (speed !== undefined) this.speed = this._validateSpeed(speed);
    if (volume !== undefined) this.volume = this._validateVolume(volume);

    this.lastActiveAt = new Date();
  }

  /**
   * Get current word being read
   */
  getCurrentWord() {
    if (this.currentPosition >= 0 && this.currentPosition < this.words.length) {
      return this.words[this.currentPosition];
    }
    return null;
  }

  /**
   * Get remaining text from current position
   */
  getRemainingText() {
    if (this.currentPosition >= this.words.length) return '';
    return this.words.slice(this.currentPosition).join(' ');
  }

  /**
   * Check if session is complete (reached end of text)
   */
  isComplete() {
    return this.currentPosition >= this.totalWords;
  }

  /**
   * Get session progress as percentage
   */
  getProgress() {
    if (this.totalWords === 0) return 100;
    return Math.round((this.currentPosition / this.totalWords) * 100);
  }

  /**
   * Convert to plain object for storage/transmission
   */
  toJSON() {
    return {
      sessionId: this.sessionId,
      contentId: this.contentId,
      pageUrl: this.pageUrl,
      tabId: this.tabId,
      currentPosition: this.currentPosition,
      totalWords: this.totalWords,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      speed: this.speed,
      volume: this.volume,
      createdAt: this.createdAt,
      lastActiveAt: this.lastActiveAt,
    };
  }

  /**
   * Create AudioSession from stored data
   */
  static fromJSON(data) {
    const session = new AudioSession({
      contentId: data.contentId,
      pageUrl: data.pageUrl,
      text: data.text || '',
      tabId: data.tabId,
      startWordIndex: data.currentPosition || 0,
      speed: data.speed || 1.0,
      volume: data.volume || 1.0,
    });

    // Restore state
    session.sessionId = data.sessionId;
    session.isPlaying = data.isPlaying || false;
    session.isPaused = data.isPaused || false;
    session.createdAt = new Date(data.createdAt);
    session.lastActiveAt = new Date(data.lastActiveAt);

    return session;
  }

  /**
   * Private: Generate unique session ID
   */
  _generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Private: Extract words from text
   */
  _extractWords(text) {
    if (!text || typeof text !== 'string') return [];

    // Split on whitespace and punctuation, keeping only words
    return text
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .map(word => word.replace(/[^\w\s]/g, '')) // Remove punctuation for counting
      .filter(word => word.length > 0);
  }

  /**
   * Private: Validate speed value
   */
  _validateSpeed(speed) {
    const numSpeed = parseFloat(speed);
    if (isNaN(numSpeed)) throw new Error('Speed must be a number');
    if (numSpeed < 0.5 || numSpeed > 2.0) {
      throw new Error('Speed must be between 0.5 and 2.0');
    }
    return numSpeed;
  }

  /**
   * Private: Validate volume value
   */
  _validateVolume(volume) {
    const numVolume = parseFloat(volume);
    if (isNaN(numVolume)) throw new Error('Volume must be a number');
    if (numVolume < 0.0 || numVolume > 1.0) {
      throw new Error('Volume must be between 0.0 and 1.0');
    }
    return numVolume;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioSession;
} else if (typeof window !== 'undefined') {
  window.AudioSession = AudioSession;
}