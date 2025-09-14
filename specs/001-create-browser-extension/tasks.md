# Tasks: Browser Screen Reader Extension

**Input**: Design documents from `/specs/001-create-a-browser/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: JavaScript ES2022, Manifest V3, Web Speech API
   → Structure: Browser extension with content/background/popup
2. Load optional design documents ✓:
   → data-model.md: AudioSession, TextContent, UserPreferences → model tasks
   → contracts/: content-script-api.md, background-api.md → contract test tasks
   → research.md: Web Speech API, Readability.js → setup tasks
3. Generate tasks by category ✓:
   → Setup: extension manifest, dependencies, build system
   → Tests: contract tests, integration tests
   → Core: text extraction, speech control, UI overlay
   → Integration: cross-browser, session management
   → Polish: performance, accessibility, documentation
4. Apply task rules ✓:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓:
   → All contracts have tests ✓
   → All entities have models ✓
   → All core functionality implemented ✓
9. Return: SUCCESS (tasks ready for execution) ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Browser Extension Structure**: `src/` at repository root with extension-specific subdirectories
- **Testing**: `tests/` with contract, integration, and unit subdirectories

## Phase 3.1: Setup

- [ ] T001 Create browser extension project structure with src/, tests/ directories
- [ ] T002 Create extension manifest.json with Manifest V3 configuration for Chrome/Firefox compatibility
- [ ] T003 [P] Initialize package.json with Jest testing framework and development dependencies
- [ ] T004 [P] Configure ESLint and Prettier for JavaScript code formatting
- [ ] T005 [P] Set up Jest configuration for browser extension testing environment

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T006 [P] Contract test extractArticleText() API in tests/contract/test_content_script_extraction.js
- [ ] T007 [P] Contract test createOverlay() API in tests/contract/test_content_script_overlay.js
- [ ] T008 [P] Contract test highlightWord() API in tests/contract/test_content_script_highlight.js
- [ ] T009 [P] Contract test startSpeech() API in tests/contract/test_background_speech.js
- [ ] T010 [P] Contract test pauseSpeech() API in tests/contract/test_background_pause.js
- [ ] T011 [P] Contract test setSpeed() API in tests/contract/test_background_speed.js
- [ ] T012 [P] Contract test session management APIs in tests/contract/test_background_session.js

### Integration Tests
- [ ] T013 [P] Integration test click-to-start reading scenario in tests/integration/test_click_reading.js
- [ ] T014 [P] Integration test playback controls scenario in tests/integration/test_playback_controls.js
- [ ] T015 [P] Integration test speed adjustment scenario in tests/integration/test_speed_control.js
- [ ] T016 [P] Integration test pause/resume scenario in tests/integration/test_pause_resume.js
- [ ] T017 [P] Integration test cross-browser compatibility in tests/integration/test_cross_browser.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models
- [ ] T018 [P] AudioSession model in src/lib/models/AudioSession.js
- [ ] T019 [P] TextContent model in src/lib/models/TextContent.js
- [ ] T020 [P] UserPreferences model in src/lib/models/UserPreferences.js

### Content Script Components
- [ ] T021 [P] Text extractor with Readability algorithm in src/content/text-extractor.js
- [ ] T022 [P] UI overlay creation and management in src/content/ui-overlay.js
- [ ] T023 [P] Click handler for word selection in src/content/click-handler.js
- [ ] T024 Text highlighting functionality in src/content/text-highlighter.js
- [ ] T025 Content script main coordinator in src/content/content-script.js

### Background Script Components
- [ ] T026 [P] Speech synthesis controller in src/background/speech-controller.js
- [ ] T027 [P] Session state manager in src/background/session-manager.js
- [ ] T028 [P] User preferences storage in src/background/storage-manager.js
- [ ] T029 Voice selection and management in src/background/voice-manager.js
- [ ] T030 Background script main service worker in src/background/background.js

### Popup Interface
- [ ] T031 [P] Popup HTML structure in src/popup/popup.html
- [ ] T032 [P] Popup JavaScript functionality in src/popup/popup.js
- [ ] T033 [P] Popup CSS styling in src/popup/popup.css

### Shared Utilities
- [ ] T034 [P] Extension storage utilities in src/lib/storage.js
- [ ] T035 [P] Common utility functions in src/lib/utils.js
- [ ] T036 [P] Message passing utilities in src/lib/messaging.js

## Phase 3.4: Integration

- [ ] T037 Connect content script to background script messaging
- [ ] T038 Implement cross-browser API compatibility layer
- [ ] T039 Add error handling and logging throughout extension
- [ ] T040 Implement user preference persistence and loading
- [ ] T041 Add content security policy and security hardening
- [ ] T042 Implement tab management and cleanup

## Phase 3.5: Polish

- [ ] T043 [P] Unit tests for text extraction logic in tests/unit/test_text_extraction.js
- [ ] T044 [P] Unit tests for speech controller in tests/unit/test_speech_controller.js
- [ ] T045 [P] Unit tests for session management in tests/unit/test_session_manager.js
- [ ] T046 [P] Performance tests for large article handling in tests/performance/test_large_articles.js
- [ ] T047 [P] Accessibility tests for screen reader compatibility in tests/accessibility/test_a11y.js
- [ ] T048 [P] Update README.md with installation and usage instructions
- [ ] T049 [P] Create user documentation in docs/user-guide.md
- [ ] T050 Cross-browser testing and compatibility validation
- [ ] T051 Performance optimization and memory usage validation
- [ ] T052 Execute quickstart.md integration scenarios for final validation

## Dependencies

**Phase Dependencies**:
- Setup (T001-T005) before all other phases
- Tests (T006-T017) before implementation (T018-T042)
- Core implementation (T018-T036) before integration (T037-T042)
- Integration (T037-T042) before polish (T043-T052)

**Specific Dependencies**:
- T018-T020 (models) before T026-T030 (background services)
- T021-T024 (content components) before T025 (content coordinator)
- T026-T029 (background components) before T030 (background coordinator)
- T034-T036 (utilities) support all implementation tasks
- T037-T042 (integration) require all core components complete
- T050-T052 (final validation) require all previous tasks complete

## Parallel Execution Examples

### Setup Phase (can run in parallel):
```bash
# Launch T003-T005 together:
Task: "Initialize package.json with Jest testing framework"
Task: "Configure ESLint and Prettier for JavaScript code formatting"
Task: "Set up Jest configuration for browser extension testing environment"
```

### Contract Tests (can run in parallel):
```bash
# Launch T006-T012 together:
Task: "Contract test extractArticleText() API in tests/contract/test_content_script_extraction.js"
Task: "Contract test createOverlay() API in tests/contract/test_content_script_overlay.js"
Task: "Contract test highlightWord() API in tests/contract/test_content_script_highlight.js"
Task: "Contract test startSpeech() API in tests/contract/test_background_speech.js"
Task: "Contract test pauseSpeech() API in tests/contract/test_background_pause.js"
Task: "Contract test setSpeed() API in tests/contract/test_background_speed.js"
Task: "Contract test session management APIs in tests/contract/test_background_session.js"
```

### Integration Tests (can run in parallel):
```bash
# Launch T013-T017 together:
Task: "Integration test click-to-start reading scenario in tests/integration/test_click_reading.js"
Task: "Integration test playback controls scenario in tests/integration/test_playback_controls.js"
Task: "Integration test speed adjustment scenario in tests/integration/test_speed_control.js"
Task: "Integration test pause/resume scenario in tests/integration/test_pause_resume.js"
Task: "Integration test cross-browser compatibility in tests/integration/test_cross_browser.js"
```

### Core Models (can run in parallel):
```bash
# Launch T018-T020 together:
Task: "AudioSession model in src/lib/models/AudioSession.js"
Task: "TextContent model in src/lib/models/TextContent.js"
Task: "UserPreferences model in src/lib/models/UserPreferences.js"
```

### Content Script Components (can run in parallel):
```bash
# Launch T021-T023 together:
Task: "Text extractor with Readability algorithm in src/content/text-extractor.js"
Task: "UI overlay creation and management in src/content/ui-overlay.js"
Task: "Click handler for word selection in src/content/click-handler.js"
```

### Background Script Components (can run in parallel):
```bash
# Launch T026-T028 together:
Task: "Speech synthesis controller in src/background/speech-controller.js"
Task: "Session state manager in src/background/session-manager.js"
Task: "User preferences storage in src/background/storage-manager.js"
```

## Notes

- **[P] tasks** = different files, no dependencies between them
- **Verify tests fail** before implementing corresponding functionality
- **Commit after each task** to maintain development history
- **TDD strictly enforced**: No implementation without failing tests first
- **Cross-browser testing** required for Chrome and Firefox compatibility
- **Performance targets**: <500ms speech start, <2s text extraction
- **Memory limits**: <50MB per article, clean session management

## Task Generation Rules Applied

1. **From Contracts**:
   - content-script-api.md → T006-T008 (content script contract tests)
   - background-api.md → T009-T012 (background script contract tests)

2. **From Data Model**:
   - AudioSession → T018 (model creation)
   - TextContent → T019 (model creation)
   - UserPreferences → T020 (model creation)

3. **From User Stories**:
   - Click-to-start reading → T013 (integration test)
   - Playback controls → T014 (integration test)
   - Speed adjustment → T015 (integration test)
   - Pause/resume → T016 (integration test)
   - Cross-browser support → T017 (integration test)

4. **Ordering Applied**:
   - Setup → Tests → Models → Services → Integration → Polish
   - Dependencies properly sequenced
   - Parallel execution maximized where safe

## Validation Checklist ✓

- [x] All contracts have corresponding tests (T006-T012)
- [x] All entities have model tasks (T018-T020)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (tests must fail before implementation)
- [x] Constitutional principles followed (library-first, testing-first)
- [x] Performance and quality requirements included
- [x] Cross-browser compatibility addressed

**Total Tasks**: 52 numbered tasks with clear dependencies and parallel execution opportunities.
**Estimated Timeline**: 3-4 weeks for full implementation with proper TDD workflow.
**Ready for Execution**: All prerequisites met, tests defined, implementation path clear.