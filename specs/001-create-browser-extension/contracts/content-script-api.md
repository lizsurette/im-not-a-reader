# Content Script API Contract

**API Type**: Browser Extension Content Script Interface
**Version**: 1.0.0
**Date**: 2025-09-13

## Overview

This contract defines the API for the content script that handles text extraction, user interaction, and UI overlay management within web pages.

## Text Extraction API

### extractArticleText()

Extracts and processes article text from the current web page.

**Signature**:
```typescript
extractArticleText(): Promise<TextContent>
```

**Parameters**: None

**Returns**: Promise<TextContent>
- Resolves with TextContent object containing processed article text
- Rejects with error if extraction fails

**Response Schema**:
```typescript
interface TextContent {
  contentId: string;
  pageUrl: string;
  title: string;
  extractedText: string;
  sentences: string[];
  words: Word[];
  articleBounds: DOMRect;
  extractionMethod: "readability" | "fallback" | "selection";
  extractedAt: Date;
  wordCount: number;
  estimatedReadingTime: number;
}
```

**Error Handling**:
- `ExtractionError`: When article content cannot be found
- `ProcessingError`: When text processing fails
- `SecurityError`: When page content is restricted

### extractSelectedText(selection: Selection)

Extracts text from user selection on the page.

**Signature**:
```typescript
extractSelectedText(selection: Selection): Promise<TextContent>
```

**Parameters**:
- `selection`: Selection - Browser Selection object

**Returns**: Promise<TextContent>
- Resolves with processed selection content
- Rejects if selection is invalid or empty

**Error Handling**:
- `SelectionError`: When selection is empty or invalid
- `ProcessingError`: When selected text cannot be processed

## UI Overlay API

### createOverlay()

Creates and injects the reading control overlay into the page.

**Signature**:
```typescript
createOverlay(): HTMLElement
```

**Parameters**: None

**Returns**: HTMLElement
- Returns the created overlay DOM element
- Throws error if overlay cannot be created

**Overlay Structure**:
```html
<div id="screen-reader-overlay" class="sr-overlay">
  <div class="sr-controls">
    <button class="sr-play-pause">⏸️</button>
    <input type="range" class="sr-speed" min="0.5" max="2" step="0.1" value="1">
    <span class="sr-position">0 / 1000</span>
    <button class="sr-close">✖️</button>
  </div>
</div>
```

### removeOverlay()

Removes the overlay from the page and cleans up event listeners.

**Signature**:
```typescript
removeOverlay(): void
```

**Parameters**: None

**Returns**: void

### updateOverlayState(state: OverlayState)

Updates the overlay UI to reflect current playback state.

**Signature**:
```typescript
updateOverlayState(state: OverlayState): void
```

**Parameters**:
```typescript
interface OverlayState {
  isPlaying: boolean;
  currentPosition: number;
  totalWords: number;
  speed: number;
  isVisible: boolean;
}
```

**Returns**: void

## Text Highlighting API

### highlightWord(wordIndex: number)

Highlights the currently spoken word in the article text.

**Signature**:
```typescript
highlightWord(wordIndex: number): void
```

**Parameters**:
- `wordIndex`: number - Index of word to highlight (0-based)

**Returns**: void

**Behavior**:
- Adds highlight class to target word element
- Removes highlight from previously highlighted word
- Scrolls highlighted word into view if needed

### clearHighlight()

Removes all text highlighting from the page.

**Signature**:
```typescript
clearHighlight(): void
```

**Parameters**: None

**Returns**: void

## Click Handler API

### registerClickHandler(callback: ClickCallback)

Registers click event handler for starting reading from clicked position.

**Signature**:
```typescript
registerClickHandler(callback: ClickCallback): void

type ClickCallback = (wordIndex: number, element: Element) => void;
```

**Parameters**:
- `callback`: Function called when user clicks on readable text
  - `wordIndex`: Index of clicked word
  - `element`: DOM element that was clicked

**Returns**: void

### unregisterClickHandler()

Removes the click event handler from the page.

**Signature**:
```typescript
unregisterClickHandler(): void
```

**Parameters**: None

**Returns**: void

## Scroll and Navigation API

### scrollToWord(wordIndex: number)

Scrolls the page to make the specified word visible.

**Signature**:
```typescript
scrollToWord(wordIndex: number): void
```

**Parameters**:
- `wordIndex`: number - Index of word to scroll to

**Returns**: void

**Behavior**:
- Smoothly scrolls word into viewport center
- Handles sticky headers and overlays
- No-op if word is already visible

### getWordElement(wordIndex: number)

Returns the DOM element containing the specified word.

**Signature**:
```typescript
getWordElement(wordIndex: number): Element | null
```

**Parameters**:
- `wordIndex`: number - Index of word to find

**Returns**: Element | null
- Returns DOM element if found
- Returns null if word not found or not mapped

## Page State Management

### detectPageChanges()

Monitors for dynamic content changes that affect article text.

**Signature**:
```typescript
detectPageChanges(): Observable<PageChange>

interface PageChange {
  type: "content" | "structure" | "navigation";
  timestamp: Date;
  affectedText?: string;
}
```

**Returns**: Observable<PageChange>
- Emits events when page content changes
- Uses MutationObserver internally

### isPageReady()

Checks if page content is fully loaded and ready for text extraction.

**Signature**:
```typescript
isPageReady(): boolean
```

**Parameters**: None

**Returns**: boolean
- `true` if page is ready for processing
- `false` if page is still loading content

## Error Types

```typescript
class ExtractionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

class ProcessingError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
  }
}

class SecurityError extends Error {
  constructor(message: string, public readonly origin: string) {
    super(message);
  }
}

class SelectionError extends Error {
  constructor(message: string, public readonly selection?: Selection) {
    super(message);
  }
}
```

## Event Handling

### Content Script Events

The content script emits the following events to the background script:

```typescript
// Text extraction completed
{
  type: "TEXT_EXTRACTED",
  data: TextContent
}

// User clicked to start reading
{
  type: "READING_START_REQUESTED",
  data: { wordIndex: number, contentId: string }
}

// User interacted with overlay controls
{
  type: "OVERLAY_CONTROL",
  data: { action: "play" | "pause" | "speed" | "close", value?: any }
}

// Page content changed
{
  type: "PAGE_CHANGED",
  data: PageChange
}

// Error occurred
{
  type: "CONTENT_ERROR",
  data: { error: Error, context: string }
}
```

## Performance Requirements

- Text extraction: Complete within 2 seconds for articles up to 10,000 words
- Overlay creation: Complete within 100ms
- Word highlighting: Update within 50ms of position change
- Click handling: Respond within 100ms of user click
- Memory usage: Maximum 50MB for text content and DOM references

## Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Firefox**: Version 109+ (Manifest V3 partial support)
- **Edge**: Version 88+ (Chromium-based)
- **Safari**: Not supported (different extension architecture)

## Security Considerations

- All DOM manipulation uses safe methods to prevent XSS
- User input is sanitized before processing
- Content extraction respects Content Security Policy
- No external script loading or eval() usage
- Isolated from page scripts using content script boundaries