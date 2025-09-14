// Click handler for starting reading from selected position

class ClickHandler {
  constructor() {
    this.isActive = false;
    this.currentSpeech = null;
    this.highlightPaused = false;
  }

  activate() {
    if (this.isActive) return;

    this.isActive = true;
    document.addEventListener('click', this.handleClick.bind(this));
    document.body.style.cursor = 'crosshair';
  }

  deactivate() {
    this.isActive = false;
    document.removeEventListener('click', this.handleClick.bind(this));
    document.body.style.cursor = 'default';

    if (this.currentSpeech) {
      this.currentSpeech.cancel();
      this.currentSpeech = null;
    }
  }

  async handleClick(event) {
    if (!this.isActive) return;

    // Ignore clicks on the overlay controls
    const element = event.target;
    if (element.closest('#screen-reader-overlay')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      // Pass the click event to extract text based on coordinates
      const text = await this.extractTextFromClick(event);

      if (text && text.trim()) {
        this.startReading(text);
        window.uiOverlay?.show();

        // Notify highlighter that reading started
        window.dispatchEvent(new CustomEvent('sr-reading-started', {
          detail: { element: element, text: text }
        }));
      }
    } catch (error) {
      console.error('Error handling click:', error);
    }
  }

  async extractTextFromClick(event) {
    try {
      // Extract the full article text first
      if (!window.textExtractor) {
        window.textExtractor = new TextExtractor();
      }

      console.log('DEBUG: Extracting full article text...');
      let articleContent = null;
      try {
        articleContent = await window.textExtractor.extractArticleText();
        console.log('DEBUG: Article content object:', articleContent);
        console.log('DEBUG: Article content keys:', articleContent ? Object.keys(articleContent) : 'null');
      } catch (error) {
        console.error('DEBUG: Error in extractArticleText:', error);
        articleContent = null;
      }

      const fullArticleText = articleContent ? articleContent.extractedText : null;
      console.log('DEBUG: Full article text length:', fullArticleText ? fullArticleText.length : 'undefined');
      console.log('DEBUG: Full article preview:', fullArticleText ? fullArticleText.substring(0, 200) + '...' : 'no text');

      // Find the clicked text within the article
      const clickedElement = event.target;
      const clickedText = this.getClickedSentenceText(event);

      console.log('DEBUG: Clicked sentence text:', clickedText);

      if (!clickedText) {
        // Fallback: return full article
        return this.setupFullArticleReading(fullArticleText);
      }

      if (!fullArticleText) {
        console.error('DEBUG: No article text found, falling back to element extraction');
        return this.extractTextFromElement(event.target);
      }

      // Split full article into sentences first
      const allSentences = this.splitIntoSentences(fullArticleText);

      // Find which sentence matches our clicked text exactly
      let startSentenceIndex = 0;
      console.log('DEBUG: Total sentences in article:', allSentences.length);
      console.log('DEBUG: Looking for clicked sentence:', clickedText.trim());

      for (let i = 0; i < allSentences.length; i++) {
        const sentence = allSentences[i];
        console.log(`DEBUG: Sentence ${i + 1}: "${sentence.text.substring(0, 50)}..."`);

        // Check if this sentence contains or matches our clicked text
        if (sentence.text.trim() === clickedText.trim() ||
            sentence.text.includes(clickedText.trim()) ||
            clickedText.trim().includes(sentence.text.trim())) {
          startSentenceIndex = i;
          console.log(`DEBUG: MATCHED sentence ${i + 1}: "${sentence.text}"`);
          break;
        }
      }

      console.log(`DEBUG: FINAL SELECTED sentence index: ${startSentenceIndex}`);
      if (startSentenceIndex < allSentences.length) {
        console.log(`DEBUG: Will start reading from: "${allSentences[startSentenceIndex].text}"`);
      }

      // Return all text from this sentence to the end
      const remainingText = allSentences.slice(startSentenceIndex).map(s => s.text).join(' ');

      // Store reading info for progressive highlighting
      this.currentReadingInfo = {
        startSentenceIndex: startSentenceIndex,
        sentences: allSentences,
        fullArticleText: fullArticleText,
        clickedElement: clickedElement
      };

      return remainingText;

    } catch (error) {
      console.error('Error extracting article text:', error);
      // Fallback to old method
      return this.extractTextFromElement(event.target);
    }
  }

