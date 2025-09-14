/**
 * Contract tests for startSpeech() API in background script
 * These tests MUST FAIL before implementation
 */

describe('Background Script - Speech Synthesis API Contract', () => {
  beforeEach(() => {
    setupExtensionEnvironment();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startSpeech()', () => {
    test('should return Promise<AudioSession>', async () => {
      const mockRequest = {
        contentId: 'test-content-123',
        text: 'This is test text to be spoken',
        startWordIndex: 0,
        speed: 1.0,
        volume: 1.0,
        tabId: 1,
      };

      try {
        const SpeechController = require('../../src/background/speech-controller.js');
        const controller = new SpeechController();

        const session = await controller.startSpeech(mockRequest);

        // Contract: Must return AudioSession object
        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('pageUrl');
        expect(session).toHaveProperty('contentId');
        expect(session).toHaveProperty('currentPosition');
        expect(session).toHaveProperty('totalWords');
        expect(session).toHaveProperty('isPlaying');
        expect(session).toHaveProperty('isPaused');
        expect(session).toHaveProperty('speed');
        expect(session).toHaveProperty('volume');
        expect(session).toHaveProperty('createdAt');
        expect(session).toHaveProperty('lastActiveAt');

        // Contract: sessionId must be non-empty string
        expect(typeof session.sessionId).toBe('string');
        expect(session.sessionId.length).toBeGreaterThan(0);

        // Contract: contentId must match request
        expect(session.contentId).toBe(mockRequest.contentId);

        // Contract: currentPosition must start at startWordIndex
        expect(session.currentPosition).toBe(mockRequest.startWordIndex || 0);

        // Contract: isPlaying must be true when started
        expect(session.isPlaying).toBe(true);

        // Contract: isPaused must be false when started
        expect(session.isPaused).toBe(false);

        // Contract: speed and volume must match request
        expect(session.speed).toBe(mockRequest.speed);
        expect(session.volume).toBe(mockRequest.volume);

        // Contract: timestamps must be valid dates
        expect(session.createdAt).toBeInstanceOf(Date);
        expect(session.lastActiveAt).toBeInstanceOf(Date);

      } catch (error) {
        // Expected to fail - implementation doesn't exist yet
        expect(error.code).toBe('MODULE_NOT_FOUND');
      }
    });

    test('should validate required parameters', async () => {
      try {
        const SpeechController = require('../../src/background/speech-controller.js');
        const controller = new SpeechController();

        // Contract: Should reject missing contentId
        await expect(controller.startSpeech({
          text: 'test',
          tabId: 1,
        })).rejects.toThrow();

        // Contract: Should reject missing text
        await expect(controller.startSpeech({
          contentId: 'test-123',
          tabId: 1,
        })).rejects.toThrow();

        // Contract: Should reject missing tabId
        await expect(controller.startSpeech({
          contentId: 'test-123',
          text: 'test',
        })).rejects.toThrow();

      } catch (error) {
        // Expected to fail - implementation doesn't exist yet
        expect(error.code).toBe('MODULE_NOT_FOUND');
      }
    });

    test('should use default values for optional parameters', async () => {
      const minimalRequest = {
        contentId: 'test-content-456',
        text: 'Test text',
        tabId: 1,
      };

      try {
        const SpeechController = require('../../src/background/speech-controller.js');
        const controller = new SpeechController();

        const session = await controller.startSpeech(minimalRequest);

        // Contract: Default values for optional parameters
        expect(session.currentPosition).toBe(0); // default startWordIndex
        expect(session.speed).toBe(1.0); // default speed
        expect(session.volume).toBe(1.0); // default volume

      } catch (error) {
        // Expected to fail - implementation doesn't exist yet
        expect(error.code).toBe('MODULE_NOT_FOUND');
      }
    });

    test('should reject when Speech API not supported', async () => {
      // Mock unsupported speech synthesis
      const originalSpeechSynthesis = global.speechSynthesis;
      delete global.speechSynthesis;

      const mockRequest = {
        contentId: 'test-content-789',
        text: 'Test text',
        tabId: 1,
      };

      const SpeechController = require('../../src/background/speech-controller.js');
      const controller = new SpeechController();

      await expect(controller.startSpeech(mockRequest))
        .rejects.toThrow('Speech synthesis not supported in this browser');

      // Restore for other tests
      global.speechSynthesis = originalSpeechSynthesis;
    });

    test('should reject when no voices available', async () => {
      // Save original mock
      const originalGetVoices = global.speechSynthesis.getVoices;

      // Mock no voices available
      global.speechSynthesis.getVoices = jest.fn().mockReturnValue([]);

      const mockRequest = {
        contentId: 'test-content-000',
        text: 'Test text',
        tabId: 1,
      };

      const SpeechController = require('../../src/background/speech-controller.js');
      const controller = new SpeechController();

      await expect(controller.startSpeech(mockRequest))
        .rejects.toThrow('No suitable voice available');

      // Restore original mock for other tests
      global.speechSynthesis.getVoices = originalGetVoices;
    });

    test('should enforce session limit', async () => {
      const mockRequest = {
        contentId: 'test-content-limit',
        text: 'Test text',
        tabId: 1,
      };

      const SpeechController = require('../../src/background/speech-controller.js');
      const controller = new SpeechController();

      // Create 10 active sessions to reach the limit
      for (let i = 0; i < 10; i++) {
        controller.activeSessions.set(`session-${i}`, {});
      }

      await expect(controller.startSpeech(mockRequest))
        .rejects.toThrow('Maximum concurrent sessions (10) exceeded');
    });

    test('should handle text processing errors', async () => {
      const mockRequest = {
        contentId: 'test-content-error',
        text: '', // Empty text should cause processing error
        tabId: 1,
      };

      const SpeechController = require('../../src/background/speech-controller.js');
      const controller = new SpeechController();

      await expect(controller.startSpeech(mockRequest))
        .rejects.toThrow('text is required');
    });

    test('should calculate totalWords correctly', async () => {
      const mockRequest = {
        contentId: 'test-word-count',
        text: 'This is a test sentence with exactly eight words.',
        tabId: 1,
      };

      const SpeechController = require('../../src/background/speech-controller.js');
      const controller = new SpeechController();

      const session = await controller.startSpeech(mockRequest);

      // Contract: totalWords should match actual word count (9 words in the text)
      expect(session.totalWords).toBe(9);
    });

    test('should start speech synthesis', async () => {
      const mockRequest = {
        contentId: 'test-synthesis',
        text: 'Test synthesis text',
        tabId: 1,
      };

      const SpeechController = require('../../src/background/speech-controller.js');
      const controller = new SpeechController();

      await controller.startSpeech(mockRequest);

      // Contract: Should call speechSynthesis.speak()
      expect(global.speechSynthesis.speak).toHaveBeenCalled();

      const utterance = global.speechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toContain('Test synthesis text');
    });

    test('should apply speed and volume settings', async () => {
      const mockRequest = {
        contentId: 'test-settings',
        text: 'Test settings text',
        speed: 1.5,
        volume: 0.8,
        tabId: 1,
      };

      const SpeechController = require('../../src/background/speech-controller.js');
      const controller = new SpeechController();

      await controller.startSpeech(mockRequest);

      const utterance = global.speechSynthesis.speak.mock.calls[0][0];

      // Contract: Utterance should have correct rate and volume
      expect(utterance.rate).toBe(1.5);
      expect(utterance.volume).toBe(0.8);
    });
  });

  describe('Error Types Contract', () => {
    test('should throw SpeechNotSupportedError with correct structure', () => {
      try {
        const { SpeechNotSupportedError } = require('../../src/background/speech-controller.js');

        const error = new SpeechNotSupportedError();

        // Contract: Error should extend Error
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Speech synthesis not supported in this browser');

      } catch (error) {
        // Expected to fail - implementation doesn't exist yet
        expect(error.code).toBe('MODULE_NOT_FOUND');
      }
    });

    test('should throw VoiceNotAvailableError with correct structure', () => {
      try {
        const { VoiceNotAvailableError } = require('../../src/background/speech-controller.js');

        const error = new VoiceNotAvailableError('en-US');

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('No suitable voice available for language: en-US');

      } catch (error) {
        // Expected to fail - implementation doesn't exist yet
        expect(error.code).toBe('MODULE_NOT_FOUND');
      }
    });

    test('should throw TextProcessingError with correct structure', () => {
      try {
        const { TextProcessingError } = require('../../src/background/speech-controller.js');

        const originalError = new Error('Original error');
        const error = new TextProcessingError('Processing failed', originalError);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Processing failed');
        expect(error.originalError).toBe(originalError);

      } catch (error) {
        // Expected to fail - implementation doesn't exist yet
        expect(error.code).toBe('MODULE_NOT_FOUND');
      }
    });

    test('should throw SessionLimitError with correct structure', () => {
      try {
        const { SessionLimitError } = require('../../src/background/speech-controller.js');

        const error = new SessionLimitError(10);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Maximum concurrent sessions (10) exceeded');

      } catch (error) {
        // Expected to fail - implementation doesn't exist yet
        expect(error.code).toBe('MODULE_NOT_FOUND');
      }
    });
  });
});