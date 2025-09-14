/**
 * TextContent model - Represents processed text content from a webpage
 */

class TextContent {
  constructor({
    pageUrl,
    title = '',
    extractedText,
    extractionMethod = 'readability',
    articleBounds = null,
  }) {
    // Validation
    if (!pageUrl) throw new Error('pageUrl is required');
    if (!extractedText || typeof extractedText !== 'string') {
      throw new Error('extractedText is required and must be a string');
    }
    if (extractedText.trim().length === 0) {
      throw new Error('extractedText cannot be empty');
    }

    // Generate unique content ID
    this.contentId = this._generateContentId();

    // Basic content info
    this.pageUrl = pageUrl;
    this.title = title || this._extractTitleFromUrl(pageUrl);
    this.extractedText = extractedText.trim();
    this.extractionMethod = this._validateExtractionMethod(extractionMethod);
    this.extractedAt = new Date();

    // Article layout info
    this.articleBounds = articleBounds || this._createDefaultBounds();

    // Process text into structured format
    this.sentences = this._extractSentences(this.extractedText);
    this.words = this._extractWords(this.extractedText);
    this.wordCount = this.words.length;

    // Calculate estimated reading time (average 200 words per minute)
    this.estimatedReadingTime = Math.max(1, Math.ceil(this.wordCount / 200));
  }

  /**
   * Get word at specific index
   */
  getWord(index) {
    if (index >= 0 && index < this.words.length) {
      return this.words[index];
    }
    return null;
  }

  /**
   * Get sentence containing word at index
   */
  getSentenceForWord(wordIndex) {
    if (wordIndex < 0 || wordIndex >= this.words.length) return null;

    const word = this.words[wordIndex];
    return this.sentences[word.sentenceIndex] || null;
  }

  /**
   * Get text from word index to end
   */
  getTextFromWord(startWordIndex) {
    if (startWordIndex >= this.words.length) return '';

    return this.words
      .slice(startWordIndex)
      .map(word => word.text)
      .join(' ');
  }

  /**
   * Get text between word indices
   */
  getTextRange(startWordIndex, endWordIndex) {
    const start = Math.max(0, startWordIndex);
    const end = Math.min(this.words.length, endWordIndex);

    if (start >= end) return '';

    return this.words
      .slice(start, end)
      .map(word => word.text)
      .join(' ');
  }

  /**
   * Find word index by character position
   */
  findWordByCharPosition(charPosition) {
    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];
      if (charPosition >= word.startChar && charPosition <= word.endChar) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Get content statistics
   */
  getStats() {
    return {
      wordCount: this.wordCount,
      sentenceCount: this.sentences.length,
      characterCount: this.extractedText.length,
      estimatedReadingTime: this.estimatedReadingTime,
      averageWordsPerSentence: Math.round(this.wordCount / this.sentences.length),
      extractionMethod: this.extractionMethod,
    };
  }

  /**
   * Convert to plain object for storage/transmission
   */
  toJSON() {
    return {
      contentId: this.contentId,
      pageUrl: this.pageUrl,
      title: this.title,
      extractedText: this.extractedText,
      sentences: this.sentences,
      words: this.words,
      articleBounds: this.articleBounds,
      extractionMethod: this.extractionMethod,
      extractedAt: this.extractedAt,
      wordCount: this.wordCount,
      estimatedReadingTime: this.estimatedReadingTime,
    };
  }

  /**
   * Create TextContent from stored data
   */
  static fromJSON(data) {
    const content = new TextContent({
      pageUrl: data.pageUrl,
      title: data.title,
      extractedText: data.extractedText,
      extractionMethod: data.extractionMethod,
      articleBounds: data.articleBounds,
    });

    // Restore stored data
    content.contentId = data.contentId;
    content.extractedAt = new Date(data.extractedAt);

    return content;
  }

  /**
   * Private: Generate unique content ID
   */
  _generateContentId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `content_${timestamp}_${random}`;
  }

  /**
   * Private: Extract title from URL if not provided
   */
  _extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || urlObj.hostname;
      return filename.replace(/[-_]/g, ' ').replace(/\.[^.]*$/, '');
    } catch {
      return 'Unknown Page';
    }
  }

  /**
   * Private: Validate extraction method
   */
  _validateExtractionMethod(method) {
    const validMethods = ['readability', 'fallback', 'selection'];
    if (!validMethods.includes(method)) {
      throw new Error(`Invalid extraction method: ${method}`);
    }
    return method;
  }

  /**
   * Private: Create default article bounds
   */
  _createDefaultBounds() {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  /**
   * Private: Extract sentences from text
   */
  _extractSentences(text) {
    if (!text) return [];

    // Split on sentence endings, keeping the punctuation
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);

    return sentences.length > 0 ? sentences : [text];
  }

  /**
   * Private: Extract words with metadata
   */
  _extractWords(text) {
    if (!text) return [];

    const words = [];
    let currentPos = 0;
    let currentSentenceIndex = 0;
    let wordIndex = 0;

    // Process sentences to track word positions
    this.sentences.forEach((sentence, sentIndex) => {
      const sentenceWords = sentence
        .split(/\s+/)
        .map(word => word.trim())
        .filter(word => word.length > 0);

      sentenceWords.forEach(wordText => {
        const cleanWord = wordText.replace(/[^\w\s]/g, '');
        if (cleanWord.length === 0) return;

        const startChar = text.indexOf(wordText, currentPos);
        const endChar = startChar + wordText.length - 1;

        words.push({
          text: cleanWord,
          originalText: wordText,
          index: wordIndex++,
          sentenceIndex: sentIndex,
          startChar: Math.max(0, startChar),
          endChar: Math.max(0, endChar),
        });

        currentPos = endChar + 1;
      });
    });

    return words;
  }
}

// Custom error types
class ExtractionError extends Error {
  constructor(message, code = 'EXTRACTION_ERROR') {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
  }
}

class ProcessingError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ProcessingError';
    this.details = details;
  }
}

class SecurityError extends Error {
  constructor(message, origin = '') {
    super(message);
    this.name = 'SecurityError';
    this.origin = origin;
  }
}

class SelectionError extends Error {
  constructor(message, selection = null) {
    super(message);
    this.name = 'SelectionError';
    this.selection = selection;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TextContent,
    ExtractionError,
    ProcessingError,
    SecurityError,
    SelectionError,
  };
} else if (typeof window !== 'undefined') {
  window.TextContent = TextContent;
  window.ExtractionError = ExtractionError;
  window.ProcessingError = ProcessingError;
  window.SecurityError = SecurityError;
  window.SelectionError = SelectionError;
}