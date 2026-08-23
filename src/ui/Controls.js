/**
 * Controls — view mode buttons & tent isolation toggle wiring.
 */
export class Controls {
  constructor(cameraManager, svgOverlay, onModeChange, onTentChange) {
    this.cameraManager = cameraManager;
    this.svgOverlay = svgOverlay;
    this.onModeChange = onModeChange;
    this.onTentChange = onTentChange;
    
    this.currentMode = 'perspective';
    this.currentTent = 'all';

    this._init();
  }

  _init() {
    // 1. View Mode Buttons
    const viewButtons = document.querySelectorAll('.view-btn[data-mode]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setMode(mode);
      });
    });

    // 2. Tent Selector Buttons
    const tentButtons = document.querySelectorAll('.tent-btn[data-tent]');
    tentButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tent = btn.getAttribute('data-tent');
        this.setTent(tent);
      });
    });
  }

  setMode(mode) {
    this.currentMode = mode;

    const buttons = document.querySelectorAll('.view-btn[data-mode]');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    if (mode === '2d') {
      this.svgOverlay.show();
      this.cameraManager.pauseAutoRotate();

      const helpTip = document.getElementById('help-tip');
      if (helpTip) helpTip.classList.add('hidden');
    } else {
      this.svgOverlay.hide();
      this.cameraManager.setMode(mode);
    }

    if (this.onModeChange) {
      this.onModeChange(mode);
    }
  }

  setTent(tent) {
    this.currentTent = tent;

    const buttons = document.querySelectorAll('.tent-btn[data-tent]');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tent') === tent);
    });

    if (this.onTentChange) {
      this.onTentChange(tent);
    }
  }

  getMode() {
    return this.currentMode;
  }

  getTent() {
    return this.currentTent;
  }
}
