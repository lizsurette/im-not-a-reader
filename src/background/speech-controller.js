/**
 * SpeechController - Manages text-to-speech functionality in background script
 */

// Import AudioSession for Node.js testing environment
let AudioSession;
if (typeof require !== 'undefined') {
  try {
    AudioSession = require('../lib/models/AudioSession.js');
  } catch (e) {
    // In browser environment, AudioSession should be available globally
    AudioSession = typeof window !== 'undefined' ? window.AudioSession : null;
  }
} else if (typeof window !== 'undefined') {
  AudioSession = window.AudioSession;
}

class SpeechController {
  constructor() {
    this.activeSessions = new Map();
    this.maxConcurrentSessions = 10;
    this.currentUtterance = null;
    this.currentSessionId = null;

    // Bind speech events
    this._bindSpeechEvents();
  }

  /**
   * Start text-to-speech for given content
   * @param {StartSpeechRequest} request - Speech start request
   * @returns {Promise<AudioSession>} Created session
   */
  async startSpeech(request) {
    // Validate request
    this._validateStartRequest(request);

    // Check browser support
    if (!this._isSpeechSupported()) {
      throw new SpeechNotSupportedError();
    }

    // Check session limit
    if (this.activeSessions.size >= this.maxConcurrentSessions) {
      throw new SessionLimitError(this.maxConcurrentSessions);
    }

    // Check voice availability
    const voice = await this._getBestVoice();
    if (!voice) {
      throw new VoiceNotAvailableError();
    }

    // Process text
    if (!request.text || request.text.trim().length === 0) {
      throw new TextProcessingError('Text content is empty');
    }

    try {
      // Create audio session
      const session = new AudioSession({
        contentId: request.contentId,
        pageUrl: request.pageUrl || 'unknown',
        text: request.text,
        startWordIndex: request.startWordIndex || 0,
        speed: request.speed || 1.0,
        volume: request.volume || 1.0,
        tabId: request.tabId,
      });

      // Store session
      this.activeSessions.set(session.sessionId, session);

      // Start speech synthesis
      await this._startSpeechSynthesis(session, voice);

      // Update session state
      session.updateState({ isPlaying: true, isPaused: false });

      return session;

    } catch (error) {
      throw new TextProcessingError('Failed to start speech synthesis', error);
    }
  }

  /**
   * Pause active speech session
   * @param {string} sessionId - Session to pause
   */
  async pauseSpeech(sessionId) {
    const session = this._getSession(sessionId);

    if (this.currentSessionId === sessionId && speechSynthesis.speaking) {
      speechSynthesis.pause();
    }

    session.updateState({ isPlaying: false, isPaused: true });
  }

  /**
   * Resume paused speech session
   * @param {string} sessionId - Session to resume
   */
  async resumeSpeech(sessionId) {
    const session = this._getSession(sessionId);

    if (!session.isPaused) {
      throw new Error('Invalid session state - session is not paused');
    }

    if (this.currentSessionId === sessionId && speechSynthesis.paused) {
      speechSynthesis.resume();
    } else {
      // Restart from current position if not the active session
      const voice = await this._getBestVoice();
      await this._startSpeechSynthesis(session, voice);
    }

    session.updateState({ isPlaying: true, isPaused: false });
  }

  /**
   * Stop speech session and cleanup
   * @param {string} sessionId - Session to stop
   */
  async stopSpeech(sessionId) {
    const session = this._getSession(sessionId);

    if (this.currentSessionId === sessionId) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
      this.currentSessionId = null;
    }

