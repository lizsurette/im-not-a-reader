// Main content script - coordinates all components

class ScreenReaderExtension {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Wait for page to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize components
      console.log('Screen Reader Extension initializing...');

      // Check if extension should be enabled
      await this.checkExtensionState();

      // Setup message listeners
      this.setupExtensionActivation();

      this.isInitialized = true;
      console.log('Screen Reader Extension initialized');

    } catch (error) {
      console.error('Screen Reader Extension initialization failed:', error);
    }
  }

  async checkExtensionState() {
    try {
      const result = await chrome.storage.local.get(['extensionEnabled']);
      const isEnabled = result.extensionEnabled !== false; // Default to enabled

      if (isEnabled) {
        this.activate();
      } else {
        this.deactivate();
      }
    } catch (error) {
      console.error('Error checking extension state:', error);
      // Default to enabled if we can't check state
      this.activate();
    }
  }

  setupExtensionActivation() {
    // Listen for messages from popup to enable/disable
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'enable':
          this.activate();
          sendResponse({ success: true });
          break;

        case 'disable':
          this.deactivate();
          sendResponse({ success: true });
          break;

        // Legacy support
        case 'ACTIVATE_READER':
          this.activate();
          sendResponse({ success: true });
          break;

        case 'DEACTIVATE_READER':
          this.deactivate();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message action' });
      }
    });
  }

  activate() {
    console.log('Screen Reader activated - click anywhere to start reading');
    window.clickHandler?.activate();

    // Show a brief notification
    this.showNotification('Screen Reader enabled - click anywhere to start reading');
  }

  deactivate() {
    console.log('Screen Reader deactivated');
    window.clickHandler?.deactivate();
    window.uiOverlay?.hide();

    // Clear any active highlighting
    window.textHighlighter?.clearHighlight();

    // Show deactivation notification
    this.showNotification('Screen Reader disabled');
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize when script loads
const screenReader = new ScreenReaderExtension();
screenReader.init();