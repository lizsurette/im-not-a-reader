// Main background script for Screen Reader Extension
// This script handles extension lifecycle and coordinates between components

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Screen Reader Extension installed:', details);

  // Initialize default settings
  chrome.storage.local.set({
    extensionEnabled: false, // Default to disabled
    speed: 1.0,
    volume: 1.0,
    voice: null // Will use default voice
  });
});

// Handle action button click (direct toggle)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get current state
    const result = await chrome.storage.local.get(['extensionEnabled']);
    const isCurrentlyEnabled = result.extensionEnabled || false;
    const newState = !isCurrentlyEnabled;

    // Save new state
    await chrome.storage.local.set({ extensionEnabled: newState });

    // Update action button appearance
    chrome.action.setTitle({
      tabId: tab.id,
      title: newState ? 'Screen Reader: ON (click to disable)' : 'Screen Reader: OFF (click to enable)'
    });

    // Send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: newState ? 'enable' : 'disable'
      });
    } catch (error) {
      console.log('Content script not ready, state will be applied on next page load');
    }

    console.log('Extension toggled:', newState ? 'enabled' : 'disabled');

  } catch (error) {
    console.error('Error toggling extension:', error);
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'INIT_SPEECH':
      // Initialize speech for the tab
      sendResponse({ success: true });
      break;

    case 'START_READING':
      // Handle start reading request
      if (message.text) {
        // Speech will be handled by content script using Web Speech API
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No text provided' });
      }
      break;

    case 'STOP_READING':
      // Handle stop reading request
      sendResponse({ success: true });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

console.log('Screen Reader Extension background script loaded');