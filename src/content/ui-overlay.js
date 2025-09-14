// UI overlay for reading controls

class UIOverlay {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
    this.isReading = false;
    this.currentSpeed = 1.0;
  }

  create() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'screen-reader-overlay';
    this.overlay.innerHTML = `
      <div class="sr-controls">
        <button id="sr-play-pause" title="Play/Pause">⏯️</button>
        <input type="range" id="sr-speed" min="0.5" max="2" step="0.1" value="1" title="Speed">
        <span id="sr-speed-label">1.0x</span>
        <button id="sr-close" title="Close">✖️</button>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.attachEventListeners();
  }

  attachEventListeners() {
    const playPause = document.getElementById('sr-play-pause');
    const speed = document.getElementById('sr-speed');
    const close = document.getElementById('sr-close');

    playPause?.addEventListener('click', () => this.togglePlayPause());
    speed?.addEventListener('input', (e) => this.updateSpeed(e.target.value));
    close?.addEventListener('click', () => this.close());
  }

  show() {
    if (!this.overlay) this.create();
    this.overlay.style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    this.isVisible = false;
  }

  close() {
    // Close button: stop reading AND hide overlay
    window.dispatchEvent(new CustomEvent('sr-stop'));
    this.hide();
  }

  togglePlayPause() {
    this.isReading = !this.isReading;
    window.dispatchEvent(new CustomEvent('sr-toggle-play-pause', {
      detail: { isReading: this.isReading }
    }));
  }

  updateSpeed(speed) {
    this.currentSpeed = parseFloat(speed);
    const label = document.getElementById('sr-speed-label');
    if (label) {
      label.textContent = `${speed}x`;
    }
    window.dispatchEvent(new CustomEvent('sr-speed-change', {
      detail: { speed: this.currentSpeed }
    }));
  }
}

// Initialize overlay
window.uiOverlay = new UIOverlay();