// Jest setup file for browser extension testing

// Mock chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn(path => `chrome-extension://test-extension-id/${path}`),
    id: 'test-extension-id',
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// Mock browser APIs (for Firefox compatibility)
global.browser = global.chrome;

// Mock Speech Synthesis API
global.speechSynthesis = {
  speak: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  cancel: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'Test Voice', lang: 'en-US', default: true, localService: true }
  ]),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null,
};

global.SpeechSynthesisUtterance = jest.fn().mockImplementation(text => ({
  text,
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  lang: 'en-US',
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
}));

// Mock DOM APIs commonly used in browser extensions
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: jest.fn(() => ({
    toString: () => '',
    rangeCount: 0,
    getRangeAt: jest.fn(),
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
  })),
});

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Helper function to create mock DOM elements
global.createMockElement = (tagName, attributes = {}, innerHTML = '') => {
  const element = document.createElement(tagName);
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
  element.innerHTML = innerHTML;
  return element;
};

// Helper function to simulate extension environment
global.setupExtensionEnvironment = () => {
  // Reset all mocks
  jest.clearAllMocks();

  // Set up default mock behaviors
  chrome.storage.local.get.mockResolvedValue({});
  chrome.storage.sync.get.mockResolvedValue({});
  chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);

  return {
    chrome: global.chrome,
    speechSynthesis: global.speechSynthesis,
  };
};

// Console log suppression for tests (can be overridden in individual tests)
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Restore console for test debugging when needed
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Set up default test timeout
jest.setTimeout(10000);