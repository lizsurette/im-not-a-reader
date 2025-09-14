# Data Model: Browser Screen Reader Extension

**Feature**: Browser Screen Reader Extension
**Date**: 2025-09-13
**Status**: Design Complete

## Overview

This document defines the core data entities for the browser screen reader extension. The model supports text extraction, audio playback management, and user preference storage within the browser extension environment.

## Core Entities

### AudioSession

Represents an active text-to-speech reading session with playback state and position tracking.

**Fields**:
- `sessionId`: string (UUID) - Unique identifier for the session
- `pageUrl`: string - URL of the page being read
- `contentId`: string - Reference to associated TextContent
- `currentPosition`: number - Current word index being read (0-based)
- `totalWords`: number - Total number of words in the content
- `isPlaying`: boolean - Current playback state
- `isPaused`: boolean - Whether session is paused (vs stopped)
- `speed`: number - Playback speed multiplier (0.5 - 2.0)
- `volume`: number - Volume level (0.0 - 1.0)
- `createdAt`: Date - Session creation timestamp
- `lastActiveAt`: Date - Last interaction timestamp

**State Transitions**:
- `created` → `playing` (user starts reading)
- `playing` → `paused` (user pauses)
- `paused` → `playing` (user resumes)
- `playing` → `stopped` (user stops or content ends)
- `paused` → `stopped` (user stops)

**Validation Rules**:
- `sessionId` must be unique and non-empty
- `currentPosition` must be >= 0 and <= totalWords
- `speed` must be between 0.5 and 2.0 inclusive
- `volume` must be between 0.0 and 1.0 inclusive
- `pageUrl` must be a valid URL

### TextContent

Represents processed and structured text content extracted from a webpage for text-to-speech conversion.

**Fields**:
- `contentId`: string (UUID) - Unique identifier for the content
- `pageUrl`: string - Source page URL
- `title`: string - Article or page title
- `extractedText`: string - Clean article text without markup
- `sentences`: Array<string> - Text split into sentence boundaries
- `words`: Array<Word> - Individual words with metadata
- `articleBounds`: DOMRect - Bounding box of detected article content
- `extractionMethod`: string - Method used ("readability" | "fallback" | "selection")
- `extractedAt`: Date - Content extraction timestamp
- `wordCount`: number - Total number of words
- `estimatedReadingTime`: number - Estimated reading time in minutes

**Word Structure**:
```typescript
interface Word {
  text: string;           // The actual word text
  index: number;          // Word index in the content (0-based)
  sentenceIndex: number;  // Which sentence this word belongs to
  startChar: number;      // Character position in full text
  endChar: number;        // Character end position in full text
  domElement?: Element;   // Reference to DOM element (if available)
}
```

**Validation Rules**:
- `contentId` must be unique and non-empty
- `extractedText` must not be empty
- `words` array must match word count
- `pageUrl` must be a valid URL
- `wordCount` must equal words array length

### UserPreferences

Stores user customization settings for the screen reader extension.

**Fields**:
- `userId`: string - User identifier (extension installation ID)
- `defaultSpeed`: number - Default reading speed (0.5 - 2.0)
- `defaultVolume`: number - Default volume level (0.0 - 1.0)
- `autoStart`: boolean - Whether to auto-start when text is selected
- `overlayPosition`: OverlayPosition - Preferred overlay location
- `theme`: string - UI theme ("light" | "dark" | "auto")
- `keyboardShortcuts`: KeyboardShortcuts - Custom keyboard bindings
- `voicePreference`: string - Preferred voice name (if available)
- `highlightCurrentWord`: boolean - Whether to highlight currently spoken word
- `showProgress`: boolean - Whether to show reading progress
- `pauseOnTabSwitch`: boolean - Whether to pause when switching tabs
- `createdAt`: Date - Preference creation timestamp
- `updatedAt`: Date - Last update timestamp

**OverlayPosition Structure**:
```typescript
interface OverlayPosition {
  x: number;        // X coordinate (percentage of viewport)
  y: number;        // Y coordinate (percentage of viewport)
  anchor: string;   // Anchor point ("top-left" | "top-right" | "bottom-left" | "bottom-right")
}
```

**KeyboardShortcuts Structure**:
```typescript
interface KeyboardShortcuts {
  playPause: string;    // Default: "Space"
  speedUp: string;      // Default: "ArrowUp"
  speedDown: string;    // Default: "ArrowDown"
  stop: string;         // Default: "Escape"
  skipForward: string;  // Default: "ArrowRight"
  skipBackward: string; // Default: "ArrowLeft"
}
```

**Validation Rules**:
- `defaultSpeed` must be between 0.5 and 2.0 inclusive
- `defaultVolume` must be between 0.0 and 1.0 inclusive
- `overlayPosition.x` and `overlayPosition.y` must be between 0 and 100
- All keyboard shortcut values must be valid key combinations

## Entity Relationships

```
UserPreferences (1) ←→ (*) AudioSession
    ↓
TextContent (1) ←→ (*) AudioSession
```

**Relationship Rules**:
- One UserPreferences record per extension installation
- Multiple AudioSessions can exist (different pages/tabs)
- Each AudioSession references one TextContent
- TextContent can be shared across sessions (same page, different sessions)

## Storage Implementation

**Browser Extension Storage API**:
- `UserPreferences`: Stored in `chrome.storage.sync` for cross-device sync
- `AudioSession`: Stored in `chrome.storage.local` for current session
- `TextContent`: Stored in memory during active session, cached in `chrome.storage.local`

**Storage Limits**:
- `storage.sync`: 100KB total, 8KB per item
- `storage.local`: 10MB total
- Memory cache: 50MB maximum per content item

## Data Lifecycle

**TextContent Lifecycle**:
1. Created when user activates extension on page
2. Cached for page revisits within session
3. Cleared when browser tab closes
4. Garbage collected after 24 hours of inactivity

**AudioSession Lifecycle**:
1. Created when user starts reading
2. Persists across browser restarts (if tab remains open)
3. Cleared when tab closes or user stops reading
4. Maximum 10 concurrent sessions across all tabs

**UserPreferences Lifecycle**:
1. Created on first extension use
2. Synchronized across devices (Chrome sync)
3. Persists until extension uninstall
4. Backed up/restored with browser profile

## Validation and Constraints

**Data Integrity**:
- All IDs must be UUIDs generated with crypto.randomUUID()
- Timestamps must be ISO 8601 format
- URLs must pass URL constructor validation
- Numeric ranges enforced at model layer

**Performance Constraints**:
- Maximum article length: 50,000 words
- Maximum concurrent sessions: 10
- Content cache expiry: 24 hours
- Preference sync frequency: Maximum once per minute

**Error Handling**:
- Invalid data triggers model validation errors
- Storage quota exceeded gracefully degrades (memory-only mode)
- Corrupted data auto-repairs with defaults
- Network unavailable doesn't block local operations

## Migration Strategy

**Version Compatibility**:
- Model versioning with schema migration support
- Backward compatibility for 2 major versions
- Automatic data migration on extension update
- Fallback to defaults for incompatible data

This data model provides a robust foundation for managing the complex state requirements of a browser-based text-to-speech system while maintaining performance and user experience standards.