    this.activeSessions.delete(sessionId);
  }

  /**
   * Adjust speech speed for active session
   * @param {string} sessionId - Session to modify
   * @param {number} speed - New speed (0.5-2.0)
   */
  async setSpeed(sessionId, speed) {
    const session = this._getSession(sessionId);

    // Validate speed range
    if (speed < 0.5 || speed > 2.0) {
      throw new Error('Invalid speed value - must be between 0.5 and 2.0');
    }

    session.updateState({ speed });

    // Update active speech if this is the current session
    if (this.currentSessionId === sessionId && this.currentUtterance) {
      this.currentUtterance.rate = speed;

      // For some browsers, we may need to restart speech with new rate
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        const wasPlaying = session.isPlaying;
        speechSynthesis.cancel();

        if (wasPlaying) {
          const voice = await this._getBestVoice();
          await this._startSpeechSynthesis(session, voice);
        }
      }
    }

    // Broadcast speed change to content script
    this._broadcastSessionUpdate(session);
  }

  /**
   * Adjust speech volume for active session
   * @param {string} sessionId - Session to modify
   * @param {number} volume - New volume (0.0-1.0)
   */
  async setVolume(sessionId, volume) {
    const session = this._getSession(sessionId);

    // Validate volume range
    if (volume < 0.0 || volume > 1.0) {
      throw new Error('Invalid volume value - must be between 0.0 and 1.0');
    }

    session.updateState({ volume });

    // Update active speech if this is the current session
    if (this.currentSessionId === sessionId && this.currentUtterance) {
      this.currentUtterance.volume = volume;
    }

    // Broadcast volume change to content script
    this._broadcastSessionUpdate(session);
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {AudioSession} Session object
   */
  async getSession(sessionId) {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   * @returns {AudioSession[]} Array of active sessions
   */
  async getAllSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get active session count
   * @returns {number} Number of active sessions
   */
  getActiveSessionCount() {
    return this.activeSessions.size;
  }

  /**
   * Cleanup inactive sessions
   * @returns {number} Number of sessions cleaned up
   */
  async cleanupInactiveSessions() {
    let cleanedCount = 0;
    const now = Date.now();
    const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions) {
      const inactiveTime = now - session.lastActiveAt.getTime();
      if (inactiveTime > maxInactiveTime) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Private: Validate start speech request
   */
  _validateStartRequest(request) {
    if (!request) {
      throw new Error('Request is required');
    }
    if (!request.contentId) {
      throw new Error('contentId is required');
    }
    if (!request.text) {
      throw new Error('text is required');
    }
    if (request.tabId === undefined) {
      throw new Error('tabId is required');
    }
  }

  /**
   * Private: Check if speech synthesis is supported
   */
  _isSpeechSupported() {
    // Check for mocked speech APIs in test environment
    if (typeof global !== 'undefined' && global.speechSynthesis && global.SpeechSynthesisUtterance) {
      return true;
    }
    // In browser environment
    if (typeof window !== 'undefined') {
      return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    }
    // In Node.js without mocks, assume speech is not supported
    return false;
  }

  /**
   * Private: Get best available voice
   */
  async _getBestVoice(language = 'en-US') {
    // Get speechSynthesis from appropriate environment
    const synth = typeof global !== 'undefined' && global.speechSynthesis
      ? global.speechSynthesis
      : (typeof window !== 'undefined' ? window.speechSynthesis : null);

    if (!synth) {
      throw new VoiceNotAvailableError(language);
    }

    const voices = synth.getVoices();

    if (voices.length === 0) {
      // Wait for voices to load (with timeout for test environment)
      await new Promise(resolve => {
        if (synth.onvoiceschanged !== undefined) {
          synth.onvoiceschanged = resolve;
          // Add timeout to prevent hanging in test environment
          setTimeout(resolve, 500);
        } else {
          setTimeout(resolve, 100);
        }
      });
    }

    const availableVoices = synth.getVoices();

    // Prefer local voices over remote
    const localVoices = availableVoices.filter(voice => voice.localService);
    if (localVoices.length > 0) {
      // Try to match language
      const languageMatch = localVoices.find(voice => voice.lang.startsWith(language.split('-')[0]));
      return languageMatch || localVoices[0];
    }

    // Fall back to any available voice
    return availableVoices.length > 0 ? availableVoices[0] : null;
  }

  /**
   * Private: Start speech synthesis for session
   */
  async _startSpeechSynthesis(session, voice) {
    const textToSpeak = session.getRemainingText();

    if (!textToSpeak) {
      throw new TextProcessingError('No text to speak');
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = voice;
    utterance.rate = session.speed;
    utterance.volume = session.volume;
    utterance.pitch = 1.0;

    // Set up event handlers
    utterance.onstart = () => {
      session.updateState({ isPlaying: true, isPaused: false });
      this._broadcastSessionUpdate(session);
    };

    utterance.onend = () => {
      session.updateState({ isPlaying: false, isPaused: false, currentPosition: session.totalWords });
      this._broadcastSessionUpdate(session);

      if (this.currentSessionId === session.sessionId) {
        this.currentUtterance = null;
        this.currentSessionId = null;
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      session.updateState({ isPlaying: false, isPaused: false });
      this._broadcastError(new Error(`Speech synthesis error: ${event.error}`), session.sessionId);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const wordIndex = this._calculateWordIndex(event.charIndex, session);
        session.updateState({ currentPosition: wordIndex });
        this._broadcastSessionUpdate(session);
      }
    };

    // Store as current utterance
    this.currentUtterance = utterance;
    this.currentSessionId = session.sessionId;

    // Start speaking
    speechSynthesis.speak(utterance);
  }

  /**
   * Private: Calculate word index from character index
   */
  _calculateWordIndex(charIndex, session) {
    // This is a simplified calculation
    // In a real implementation, you'd track character-to-word mapping
    const textUpToChar = session.getRemainingText().substring(0, charIndex);
    const wordsBeforeChar = textUpToChar.split(/\s+/).length - 1;
    return session.currentPosition + Math.max(0, wordsBeforeChar);
  }

  /**
   * Private: Get session with error handling
   */
  _getSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  /**
   * Private: Broadcast session update to content script
   */
  _broadcastSessionUpdate(session) {
    try {
      chrome.tabs.sendMessage(session.tabId, {
        type: 'SESSION_UPDATED',
        session: session.toJSON(),
      });
    } catch (error) {
      console.warn('Failed to broadcast session update:', error);
    }
  }

  /**
   * Private: Broadcast error to content script
   */
  _broadcastError(error, sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      try {
        chrome.tabs.sendMessage(session.tabId, {
          type: 'SESSION_ERROR',
          error: error.message,
          sessionId,
        });
      } catch (broadcastError) {
        console.warn('Failed to broadcast error:', broadcastError);
      }
    }
  }

  /**
   * Private: Bind speech synthesis events
   */
  _bindSpeechEvents() {
    // Handle browser speech synthesis events
    const synth = typeof global !== 'undefined' && global.speechSynthesis
      ? global.speechSynthesis
      : (typeof window !== 'undefined' ? window.speechSynthesis : null);

    if (synth && synth.addEventListener) {
      synth.addEventListener('voiceschanged', () => {
        // Voices have been loaded/changed
        console.log('Speech synthesis voices updated');
      });
    }
  }
}

// Error classes
class SpeechNotSupportedError extends Error {
  constructor() {
    super('Speech synthesis not supported in this browser');
    this.name = 'SpeechNotSupportedError';
  }
}

class VoiceNotAvailableError extends Error {
  constructor(language) {
    super(`No suitable voice available${language ? ` for language: ${language}` : ''}`);
    this.name = 'VoiceNotAvailableError';
  }
}

class TextProcessingError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'TextProcessingError';
    this.originalError = originalError;
  }
}

class SessionLimitError extends Error {
  constructor(limit) {
    super(`Maximum concurrent sessions (${limit}) exceeded`);
    this.name = 'SessionLimitError';
  }
}

class SessionNotFoundError extends Error {
  constructor(sessionId) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  // Main export as default
  module.exports = SpeechController;
  // Named exports for error classes
  module.exports.SpeechController = SpeechController;
  module.exports.SpeechNotSupportedError = SpeechNotSupportedError;
  module.exports.VoiceNotAvailableError = VoiceNotAvailableError;
  module.exports.TextProcessingError = TextProcessingError;
  module.exports.SessionLimitError = SessionLimitError;
  module.exports.SessionNotFoundError = SessionNotFoundError;
} else if (typeof window !== 'undefined') {
  window.SpeechController = SpeechController;
  window.SpeechNotSupportedError = SpeechNotSupportedError;
  window.VoiceNotAvailableError = VoiceNotAvailableError;
  window.TextProcessingError = TextProcessingError;
  window.SessionLimitError = SessionLimitError;
  window.SessionNotFoundError = SessionNotFoundError;
}