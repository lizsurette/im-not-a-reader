# Background Script API Contract

**API Type**: Browser Extension Background Service Worker Interface
**Version**: 1.0.0
**Date**: 2025-09-13

## Overview

This contract defines the API for the background service worker that manages text-to-speech functionality, session state, and coordination between content scripts and popup interface.

## Speech Synthesis API

### startSpeech(request: StartSpeechRequest)

Initiates text-to-speech playback for the provided content.

**Signature**:
```typescript
startSpeech(request: StartSpeechRequest): Promise<AudioSession>
```

**Parameters**:
```typescript
interface StartSpeechRequest {
  contentId: string;
  text: string;
  startWordIndex?: number;
  speed?: number;
  volume?: number;
  tabId: number;
}
```

**Returns**: Promise<AudioSession>
- Resolves with active AudioSession object
- Rejects with error if speech synthesis fails

**Response Schema**:
```typescript
interface AudioSession {
  sessionId: string;
  pageUrl: string;
  contentId: string;
  currentPosition: number;
  totalWords: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  volume: number;
  createdAt: Date;
  lastActiveAt: Date;
}
```

**Error Handling**:
- `SpeechNotSupportedError`: Browser doesn't support Speech API
- `VoiceNotAvailableError`: No suitable voices found
- `TextProcessingError`: Text cannot be processed for speech
- `SessionLimitError`: Maximum concurrent sessions exceeded

### pauseSpeech(sessionId: string)

Pauses active speech synthesis for the specified session.

**Signature**:
```typescript
pauseSpeech(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId`: string - ID of session to pause

**Returns**: Promise<void>
- Resolves when speech is paused
- Rejects if session not found or already paused

### resumeSpeech(sessionId: string)

Resumes paused speech synthesis from the current position.

**Signature**:
```typescript
resumeSpeech(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId`: string - ID of session to resume

**Returns**: Promise<void>
- Resolves when speech resumes
- Rejects if session not found or not paused

### stopSpeech(sessionId: string)

Stops speech synthesis and cleans up the session.

**Signature**:
```typescript
stopSpeech(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId`: string - ID of session to stop

**Returns**: Promise<void>
- Resolves when speech is stopped and session cleaned up
- Rejects if session not found

### setSpeed(sessionId: string, speed: number)

Adjusts the playback speed for an active session.

**Signature**:
```typescript
setSpeed(sessionId: string, speed: number): Promise<void>
```

**Parameters**:
- `sessionId`: string - ID of session to modify
- `speed`: number - New speed (0.5 - 2.0)

**Returns**: Promise<void>
- Resolves when speed is updated
- Rejects if session not found or speed invalid

### setVolume(sessionId: string, volume: number)

Adjusts the volume for an active session.

**Signature**:
```typescript
setVolume(sessionId: string, volume: number): Promise<void>
```

**Parameters**:
- `sessionId`: string - ID of session to modify
- `volume`: number - New volume level (0.0 - 1.0)

**Returns**: Promise<void>
- Resolves when volume is updated
- Rejects if session not found or volume invalid

## Session Management API

### getActiveSession(tabId: number)

Retrieves the active session for a specific browser tab.

**Signature**:
```typescript
getActiveSession(tabId: number): Promise<AudioSession | null>
```

**Parameters**:
- `tabId`: number - Browser tab ID

**Returns**: Promise<AudioSession | null>
- Resolves with session if active
- Resolves with null if no active session
- Rejects on error accessing session data

### getAllSessions()

Retrieves all currently active sessions across all tabs.

**Signature**:
```typescript
getAllSessions(): Promise<AudioSession[]>
```

**Parameters**: None

**Returns**: Promise<AudioSession[]>
- Resolves with array of active sessions
- Empty array if no active sessions

### cleanupInactiveSessions()

Removes sessions that are no longer active or whose tabs have closed.

**Signature**:
```typescript
cleanupInactiveSessions(): Promise<number>
```

**Parameters**: None

**Returns**: Promise<number>
- Resolves with number of sessions cleaned up

## Voice Management API

### getAvailableVoices()

Retrieves list of available text-to-speech voices.

**Signature**:
```typescript
getAvailableVoices(): Promise<SpeechSynthesisVoice[]>
```

**Parameters**: None

**Returns**: Promise<SpeechSynthesisVoice[]>
- Resolves with array of available voices
- Empty array if no voices available

### getBestVoice(language?: string)

Selects the best available voice for the specified language.

**Signature**:
```typescript
getBestVoice(language?: string): Promise<SpeechSynthesisVoice | null>
```

**Parameters**:
- `language`: string (optional) - BCP 47 language code (e.g., "en-US")

**Returns**: Promise<SpeechSynthesisVoice | null>
- Resolves with best voice for language
- Resolves with null if no suitable voice found

**Selection Criteria**:
- Prefers local/offline voices over remote
- Prefers high-quality voices
- Matches language/locale if specified
- Falls back to default system voice

## User Preferences API

### getUserPreferences()

Retrieves current user preferences for the extension.

**Signature**:
```typescript
getUserPreferences(): Promise<UserPreferences>
```

**Parameters**: None

**Returns**: Promise<UserPreferences>
- Resolves with current preferences
- Creates default preferences if none exist

