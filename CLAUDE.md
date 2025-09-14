# Claude Code Agent Context

**Project**: Browser Screen Reader Extension (imnotareader)
**Last Updated**: 2025-09-13
**Version**: 1.0.0

## Project Overview

This is a browser extension for Chrome and Firefox that reads web articles aloud using text-to-speech. Users can click anywhere in an article to start reading from that position, control playback speed, and pause/resume. The extension intelligently extracts article content while avoiding ads and navigation elements.

## Current Development Phase

**Active Feature**: 001-create-browser-extension (Browser Screen Reader Extension)
**Phase**: Completed Implementation
**Branch**: `001-create-browser-extension`

**Completed**:
- ✅ Feature specification (spec.md)
- ✅ Implementation plan (plan.md)
- ✅ Research phase (research.md)
- ✅ Data model design (data-model.md)
- ✅ API contracts (contracts/)
- ✅ Integration scenarios (quickstart.md)

**Next Steps**:
- Use `/tasks` command to generate task list
- Implement TDD workflow (tests first, then code)
- Follow constitutional principles for development

## Technology Stack

**Core Technologies**:
- JavaScript ES2022
- Chrome Extension Manifest V3 (with V2 Firefox fallback)
- Web Speech API (SpeechSynthesis)
- Readability.js algorithm for text extraction

**Testing**:
- Jest for unit testing
- WebDriver for extension integration testing
- Manual testing across Chrome and Firefox

**Build Tools**:
- TBD - Will be determined during task generation

## Architecture

**Extension Structure**:
```
src/
├── manifest.json          # Extension manifest
├── content/              # Content scripts
│   ├── text-extractor.js # Article text extraction
│   ├── ui-overlay.js     # Reading controls overlay
│   └── click-handler.js  # Click-to-read functionality
├── background/           # Background service worker
│   ├── speech-controller.js # TTS management
│   └── session-manager.js   # State management
├── popup/               # Extension popup
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── lib/                # Shared utilities
    ├── storage.js
    └── utils.js
```

**Key Components**:
- **text-extractor**: Uses Readability algorithm to extract clean article text
- **speech-controller**: Manages Web Speech API for text-to-speech
- **ui-controller**: Handles overlay UI and user interactions
- **session-manager**: Tracks reading state and user preferences

## Development Standards

**Constitutional Requirements**:
- TDD mandatory: Tests written → User approved → Tests fail → Then implement
- Library-first approach: Each component as reusable library
- Simplicity: Direct API usage, no unnecessary abstractions
- Observability: Structured logging throughout

**Code Quality**:
- All APIs defined by contracts in `/contracts/`
- Cross-browser compatibility (Chrome 88+, Firefox 109+)
- Performance targets: <500ms speech start, <2s text extraction
- Memory limit: <50MB per article, <10 concurrent sessions

## Key Requirements

**Functional**:
- Extract article text from any webpage
- Convert text to high-quality speech
- Click-to-start reading from any word
- Play/pause/speed controls
- Cross-browser compatibility (Chrome/Firefox)

**Technical**:
- No external servers (offline capable)
- Manifest V3 architecture
- Real-time speed adjustment
- Position tracking and word highlighting
- Privacy-focused (no data collection)

**Performance**:
- Article extraction: <2s for 10k words
- Speech start: <500ms
- Control response: <100ms
- Memory efficient: <50MB per session

## Recent Changes

1. **2025-09-13**: Initial project setup and specification
   - Created feature specification with user requirements
   - Researched technical approaches for TTS and text extraction
   - Designed data model for sessions, content, and preferences
   - Defined API contracts for content script and background script

## Testing Strategy

**TDD Workflow**:
1. Write contract tests based on API specifications
2. Ensure tests fail (RED phase)
3. Implement minimum code to pass (GREEN phase)
4. Refactor for quality (REFACTOR phase)

**Test Types**:
- Contract tests: API interface validation
- Integration tests: Cross-component functionality
- E2E tests: Full user scenarios via WebDriver
- Unit tests: Individual component logic

**Test Priority Order**:
1. Contract tests (API interfaces)
2. Integration tests (component interaction)
3. E2E tests (user scenarios)
4. Unit tests (implementation details)

## Browser Extension Specifics

**Manifest V3 Considerations**:
- Service worker instead of background page
- Limited `eval()` usage - no dynamic code execution
- Content Security Policy restrictions
- Host permissions for content script injection

**Cross-Browser Support**:
- Chrome: Full Manifest V3 support
- Firefox: Manifest V3 with V2 fallbacks where needed
- Feature detection for browser-specific APIs
- Shared codebase with conditional feature loading

**Extension APIs Used**:
- `chrome.runtime` - Messaging between components
- `chrome.storage` - Preferences and session persistence
- `chrome.tabs` - Tab management and state tracking
- `chrome.scripting` - Content script injection
- Web Speech API - Text-to-speech synthesis

## Security Considerations

**Content Security Policy**:
- No inline scripts or styles
- No `eval()` or `Function()` constructors
- Safe DOM manipulation only
- Isolated content script execution

**Privacy**:
- No external network requests
- All processing client-side only
- User preferences stored locally
- No analytics or telemetry

**Permissions**:
- `activeTab` - Access to current tab content
- `storage` - User preferences persistence
- `scripting` - Content script injection

## Development Workflow

**Branch Management**:
- Feature branches: `###-feature-name` format
- Main branch: stable releases only
- All development on feature branches

**Git Workflow**:
- Tests committed before implementation
- Constitutional compliance verified
- Performance benchmarks validated
- Cross-browser testing completed

**Quality Gates**:
- All contract tests passing
- Integration scenarios validated
- Performance benchmarks met
- Security review completed
- Cross-browser compatibility verified

## Current Blockers/Dependencies

**None** - Ready to proceed with task generation using `/tasks` command.

## Files to Reference

**Specifications**:
- `/specs/001-create-browser-extension/spec.md` - Feature requirements
- `/specs/001-create-browser-extension/plan.md` - Implementation plan
- `/specs/001-create-browser-extension/data-model.md` - Data structure design

**API Contracts**:
- `/specs/001-create-browser-extension/contracts/content-script-api.md`
- `/specs/001-create-browser-extension/contracts/background-api.md`

**Testing**:
- `/specs/001-create-browser-extension/quickstart.md` - Integration test scenarios

**Constitution**:
- `/.specify/memory/constitution.md` - Development principles

## Command Usage

- Use `/tasks` to generate implementation task list
- Follow TDD: `/tasks` → implement tests → implement code
- Reference contracts for API specifications
- Use quickstart.md for integration testing scenarios

---

*This context is automatically maintained. Manual edits between `<!-- MANUAL_SECTION_START -->` and `<!-- MANUAL_SECTION_END -->` markers will be preserved during updates.*