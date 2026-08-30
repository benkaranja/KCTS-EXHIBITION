/**
 * BoothPanel — slide-in sidebar showing comprehensive booth details:
 * Stand #, Pavilion, Zone, Size, Dual Rate (USD & KES in two distinct styled lines),
 * and Reserve/Unreserve action.
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

    // Display Dual Currency Rate: USD and KES in TWO DISTINCT LINES
    const { usdText, kesText } = this._calculateDualCurrency(booth.rate);
    const rateEl = document.getElementById('panel-rate');
    if (rateEl) {
      rateEl.innerHTML = `
        <span class="rate-usd-val">${usdText}</span>
        <span class="rate-kes-val">${kesText}</span>
      `;
    }

    this._updateStatus(booth.status);

    this.panelEl.classList.remove('hidden');
    this.panelEl.classList.add('visible');
  }

  _calculateDualCurrency(usdString) {
    if (!usdString) return { usdText: 'USD 3,200', kesText: 'KES 416,000' };

    const match = usdString.replace(/,/g, '').match(/\d+/);
    if (!match) return { usdText: usdString, kesText: '' };

    const usdVal = parseInt(match[0], 10);
    const kesVal = usdVal * 130; // 1 USD = 130 KES

    return {
      usdText: `USD ${usdVal.toLocaleString()}`,
      kesText: `KES ${kesVal.toLocaleString()}`
    };
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
