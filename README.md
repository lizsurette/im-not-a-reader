# Screen Reader Extension

A browser extension that reads web articles aloud with high-quality text-to-speech. Click anywhere in an article to start reading from that position, with full playback controls.

## Features

- **Click-to-Read**: Click anywhere in article text to start reading from that sentence
- **High-Quality Speech**: Uses browser's built-in text-to-speech with natural voices
- **Playback Controls**: Play, pause, and speed adjustment via floating controls
- **Smart Text Extraction**: Intelligently extracts article content while avoiding ads and navigation
- **Cross-Browser**: Works in Chrome and Firefox
- **Privacy-Focused**: No external servers, all processing happens locally

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `src` folder
5. The extension icon will appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the `src` folder and select `manifest.json`

## Usage

1. **Enable the Extension**: Click the extension icon in your browser toolbar to enable
2. **Start Reading**: Click anywhere in article text to begin reading from that sentence
3. **Control Playback**: Use the floating controls to:
   - Pause/Resume reading
   - Adjust reading speed
   - Stop reading
4. **Disable**: Click the extension icon again to disable

## How It Works

The extension uses:
- **Readability Algorithm**: Extracts clean article text from web pages
- **Web Speech API**: Converts text to high-quality speech
- **DOM Analysis**: Finds the exact sentence you clicked on
- **Progressive Reading**: Continues reading from your selected starting point

## Browser Compatibility

- **Chrome**: Version 88+ (full Manifest V3 support)
- **Firefox**: Version 109+ (with Manifest V3/V2 compatibility)

## Privacy

- **No Data Collection**: Extension doesn't collect or transmit any user data
- **Local Processing**: All text extraction and speech synthesis happens locally
- **No Network Requests**: Extension works completely offline after installation

## Development

### Project Structure

```
src/
├── manifest.json           # Extension configuration
├── background/
│   └── background.js       # Extension background script
├── content/
│   ├── content-script.js   # Main content script coordinator
│   ├── click-handler.js    # Click-to-read functionality
│   ├── text-extractor.js   # Article text extraction
│   ├── text-highlighter.js # Visual highlighting (disabled)
│   └── ui-overlay.js       # Playback controls overlay
├── lib/
│   ├── messaging.js        # Cross-component messaging
│   ├── utils.js           # Shared utilities
│   └── models/            # Data models
└── popup/                 # Unused (direct toggle implementation)
```

### Key Components

- **TextExtractor**: Extracts clean article text using Readability algorithm
- **ClickHandler**: Handles click-to-read functionality and speech synthesis
- **UIOverlay**: Provides floating playback controls
- **Background Script**: Manages extension state and browser action

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in both Chrome and Firefox
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Troubleshooting

### Extension icon not showing
- Make sure you're in "Developer mode" (Chrome) or using "Load Temporary Add-on" (Firefox)
- Try refreshing the extensions page

### Speech not working
- Check that your browser supports the Web Speech API
- Ensure your system has text-to-speech voices installed
- Try refreshing the page and re-enabling the extension

### Text extraction issues
- The extension works best on article pages (news sites, blogs, etc.)
- Some sites with complex layouts may not extract text perfectly
- Try clicking directly on paragraph text rather than headers or navigation

## Version History

### v1.0.0
- Initial release
- Click-to-read functionality
- Browser action toggle
- Playback controls
- Smart text extraction