**Response Schema**:
```typescript
interface UserPreferences {
  userId: string;
  defaultSpeed: number;
  defaultVolume: number;
  autoStart: boolean;
  overlayPosition: OverlayPosition;
  theme: "light" | "dark" | "auto";
  keyboardShortcuts: KeyboardShortcuts;
  voicePreference: string;
  highlightCurrentWord: boolean;
  showProgress: boolean;
  pauseOnTabSwitch: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### updateUserPreferences(updates: Partial<UserPreferences>)

Updates user preferences with the provided changes.

**Signature**:
```typescript
updateUserPreferences(updates: Partial<UserPreferences>): Promise<UserPreferences>
```

**Parameters**:
- `updates`: Partial<UserPreferences> - Fields to update

**Returns**: Promise<UserPreferences>
- Resolves with updated preferences
- Rejects if validation fails

## Tab Management API

### onTabUpdated(tabId: number, changeInfo: TabChangeInfo)

Handles browser tab updates and manages session state accordingly.

**Signature**:
```typescript
onTabUpdated(tabId: number, changeInfo: TabChangeInfo): Promise<void>
```

**Parameters**:
- `tabId`: number - ID of updated tab
- `changeInfo`: chrome.tabs.TabChangeInfo - Tab change information

**Returns**: Promise<void>

**Behavior**:
- Pauses speech when tab becomes inactive
- Resumes speech when tab becomes active (if user preference allows)
- Cleans up session when tab is closed
- Handles URL changes within same tab

### onTabRemoved(tabId: number)

Handles tab closure and cleanup of associated sessions.

**Signature**:
```typescript
onTabRemoved(tabId: number): Promise<void>
```

**Parameters**:
- `tabId`: number - ID of removed tab

**Returns**: Promise<void>

## Message Handling API

### handleContentScriptMessage(message: ContentScriptMessage, sender: MessageSender)

Processes messages from content scripts.

**Signature**:
```typescript
handleContentScriptMessage(
  message: ContentScriptMessage,
  sender: chrome.runtime.MessageSender
): Promise<any>
```

**Parameters**:
- `message`: ContentScriptMessage - Message from content script
- `sender`: chrome.runtime.MessageSender - Message sender information

**Message Types**:
```typescript
type ContentScriptMessage =
  | { type: "TEXT_EXTRACTED"; data: TextContent }
  | { type: "READING_START_REQUESTED"; data: { wordIndex: number; contentId: string } }
  | { type: "OVERLAY_CONTROL"; data: { action: string; value?: any } }
  | { type: "PAGE_CHANGED"; data: PageChange }
  | { type: "CONTENT_ERROR"; data: { error: Error; context: string } };
```

**Returns**: Promise<any>
- Response varies by message type
- May return session data, acknowledgment, or error

### handlePopupMessage(message: PopupMessage)

Processes messages from popup interface.

**Signature**:
```typescript
handlePopupMessage(message: PopupMessage): Promise<any>
```

**Parameters**:
- `message`: PopupMessage - Message from popup

**Message Types**:
```typescript
type PopupMessage =
  | { type: "GET_ACTIVE_SESSION"; tabId: number }
  | { type: "CONTROL_PLAYBACK"; action: string; sessionId: string; value?: any }
  | { type: "GET_PREFERENCES" }
  | { type: "UPDATE_PREFERENCES"; updates: Partial<UserPreferences> };
```

## Event Broadcasting API

### broadcastSessionUpdate(session: AudioSession)

Broadcasts session state changes to all relevant listeners.

**Signature**:
```typescript
broadcastSessionUpdate(session: AudioSession): void
```

**Parameters**:
- `session`: AudioSession - Updated session data

**Behavior**:
- Sends update to associated content script
- Updates popup if open
- Triggers badge text update

### broadcastError(error: Error, context: string)

Broadcasts error information to relevant components.

**Signature**:
```typescript
broadcastError(error: Error, context: string): void
```

**Parameters**:
- `error`: Error - The error that occurred
- `context`: string - Context where error occurred

## Storage API

### saveSession(session: AudioSession)

Persists session data to extension storage.

**Signature**:
```typescript
saveSession(session: AudioSession): Promise<void>
```

**Parameters**:
- `session`: AudioSession - Session to save

**Returns**: Promise<void>

### loadSession(sessionId: string)

Loads session data from extension storage.

**Signature**:
```typescript
loadSession(sessionId: string): Promise<AudioSession | null>
```

**Parameters**:
- `sessionId`: string - ID of session to load

**Returns**: Promise<AudioSession | null>

### deleteSession(sessionId: string)

Removes session data from extension storage.

**Signature**:
```typescript
deleteSession(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId`: string - ID of session to delete

**Returns**: Promise<void>

## Error Types

```typescript
class SpeechNotSupportedError extends Error {
  constructor() {
    super("Speech synthesis not supported in this browser");
  }
}

class VoiceNotAvailableError extends Error {
  constructor(language?: string) {
    super(`No suitable voice available${language ? ` for language: ${language}` : ""}`);
  }
}

class TextProcessingError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
  }
}

class SessionLimitError extends Error {
  constructor(limit: number) {
    super(`Maximum concurrent sessions (${limit}) exceeded`);
  }
}

class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
  }
}
```

## Performance Requirements

- Speech start: Begin within 500ms of request
- Control responsiveness: React within 100ms
- Session management: Handle up to 10 concurrent sessions
- Memory usage: Maximum 100MB for all sessions combined
- Storage operations: Complete within 200ms

## Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3, Service Workers)
- **Firefox**: Version 109+ (Service Workers support)
- **Edge**: Version 88+ (Chromium-based)

## Security Considerations

- All message handling validates sender origin
- Session data encrypted in storage
- No external network requests for speech synthesis
- Content Security Policy compliance
- Secure handling of user preferences and session data