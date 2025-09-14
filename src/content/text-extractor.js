/**
 * TextExtractor - Extracts clean article text from web pages using Readability algorithm
 */

class TextExtractor {
  constructor() {
    this.readabilityOptions = {
      debug: false,
      maxElemsToParse: 0,
      nbTopCandidates: 5,
      charThreshold: 500,
      classesToPreserve: ['caption', 'video', 'audio'],
      keepClasses: false,
    };
  }

  /**
   * Extract article text from the current page
   * @returns {Promise<TextContent>} Processed text content
   */
  async extractArticleText() {
    try {
      // Check if page is ready
      if (!this._isPageReady()) {
        throw new ExtractionError('Page not ready for text extraction', 'PAGE_NOT_READY');
      }

      const pageUrl = window.location.href;
      let extractedText = '';
      let title = '';
      let articleBounds = null;
      let extractionMethod = 'readability';

      // Try Readability algorithm first
      try {
        const readabilityResult = this._extractWithReadability();
        if (readabilityResult) {
          extractedText = readabilityResult.textContent;
          title = readabilityResult.title;
          articleBounds = readabilityResult.bounds;
        }
      } catch (error) {
        console.warn('Readability extraction failed:', error);
      }

      // Fallback to simple text extraction
      if (!extractedText || extractedText.length < 100) {
        const fallbackResult = this._extractWithFallback();
        extractedText = fallbackResult.textContent;
        title = fallbackResult.title;
        articleBounds = fallbackResult.bounds;
        extractionMethod = 'fallback';
      }

      // Final validation
      if (!extractedText || extractedText.trim().length === 0) {
        throw new ExtractionError('No readable text content found on page', 'NO_CONTENT');
      }

      // Create TextContent object
      return new TextContent({
        pageUrl,
        title,
        extractedText: extractedText.trim(),
        extractionMethod,
        articleBounds,
      });

    } catch (error) {
      if (error instanceof ExtractionError) {
        throw error;
      }

      // Handle security restrictions
      if (error.message.includes('Access denied') || error.name === 'SecurityError') {
        throw new SecurityError('Cannot access page content due to security restrictions', pageUrl);
      }

      // Generic processing error
      throw new ProcessingError('Failed to extract text from page', error);
    }
  }

  /**
   * Extract text from user selection
   * @param {Selection} selection - Browser Selection object
   * @returns {Promise<TextContent>} Processed selection content
   */
  async extractSelectedText(selection) {
    try {
      if (!selection || selection.rangeCount === 0) {
        throw new SelectionError('No text selection found', selection);
      }

      const selectedText = selection.toString().trim();
      if (selectedText.length === 0) {
        throw new SelectionError('Selected text is empty', selection);
      }

      const pageUrl = window.location.href;
      const title = document.title || 'Selected Text';

      // Get bounds of selection
      let articleBounds = null;
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        articleBounds = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        };
      } catch (error) {
        // Use default bounds if unable to get selection bounds
        articleBounds = this._createDefaultBounds();
      }