  getClickedSentenceText(event) {
    // Get the text of the sentence that was clicked using coordinates
    let range;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(event.clientX, event.clientY);
    } else if (document.caretPositionFromPoint) {
      const caretPos = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (caretPos) {
        range = document.createRange();
        range.setStart(caretPos.offsetNode, caretPos.offset);
      }
    }

    if (!range) return null;

    // Find the paragraph containing this click
    let paragraph = range.startContainer;
    while (paragraph && paragraph.nodeType === Node.TEXT_NODE) {
      paragraph = paragraph.parentElement;
    }
    while (paragraph && !paragraph.textContent.includes('.')) {
      paragraph = paragraph.parentElement;
      if (!paragraph || paragraph === document.body) break;
    }

    if (!paragraph) return null;

    // Get the clicked position within this paragraph
    const paragraphText = paragraph.textContent;
    const clickOffset = this.getTextOffset(paragraph, range.startContainer, range.startOffset);

    // Split paragraph into sentences and find the clicked one
    const sentences = this.splitIntoSentences(paragraphText);
    for (let sentence of sentences) {
      if (clickOffset >= sentence.start && clickOffset < sentence.end) {
        return sentence.text;
      }
    }

    return null;
  }

  setupFullArticleReading(fullArticleText) {
    if (!fullArticleText) {
      console.error('DEBUG: setupFullArticleReading called with null text');
      return '';
    }
    const allSentences = this.splitIntoSentences(fullArticleText);
    this.currentReadingInfo = {
      startSentenceIndex: 0,
      sentences: allSentences,
      fullArticleText: fullArticleText,
      clickedElement: document.body
    };
    return fullArticleText;
  }

  getTextOffset(container, textNode, offset) {
    let textOffset = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      if (node === textNode) {
        return textOffset + offset;
      }
      textOffset += node.textContent.length;
    }

    return textOffset;
  }

  splitIntoSentences(text) {
    if (!text || typeof text !== 'string') {
      console.error('splitIntoSentences called with invalid text:', text);
      return [];
    }

    const sentences = [];
    const sentenceRegex = /[.!?]+/g;
    let lastEnd = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentenceText = text.substring(lastEnd, match.index + match[0].length).trim();
      if (sentenceText.length > 0) {
        sentences.push({
          text: sentenceText,
          start: lastEnd,
          end: match.index + match[0].length
        });
      }
      lastEnd = match.index + match[0].length;
    }

    // Add remaining text as last sentence if it doesn't end with punctuation
    if (lastEnd < text.length) {
      const remainingText = text.substring(lastEnd).trim();
      if (remainingText.length > 0) {
        sentences.push({
          text: remainingText,
          start: lastEnd,
          end: text.length
        });
      }
    }

    return sentences;
  }

  extractTextFromElement(element) {
    // Find the text container
    let textContainer = element;
    while (textContainer && (!textContainer.textContent || textContainer.textContent.trim().length < 10)) {
      textContainer = textContainer.parentElement;
      if (!textContainer || textContainer === document.body) break;
    }

    if (!textContainer) return '';

    const fullText = textContainer.textContent;
    const clickedText = element.textContent || element.innerText || '';

    console.log('DEBUG: Full text:', fullText.substring(0, 100) + '...');
    console.log('DEBUG: Clicked text:', clickedText);

    if (!clickedText.trim()) return fullText;

    // Find the position of the clicked text within the full text
    const clickPosition = fullText.indexOf(clickedText.trim());
    console.log('DEBUG: Click position:', clickPosition);
    if (clickPosition === -1) return fullText;

    // Split into sentences with their positions
    const sentences = [];
    const sentenceRegex = /[.!?]+/g;
    let lastEnd = 0;
    let match;

    while ((match = sentenceRegex.exec(fullText)) !== null) {
      const sentenceText = fullText.substring(lastEnd, match.index + match[0].length).trim();
      if (sentenceText.length > 0) {
        sentences.push({
          text: sentenceText,
          start: lastEnd,
          end: match.index + match[0].length
        });
      }
      lastEnd = match.index + match[0].length;
    }

    // Add remaining text as last sentence if it doesn't end with punctuation
    if (lastEnd < fullText.length) {
      const remainingText = fullText.substring(lastEnd).trim();
      if (remainingText.length > 0) {
        sentences.push({
          text: remainingText,
          start: lastEnd,
          end: fullText.length
        });
      }
    }

    // Find which sentence contains the click position
    console.log('DEBUG: Sentences found:', sentences.length);
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      console.log(`DEBUG: Sentence ${i + 1}: "${sentence.text.substring(0, 50)}..." (pos: ${sentence.start}-${sentence.end})`);
      if (clickPosition >= sentence.start && clickPosition < sentence.end) {
        console.log(`DEBUG: Selected sentence ${i + 1}:`, sentence.text);
        return sentence.text;
      }
    }

    // Fallback: return first sentence
    console.log('DEBUG: No sentence found, using fallback');
    return sentences.length > 0 ? sentences[0].text : fullText;
  }

  startReading(text) {
    this.stopReading();

    if ('speechSynthesis' in window) {
      this.currentSpeech = new SpeechSynthesisUtterance(text);
      this.currentSpeech.rate = window.uiOverlay?.currentSpeed || 1.0;
      this.highlightPaused = false; // Reset pause state for new reading

      // Set up progressive highlighting
      this.setupProgressiveHighlighting();

      this.currentSpeech.onend = () => {
        this.currentSpeech = null;
        // Notify highlighter that reading ended naturally
        window.dispatchEvent(new CustomEvent('sr-reading-stopped'));
      };

      speechSynthesis.speak(this.currentSpeech);
    }
  }

  setupProgressiveHighlighting() {
    // Highlighting disabled for now - too buggy
    // The core speech functionality works perfectly
    console.log('DEBUG: Highlighting disabled - focusing on reliable speech functionality');
    this.highlightPaused = false;
  }

  updateSentenceHighlight(sentenceText) {
    // Disable sentence-level highlighting events for now
    // The element-level highlighting is already working
    console.log('DEBUG: Skipping sentence highlighting event (using element highlighting instead)');

    // Don't dispatch the sr-sentence-progress event that interferes with element highlighting
    // window.dispatchEvent(new CustomEvent('sr-sentence-progress', {
    //   detail: {
    //     sentenceText: sentenceText.trim(),
    //     fullArticleText: this.currentReadingInfo?.fullArticleText
    //   }
    // }));
  }

  stopReading() {
    if (this.currentSpeech) {
      speechSynthesis.cancel();
      this.currentSpeech = null;
    }

    // Notify highlighter that reading stopped
    window.dispatchEvent(new CustomEvent('sr-reading-stopped'));
  }

  togglePlayPause() {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      this.highlightPaused = false;
    } else if (speechSynthesis.speaking) {
      speechSynthesis.pause();
      this.highlightPaused = true;
    }
  }
}

// Initialize click handler
window.clickHandler = new ClickHandler();

// Listen for UI events
window.addEventListener('sr-toggle-play-pause', () => {
  window.clickHandler.togglePlayPause();
});

window.addEventListener('sr-stop', () => {
  window.clickHandler.stopReading();
});

window.addEventListener('sr-speed-change', () => {
  // Just update the speed setting for next utterance
  // Web Speech API doesn't support changing speed of active utterance
  // This is standard behavior - speed changes apply to next reading session
});