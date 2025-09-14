// Text highlighter for tracking reading progress

class TextHighlighter {
  constructor() {
    this.currentHighlight = null;
    this.highlightClass = 'sr-text-highlight';
    this.injectStyles();
  }

  injectStyles() {
    // Inject CSS for highlighting if not already present
    if (!document.getElementById('sr-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'sr-highlight-styles';
      style.textContent = `
        .${this.highlightClass} {
          background-color: #ffeb3b !important;
          background-image: linear-gradient(120deg, #ffeb3b 0%, #ffc107 100%) !important;
          border: 2px solid #ff9800 !important;
          border-radius: 5px !important;
          box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3) !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          z-index: 9999 !important;
          padding: 4px !important;
          margin: 2px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Find the sentence containing the clicked element
  findSentenceElement(clickedElement) {
    let element = clickedElement;

    // Traverse up the DOM to find a good text container
    while (element && element !== document.body) {
      const text = element.textContent;
      if (text && text.trim().length > 20) {
        // Check if this element contains sentence-like content
        if (text.includes('.') || text.includes('!') || text.includes('?')) {
          return element;
        }
      }
      element = element.parentElement;
    }

    // If no good sentence container found, return the clicked element
    return clickedElement;
  }

  // Extract sentence text from the element where reading started
  extractSentenceText(element, startText) {
    const fullText = element.textContent;

    // For now, highlight the entire paragraph/element
    // In a more sophisticated implementation, we could parse individual sentences
    return fullText.trim();
  }

  // Create a sentence-level highlight
  highlightSentence(clickedElement, sentenceText) {
    this.clearHighlight();

    if (!clickedElement || !sentenceText) return;

    // Find the text container that holds this sentence
    let textContainer = clickedElement;
    while (textContainer && (!textContainer.textContent || !textContainer.textContent.includes(sentenceText))) {
      textContainer = textContainer.parentElement;
      if (!textContainer || textContainer === document.body) break;
    }

    if (!textContainer) return;

    // Create a highlight span for just this sentence
    const fullText = textContainer.textContent;
    const sentenceStart = fullText.indexOf(sentenceText);

    if (sentenceStart !== -1) {
      // Create a new highlighted version
      const beforeText = fullText.substring(0, sentenceStart);
      const afterText = fullText.substring(sentenceStart + sentenceText.length);

      // Create highlight span
      const highlightSpan = document.createElement('span');
      highlightSpan.classList.add(this.highlightClass);
      highlightSpan.textContent = sentenceText;

      // Replace the text content
      textContainer.innerHTML = '';
      if (beforeText) {
        textContainer.appendChild(document.createTextNode(beforeText));
      }
      textContainer.appendChild(highlightSpan);
      if (afterText) {
        textContainer.appendChild(document.createTextNode(afterText));
      }

      this.currentHighlight = highlightSpan;

      // Scroll into view
      highlightSpan.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  // Clear any existing highlighting
  clearHighlight() {
    console.log('DEBUG: clearHighlight() called');
    console.trace('DEBUG: clearHighlight call stack');

    if (this.currentHighlight) {
      // If it's our overlay, remove it from DOM
      if (this.currentHighlight.id === 'sr-highlight-overlay') {
        this.currentHighlight.remove();
        console.log('DEBUG: Removed highlight overlay');
      } else {
        // Legacy: restore original inline styles
        if (this.originalStyles) {
          this.currentHighlight.style.backgroundColor = this.originalStyles.backgroundColor;
          this.currentHighlight.style.border = this.originalStyles.border;
          this.currentHighlight.style.borderRadius = this.originalStyles.borderRadius;
          this.currentHighlight.style.boxShadow = this.originalStyles.boxShadow;
          this.currentHighlight.style.padding = this.originalStyles.padding;
          this.currentHighlight.style.margin = this.originalStyles.margin;
        }
        this.currentHighlight.classList.remove(this.highlightClass);
        console.log('DEBUG: Cleared highlighting and restored original styles');
      }

      this.currentHighlight = null;
      this.originalStyles = null;
    }

    // Also clean up any orphaned overlays or highlights
    const orphanedOverlays = document.querySelectorAll('#sr-highlight-overlay');
    orphanedOverlays.forEach(el => el.remove());

    const orphanedSentenceHighlights = document.querySelectorAll('.sr-sentence-highlight');
    orphanedSentenceHighlights.forEach(el => el.remove());

    const orphanedHighlights = document.querySelectorAll(`.${this.highlightClass}`);
    orphanedHighlights.forEach(el => {
      el.classList.remove(this.highlightClass);
    });
  }

  // Start highlighting for a reading session
  startHighlighting(clickedElement, text) {
    this.highlightSentence(clickedElement, text);
  }

  // Stop highlighting when reading ends
  stopHighlighting() {
    this.clearHighlight();
  }

  // Update highlighting when reading position changes
  updateHighlight(newElement) {
    const sentenceElement = this.findSentenceElement(newElement);
    this.highlightElement(sentenceElement);
  }

  // Highlight a specific sentence anywhere on the page
  highlightSentenceInPage(sentenceText) {
    this.clearHighlight();

    if (!sentenceText || !sentenceText.trim()) return;

    const cleanSentenceText = sentenceText.trim();
    // console.log('DEBUG: Attempting to highlight sentence:', cleanSentenceText.substring(0, 80) + '...');

    // Find all text nodes on the page
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Only include nodes with substantial text
          return node.textContent.trim().length > 10 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent;

      // Look for sentence match with better criteria
      const sentenceStart = text.indexOf(cleanSentenceText);
      const isValidMatch = sentenceStart !== -1 &&
                          cleanSentenceText.length > 15 &&
                          (cleanSentenceText.length / text.length) > 0.3; // Sentence should be substantial part of text

      if (isValidMatch) {
        // console.log('DEBUG: Found matching text node for sentence highlighting');
        // Found the sentence in this text node
        const parent = textNode.parentElement;
        if (!parent) continue;

        // Create highlight span
        const highlightSpan = document.createElement('span');
        highlightSpan.classList.add(this.highlightClass);
        highlightSpan.textContent = cleanSentenceText;

        // Split the text node and insert highlight
        const beforeText = text.substring(0, sentenceStart);
        const afterText = text.substring(sentenceStart + cleanSentenceText.length);

        // Replace the text node with our highlighted version
        const fragment = document.createDocumentFragment();
        if (beforeText) {
          fragment.appendChild(document.createTextNode(beforeText));
        }
        fragment.appendChild(highlightSpan);
        if (afterText) {
          fragment.appendChild(document.createTextNode(afterText));
        }

        parent.replaceChild(fragment, textNode);
        this.currentHighlight = highlightSpan;

        // Scroll into view
        highlightSpan.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        return; // Found and highlighted, stop searching
      }
    }

    // console.log('DEBUG: No matching text node found for sentence highlighting');
  }

  // Highlight a specific sentence within a known container (kept for compatibility)
  highlightSentenceInContainer(sentenceText, container) {
    this.highlightSentenceInPage(sentenceText);
  }

  // Highlight a specific sentence within the page
  highlightSentenceInDOM(sentenceText, startElement) {
    this.clearHighlight();

    if (!sentenceText || !sentenceText.trim()) return;

    const cleanSentenceText = sentenceText.trim();
    console.log('DEBUG: Looking for sentence to highlight:', cleanSentenceText.substring(0, 60) + '...');

    // Find the sentence in the DOM starting from the clicked element's paragraph
    let targetElement = startElement;
    while (targetElement && targetElement !== document.body) {
      if (targetElement.textContent && targetElement.textContent.includes(cleanSentenceText)) {
        break;
      }
      targetElement = targetElement.parentElement;
    }

    if (!targetElement || targetElement === document.body) {
      console.log('DEBUG: Could not find containing element for sentence');
      return;
    }

    // Create overlay for just this sentence within the paragraph
    const textContent = targetElement.textContent;
    const sentenceStart = textContent.indexOf(cleanSentenceText);

    if (sentenceStart === -1) {
      console.log('DEBUG: Sentence not found in target element text');
      return;
    }

    // Create a range to get the sentence position
    const range = document.createRange();
    const walker = document.createTreeWalker(
      targetElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentPos = 0;
    let textNode = walker.nextNode();
    let sentenceRange = null;

    while (textNode) {
      const nodeLength = textNode.textContent.length;
      const nodeEnd = currentPos + nodeLength;

      // Check if our sentence starts in this text node
      if (sentenceStart >= currentPos && sentenceStart < nodeEnd) {
        const nodeOffset = sentenceStart - currentPos;
        const sentenceEnd = Math.min(sentenceStart + cleanSentenceText.length, nodeEnd);
        const sentenceEndOffset = sentenceEnd - currentPos;

        range.setStart(textNode, nodeOffset);
        range.setEnd(textNode, sentenceEndOffset);
        sentenceRange = range;
        break;
      }

      currentPos = nodeEnd;
      textNode = walker.nextNode();
    }

    if (sentenceRange) {
      const rect = sentenceRange.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.createSentenceOverlay(rect, cleanSentenceText);
      }
    }
  }

  createSentenceOverlay(rect, sentenceText) {
    const overlay = document.createElement('div');
    overlay.className = 'sr-sentence-highlight';

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    overlay.style.position = 'absolute';
    overlay.style.top = (rect.top + scrollTop - 2) + 'px';
    overlay.style.left = (rect.left + scrollLeft - 2) + 'px';
    overlay.style.width = (rect.width + 4) + 'px';
    overlay.style.height = (rect.height + 4) + 'px';
    overlay.style.backgroundColor = 'rgba(255, 235, 59, 0.6)';
    overlay.style.border = '1px solid #ffc107';
    overlay.style.borderRadius = '3px';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '999999';
    overlay.style.transition = 'all 0.3s ease';

    document.body.appendChild(overlay);
    this.currentHighlight = overlay;

    console.log('DEBUG: Created sentence overlay for:', sentenceText.substring(0, 40) + '...');

    // Scroll into view
    overlay.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }
}

// Initialize text highlighter
window.textHighlighter = new TextHighlighter();

// Disable old sentence-based highlighting events that interfere with element highlighting
// The new element highlighting is handled directly in click-handler.js

// Keep only the stop event for cleanup
window.addEventListener('sr-reading-stopped', () => {
  window.textHighlighter.stopHighlighting();
});

// Disabled the following events that interfere with element highlighting:
// - sr-reading-started (calls startHighlighting -> highlightSentence -> clearHighlight)
// - sr-position-changed (calls updateHighlight)
// - sr-sentence-progress (calls highlightSentenceInPage -> clearHighlight)
//
// window.addEventListener('sr-reading-started', (e) => {
//   if (e.detail && e.detail.element) {
//     window.textHighlighter.startHighlighting(e.detail.element, e.detail.text);
//   }
// });
//
// window.addEventListener('sr-position-changed', (e) => {
//   if (e.detail && e.detail.element) {
//     window.textHighlighter.updateHighlight(e.detail.element);
//   }
// });
//
// window.addEventListener('sr-sentence-progress', (e) => {
//   if (e.detail && e.detail.sentenceText) {
//     window.textHighlighter.highlightSentenceInPage(e.detail.sentenceText);
//   }
// });