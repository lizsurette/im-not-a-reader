/**
 * UserPreferences model - Manages user settings for the screen reader extension
 */

class UserPreferences {
  constructor(data = {}) {
    // Generate or use existing user ID
    this.userId = data.userId || this._generateUserId();

    // Audio settings
    this.defaultSpeed = this._validateSpeed(data.defaultSpeed ?? 1.0);
    this.defaultVolume = this._validateVolume(data.defaultVolume ?? 1.0);

    // Behavior settings
    this.autoStart = Boolean(data.autoStart ?? false);
    this.pauseOnTabSwitch = Boolean(data.pauseOnTabSwitch ?? true);
    this.highlightCurrentWord = Boolean(data.highlightCurrentWord ?? true);
    this.showProgress = Boolean(data.showProgress ?? true);

    // UI settings
    this.overlayPosition = this._validateOverlayPosition(
      data.overlayPosition ?? { x: 85, y: 10, anchor: 'top-right' }
    );
    this.theme = this._validateTheme(data.theme ?? 'auto');

    // Voice settings
    this.voicePreference = data.voicePreference || '';

    // Keyboard shortcuts
    this.keyboardShortcuts = this._validateKeyboardShortcuts(
      data.keyboardShortcuts ?? this._getDefaultShortcuts()
    );

    // Timestamps
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Update preferences with new values
   */
  update(updates) {
    const allowedFields = [
      'defaultSpeed',
      'defaultVolume',
      'autoStart',
      'pauseOnTabSwitch',
      'highlightCurrentWord',
      'showProgress',
      'overlayPosition',
      'theme',
      'voicePreference',
      'keyboardShortcuts',
    ];

    Object.keys(updates).forEach(key => {
      if (!allowedFields.includes(key)) {
        throw new Error(`Invalid preference field: ${key}`);
      }

      // Validate and set the new value
      switch (key) {
        case 'defaultSpeed':
          this.defaultSpeed = this._validateSpeed(updates[key]);
          break;
        case 'defaultVolume':
          this.defaultVolume = this._validateVolume(updates[key]);
          break;
        case 'autoStart':
        case 'pauseOnTabSwitch':
        case 'highlightCurrentWord':
        case 'showProgress':
          this[key] = Boolean(updates[key]);
          break;
        case 'overlayPosition':
          this.overlayPosition = this._validateOverlayPosition(updates[key]);
          break;
        case 'theme':
          this.theme = this._validateTheme(updates[key]);
          break;
        case 'voicePreference':
          this.voicePreference = String(updates[key] || '');
          break;
        case 'keyboardShortcuts':
          this.keyboardShortcuts = this._validateKeyboardShortcuts(updates[key]);
          break;
      }
    });

    this.updatedAt = new Date();
    return this;
  }

  /**
   * Get audio settings for new sessions
   */
  getAudioDefaults() {
    return {
      speed: this.defaultSpeed,
      volume: this.defaultVolume,
      voice: this.voicePreference,
    };
  }

  /**
   * Get UI behavior settings
   */
  getBehaviorSettings() {
    return {
      autoStart: this.autoStart,
      pauseOnTabSwitch: this.pauseOnTabSwitch,
      highlightCurrentWord: this.highlightCurrentWord,
      showProgress: this.showProgress,
    };
  }

  /**
   * Get keyboard shortcut for action
   */
  getShortcut(action) {
    return this.keyboardShortcuts[action] || null;
  }

  /**
   * Set keyboard shortcut for action
   */
  setShortcut(action, shortcut) {
    const validActions = [
      'playPause',
      'speedUp',
      'speedDown',
      'stop',
      'skipForward',
      'skipBackward',
    ];

    if (!validActions.includes(action)) {
      throw new Error(`Invalid shortcut action: ${action}`);
    }

    this.keyboardShortcuts = {
      ...this.keyboardShortcuts,
      [action]: String(shortcut),
    };

    this.updatedAt = new Date();
    return this;
  }

  /**
   * Reset preferences to defaults
   */
  reset() {
    const defaults = new UserPreferences();

    // Keep user ID and creation date
    defaults.userId = this.userId;
    defaults.createdAt = this.createdAt;
    defaults.updatedAt = new Date();

    return Object.assign(this, defaults);
  }

  /**
   * Check if preferences are at default values
   */
  isDefault() {
    const defaults = new UserPreferences();
    const fieldsToCheck = [
      'defaultSpeed',
      'defaultVolume',
      'autoStart',
      'pauseOnTabSwitch',
      'highlightCurrentWord',
      'showProgress',
      'theme',
      'voicePreference',
    ];

    return fieldsToCheck.every(field => this[field] === defaults[field]);
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      userId: this.userId,
      defaultSpeed: this.defaultSpeed,
      defaultVolume: this.defaultVolume,
      autoStart: this.autoStart,
      pauseOnTabSwitch: this.pauseOnTabSwitch,
      highlightCurrentWord: this.highlightCurrentWord,
      showProgress: this.showProgress,
      overlayPosition: this.overlayPosition,
      theme: this.theme,
      voicePreference: this.voicePreference,
      keyboardShortcuts: this.keyboardShortcuts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create UserPreferences from stored data
   */
  static fromJSON(data) {
    return new UserPreferences(data);
  }

  /**
   * Create default preferences for new user
   */
  static createDefault() {
    return new UserPreferences();
  }

  /**
   * Private: Generate unique user ID
   */
  _generateUserId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `user_${timestamp}_${random}`;
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

  /**
   * Private: Validate overlay position
   */
  _validateOverlayPosition(position) {
    if (!position || typeof position !== 'object') {
      throw new Error('Overlay position must be an object');
    }

    const validAnchors = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    const result = {
      x: this._validatePercentage(position.x, 'Overlay position x'),
      y: this._validatePercentage(position.y, 'Overlay position y'),
      anchor: position.anchor || 'top-right',
    };

    if (!validAnchors.includes(result.anchor)) {
      throw new Error(`Invalid overlay anchor: ${result.anchor}`);
    }

    return result;
  }

  /**
   * Private: Validate percentage value
   */
  _validatePercentage(value, fieldName) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) throw new Error(`${fieldName} must be a number`);
    if (numValue < 0 || numValue > 100) {
      throw new Error(`${fieldName} must be between 0 and 100`);
    }
    return numValue;
  }

  /**
   * Private: Validate theme value
   */
  _validateTheme(theme) {
    const validThemes = ['light', 'dark', 'auto'];
    if (!validThemes.includes(theme)) {
      throw new Error(`Invalid theme: ${theme}`);
    }
    return theme;
  }

  /**
   * Private: Validate keyboard shortcuts
   */
  _validateKeyboardShortcuts(shortcuts) {
    if (!shortcuts || typeof shortcuts !== 'object') {
      return this._getDefaultShortcuts();
    }

    const defaults = this._getDefaultShortcuts();
    const result = { ...defaults };

    Object.keys(shortcuts).forEach(action => {
      if (action in defaults) {
        result[action] = String(shortcuts[action]);
      }
    });

    return result;
  }

  /**
   * Private: Get default keyboard shortcuts
   */
  _getDefaultShortcuts() {
    return {
      playPause: 'Space',
      speedUp: 'ArrowUp',
      speedDown: 'ArrowDown',
      stop: 'Escape',
      skipForward: 'ArrowRight',
      skipBackward: 'ArrowLeft',
    };
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserPreferences;
} else if (typeof window !== 'undefined') {
  window.UserPreferences = UserPreferences;
}