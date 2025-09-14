// Messaging utilities for communication between content and background scripts

const messaging = {
  // Send message to background script
  async sendToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  },

  // Listen for messages from background
  onMessage(callback) {
    chrome.runtime.onMessage.addListener(callback);
  }
};

// Make available globally
window.messaging = messaging;