      return new TextContent({
        pageUrl,
        title,
        extractedText: selectedText,
        extractionMethod: 'selection',
        articleBounds,
      });

    } catch (error) {
      if (error instanceof SelectionError) {
        throw error;
      }
      throw new ProcessingError('Failed to extract selected text', error);
    }
  }

  /**
   * Check if page content is ready for extraction
   */
  _isPageReady() {
    return document.readyState === 'complete' ||
           document.readyState === 'interactive';
  }

  /**
   * Extract text using Readability algorithm
   */
  _extractWithReadability() {
    const documentClone = document.cloneNode(true);

    // Remove unwanted elements
    this._removeUnwantedElements(documentClone);

    // Find main content using heuristics
    const article = this._findMainContent(documentClone);

    if (!article) {
      throw new Error('No main content found');
    }

    const textContent = this._extractTextFromElement(article);
    const title = this._extractTitle(documentClone);
    const bounds = this._getElementBounds(article);

    return {
      textContent,
      title,
      bounds,
    };
  }

  /**
   * Fallback text extraction for pages where Readability fails
   */
  _extractWithFallback() {
    // Try common article selectors
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '#main',
      '.main-content',
    ];

    let bestElement = null;
    let maxTextLength = 0;

    // Find element with most text content
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const textLength = element.textContent.trim().length;
        if (textLength > maxTextLength) {
          maxTextLength = textLength;
          bestElement = element;
        }
      }
    }

    // If no good element found, use document body
    if (!bestElement) {
      bestElement = document.body;
    }

    const textContent = this._extractTextFromElement(bestElement);
    const title = document.title || 'Web Page';
    const bounds = this._getElementBounds(bestElement);

    return {
      textContent,
      title,
      bounds,
    };
  }

  /**
   * Remove unwanted elements from document
   */
  _removeUnwantedElements(doc) {
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.advertisement',
      '.ad',
      '.social-share',
      '.comments',
      '.sidebar',
      '.menu',
      '.navigation',
      '[aria-hidden="true"]',
    ];

    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });
  }

  /**
   * Find main content element using content density heuristics
   */
  _findMainContent(doc) {
    const candidates = [];

    // Look for semantic elements first
    const semanticElements = doc.querySelectorAll('main, article, [role="main"]');
    semanticElements.forEach(element => {
      candidates.push({
        element,
        score: this._calculateContentScore(element) + 100, // Bonus for semantic markup
      });
    });

    // Look for elements with content-related classes/IDs
    const contentElements = doc.querySelectorAll([
      '.content', '.post', '.article', '.entry',
      '#content', '#main', '#article', '#post'
    ].join(', '));

    contentElements.forEach(element => {
      candidates.push({
        element,
        score: this._calculateContentScore(element),
      });
    });

    // Find all paragraph containers
    const paragraphContainers = doc.querySelectorAll('div');
    paragraphContainers.forEach(element => {
      const score = this._calculateContentScore(element);
      if (score > 50) { // Only consider elements with substantial content
        candidates.push({ element, score });
      }
    });

    // Return element with highest score
    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].element : null;
  }

  /**
   * Calculate content density score for an element
   */
  _calculateContentScore(element) {
    if (!element) return 0;

    let score = 0;
    const text = element.textContent || '';
    const textLength = text.trim().length;

    // Base score from text length
    score += textLength / 25;

    // Bonus for paragraphs
    const paragraphs = element.querySelectorAll('p');
    score += paragraphs.length * 25;

    // Penalty for high link density
    const links = element.querySelectorAll('a');
    const linkText = Array.from(links).reduce((total, link) => total + (link.textContent || '').length, 0);
    const linkDensity = textLength > 0 ? linkText / textLength : 0;
    if (linkDensity > 0.5) {
      score *= (1 - linkDensity);
    }

    // Penalty for many small elements (likely navigation/sidebar)
    const childElements = element.children.length;
    if (childElements > 20 && textLength / childElements < 50) {
      score *= 0.5;
    }

    return Math.max(0, score);
  }

  /**
   * Extract clean text from element
   */
  _extractTextFromElement(element) {
    if (!element) return '';

    // Create a clone to avoid modifying original
    const clone = element.cloneNode(true);

    // Remove remaining unwanted elements
    const unwanted = clone.querySelectorAll('script, style, nav, header, footer, .ad');
    unwanted.forEach(el => el.remove());

    // Get text content and clean it up
    let text = clone.textContent || '';

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Remove excessive line breaks
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');

    return text;
  }

  /**
   * Extract page title
   */
  _extractTitle(doc) {
    // Try various title sources
    const titleSelectors = [
      'h1',
      '.title',
      '.post-title',
      '.entry-title',
      '.article-title',
      '[property="og:title"]',
      'title',
    ];

    for (const selector of titleSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const title = (element.textContent || element.getAttribute('content') || '').trim();
        if (title.length > 0 && title.length < 200) {
          return title;
        }
      }
    }

    return document.title || 'Web Page';
  }

  /**
   * Get bounding rectangle for element
   */
  _getElementBounds(element) {
    try {
      if (element && element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        };
      }
    } catch (error) {
      // Fallback if getBoundingClientRect fails
    }

    return this._createDefaultBounds();
  }

  /**
   * Create default bounds object
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
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextExtractor;
} else if (typeof window !== 'undefined') {
  window.TextExtractor = TextExtractor;
}