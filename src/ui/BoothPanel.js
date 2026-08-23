/**
 * BoothPanel — slide-in sidebar showing comprehensive booth details:
 * Stand #, Pavilion, Zone, Size, Rate (USD), and Reserve/Unreserve action.
 */
export class BoothPanel {
  constructor(onReserve) {
    this.panelEl = document.getElementById('booth-panel');
    this.titleEl = document.getElementById('panel-title');
    this.zoneEl = document.getElementById('panel-zone');
    this.sizeEl = document.getElementById('panel-size');
    this.statusEl = document.getElementById('panel-status');
    this.reserveBtn = document.getElementById('panel-reserve');
    this.closeBtn = document.getElementById('panel-close');

    this.currentBoothId = null;
    this._onReserve = onReserve;

    this._init();
  }

  _init() {
    this.closeBtn.addEventListener('click', () => this.hide());

    this.reserveBtn.addEventListener('click', () => {
      if (this.currentBoothId !== null && this._onReserve) {
        this._onReserve(this.currentBoothId);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  show(booth) {
    this.currentBoothId = booth.id;

    this.titleEl.textContent = `Stand #${booth.id}`;
    
    // Detailed zone & pavilion
    const pavilionName = booth.tent === 'tent-b' ? 'Pavilion B (Innovation)' : 'Pavilion A (Main Hall)';
    this.zoneEl.textContent = `${booth.zone} · ${pavilionName}`;
    this.sizeEl.textContent = `${booth.w}m × ${booth.h}m (${(booth.w * booth.h).toFixed(1)} sqm)`;

    // Display Rate
    let rateEl = document.getElementById('panel-rate');
    if (!rateEl) {
      const infoContainer = document.querySelector('.panel-info');
      if (infoContainer) {
        const rateRow = document.createElement('div');
        rateRow.className = 'info-row';
        rateRow.innerHTML = `
          <span class="info-label">Investment</span>
          <span class="info-value rate-highlight" id="panel-rate">${booth.rate || 'USD 3,200'}</span>
        `;
        infoContainer.insertBefore(rateRow, infoContainer.lastElementChild);
      }
    } else {
      rateEl.textContent = booth.rate || 'USD 3,200';
    }

    this._updateStatus(booth.status);

    this.panelEl.classList.remove('hidden');
    this.panelEl.classList.add('visible');
  }

  hide() {
    this.currentBoothId = null;
    this.panelEl.classList.remove('visible');
    this.panelEl.classList.add('hidden');
  }

  updateStatus(status) {
    this._updateStatus(status);
  }

  _updateStatus(status) {
    const badge = this.statusEl.querySelector('.status-badge') ||
                  document.createElement('span');
    badge.className = `status-badge ${status}`;
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);

    if (!this.statusEl.contains(badge)) {
      this.statusEl.innerHTML = '';
      this.statusEl.appendChild(badge);
    }

    if (status === 'selected') {
      this.reserveBtn.textContent = 'Cancel Stand Selection';
      this.reserveBtn.classList.add('unreserve');
    } else {
      this.reserveBtn.textContent = 'Reserve This Stand';
      this.reserveBtn.classList.remove('unreserve');
    }
  }

  isVisible() {
    return this.panelEl.classList.contains('visible');
  }
}
