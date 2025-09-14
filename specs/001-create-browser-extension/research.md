# Research: Browser Screen Reader Extension

**Feature**: Browser extension for Chrome and Firefox that reads web articles aloud
**Date**: 2025-09-13
**Status**: Complete

## Research Summary

This research phase evaluated technical approaches for implementing a cross-browser text-to-speech extension with intelligent article detection and user controls.

## Text-to-Speech Technologies

**Decision**: Web Speech API (SpeechSynthesis interface)

**Rationale**:
- Native browser support in all modern browsers
- No external dependencies or API keys required
- Offline capability - works without internet connection
- High-quality voices available on most platforms
- Real-time speed adjustment support
- Built-in pause/resume functionality

**Alternatives considered**:
- **Amazon Polly**: Rejected due to network dependency, API costs, and complexity
- **Google Cloud TTS**: Rejected due to external service requirement and latency
- **ElevenLabs API**: Rejected due to cost and external dependency
- **Microsoft Speech Platform**: Rejected due to Windows-only limitation

**Implementation notes**:
- Use `speechSynthesis.speak()` for text conversion
- Leverage `speechSynthesis.pause()` and `speechSynthesis.resume()` for controls
- Utilize `SpeechSynthesisUtterance.rate` property for speed adjustment
- Handle cross-browser voice availability differences

## Article Text Extraction

**Decision**: Readability.js algorithm implementation

**Rationale**:
- Proven algorithm used by Firefox Reader Mode and Pocket
- Effectively removes ads, navigation, and page chrome
- Handles diverse website structures and layouts
- Lightweight and performant
- Open source with Mozilla Public License

**Alternatives considered**:
- **Manual DOM parsing**: Rejected due to complexity and unreliability
- **Mercury Parser**: Rejected due to service shutdown and maintenance concerns
- **Boilerpipe**: Rejected due to Java dependency and complexity
- **Newspaper3k**: Rejected due to Python dependency in browser context

**Implementation notes**:
- Port core Readability.js logic to extension content script
- Focus on article content detection via semantic HTML analysis
- Implement fallback to full page text if article detection fails
- Handle dynamic content loading with MutationObserver

## Cross-Browser Extension Architecture

**Decision**: Manifest V3 with V2 fallback for Firefox compatibility

**Rationale**:
- Manifest V3 is the future standard for Chrome extensions
- Firefox still supports Manifest V2 and has partial V3 support
- Service worker architecture provides better performance
- Allows for shared codebase with conditional features

**Alternatives considered**:
- **Manifest V2 only**: Rejected due to Chrome deprecation timeline
- **Manifest V3 only**: Rejected due to Firefox compatibility issues
- **Separate extensions**: Rejected due to maintenance overhead

**Implementation notes**:
- Use feature detection for API availability
- Implement service worker for background processing
- Use content scripts for page interaction
- Store preferences in extension storage API

## User Interface Integration

**Decision**: Floating overlay with minimal popup interface

**Rationale**:
- Direct integration with page content provides better UX
- Non-disruptive to original page layout
- Always visible controls during reading
- Familiar paradigm from video players and other media tools

**Alternatives considered**:
- **Sidebar approach**: Rejected due to space constraints and layout disruption
- **Full popup interface**: Rejected due to poor visibility and interaction
- **Browser toolbar only**: Rejected due to limited control space
- **Context menu only**: Rejected due to poor discoverability

**Implementation notes**:
- Create fixed-position overlay with z-index management
- Implement draggable positioning for user preference
- Use shadow DOM to prevent style conflicts
- Provide collapse/expand functionality

## Performance and Memory Considerations

**Decision**: Chunked text processing with lazy loading

**Rationale**:
- Large articles can overwhelm speech synthesis
- Memory usage needs to be controlled
- Better user experience with faster startup
- Allows for position tracking and navigation

**Alternatives considered**:
- **Full article pre-processing**: Rejected due to memory concerns
- **Sentence-by-sentence processing**: Rejected due to overhead
- **Word-level processing**: Rejected due to excessive complexity

**Implementation notes**:
- Process text in 500-word chunks
- Implement read-ahead buffering
- Track position at sentence boundaries
- Use web workers for text processing if needed

## Cross-Browser Compatibility Strategy

**Decision**: Progressive enhancement with feature detection

**Rationale**:
- Different browsers have varying Speech API implementations
- Voice availability differs between platforms
- Extension APIs have subtle differences
- Need graceful degradation for unsupported features

**Implementation approach**:
- Detect Speech API availability on startup
- Provide fallback messaging for unsupported browsers
- Test voice availability and quality
- Handle browser-specific quirks in voice selection

## Security and Privacy Considerations

**Decision**: Client-side only processing with minimal permissions

**Rationale**:
- No external services protects user privacy
- Minimal permission scope reduces security concerns
- Offline capability provides data security
- Local processing prevents content leakage

**Implementation notes**:
- Request only `activeTab` permission
- No network requests to external services
- Store preferences locally only
- Clear audio data after use

## Development and Testing Strategy

**Decision**: Jest for unit testing, WebDriver for integration testing

**Rationale**:
- Jest provides excellent JavaScript testing framework
- WebDriver enables real browser testing for extensions
- Can test both Chrome and Firefox with same framework
- Supports async testing patterns needed for Speech API

**Testing approach**:
- Unit tests for text processing logic
- Integration tests for browser API interactions
- Cross-browser compatibility testing
- Performance testing with large articles

## Research Conclusions

All technical uncertainties have been resolved with practical, implementable solutions. The chosen technologies provide a solid foundation for building a reliable, performant, and user-friendly screen reader extension that works across major browsers while maintaining privacy and offline capability.

**Next Phase**: Ready for design and contract definition (Phase 1)