/**
 * SVGOverlay — generates an inline SVG floor plan for Kenya-China Tea Summit 2027.
 * Supports Pavilion A (Main Tent) and Pavilion B (Innovation Tent) with
 * filter tabs, real DOM nodes, accessible focus, color-based selection,
 * and high-contrast legend labels without circular selector rings.
 */

const BRAND_COLORS = {
  available:       '#2E8B57', // Sea green / Tea leaf
  available_hover: '#3DA86D',
  selected:        '#E67E22', // Amber / Gold selected
  selected_hover:  '#F39C12',
  reserved:        '#607274',
  reserved_hover:  '#7A8D90',
  vip:             '#184E33',
  gold_border:     '#D4AF37'
};

export class SVGOverlay {
  constructor(container, booths, venueWidth, venueLength) {
    this.container = container;
    this.booths = booths;
    this.venueWidth = venueWidth;
    this.venueLength = venueLength;
    this._clickCallback = null;
    this._boothElements = new Map();
    this.activeFilter = 'all'; // 'all' | 'tent-a' | 'tent-b'

    this._renderUI();
  }

  _renderUI() {
    this.container.innerHTML = `
      <div class="svg-modal-wrapper">
        <div class="svg-header-bar">
          <div class="svg-title-area">
            <div>
              <span class="summit-pill">2D MASTER FLOOR PLAN & BOOTH RESERVATION</span>
              <h2>CLICK TO MAKE BOOTH RESERVATION</h2>
            </div>
          </div>
          <div class="svg-tabs">
            <button class="svg-tab active" data-filter="all">All Tents (254)</button>
            <button class="svg-tab" data-filter="tent-a">Tent A · Main Hall (146)</button>
            <button class="svg-tab" data-filter="tent-b">Tent B · Innovation (108)</button>
          </div>
        </div>
        <div class="svg-viewport" id="svg-viewport-target"></div>
      </div>
    `;

    // Filter tab clicks
    const tabs = this.container.querySelectorAll('.svg-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.getAttribute('data-filter');
        this.generateSVG();
      });
    });

    this.generateSVG();
  }

  generateSVG() {
    const target = this.container.querySelector('#svg-viewport-target');
    if (!target) return;

    this._boothElements.clear();

    const padding = 6;
    let minX = 0, maxX = 98, minY = 2, maxY = 88;

    if (this.activeFilter === 'tent-a') {
      minY = 46;
      maxY = 86;
    } else if (this.activeFilter === 'tent-b') {
      minY = 5;
      maxY = 45;
    }

    const viewBoxW = (maxX - minX) + padding * 2;
    const viewBoxH = (maxY - minY) + padding * 2;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${viewBoxW} ${viewBoxH}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Interactive Exhibition Floor Plan');

    // Add Defs for selection drop shadow glow
    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = `
      <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    // 1. Background Ground
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('x', minX - padding);
    bg.setAttribute('y', minY - padding);
    bg.setAttribute('width', viewBoxW);
    bg.setAttribute('height', viewBoxH);
    bg.setAttribute('fill', '#0E2319');
    svg.appendChild(bg);

    // 2. Plaza Pavement
    const plaza = document.createElementNS(svgNS, 'rect');
    plaza.setAttribute('x', minX - 2);
    plaza.setAttribute('y', minY - 1);
    plaza.setAttribute('width', maxX - minX + 4);
    plaza.setAttribute('height', maxY - minY + 2);
    plaza.setAttribute('fill', '#E7ECE9');
    plaza.setAttribute('rx', '1.5');
    svg.appendChild(plaza);

    // 3. Render Tent B (Innovation Hall - North Tent: Y 10 to 40)
    if (this.activeFilter === 'all' || this.activeFilter === 'tent-b') {
      this._renderTentOutline(svg, svgNS, 5, 10, 85, 30, 'TENT B — TEA INNOVATION & B2B MATCHMAKING (30M × 85M)');
    }

    // 4. Render Tent A (Main Exhibition Hall - South Tent: Y 50 to 80)
    if (this.activeFilter === 'all' || this.activeFilter === 'tent-a') {
      this._renderTentOutline(svg, svgNS, 5, 50, 85, 30, 'TENT A — MAIN EXHIBITION HALL (30M × 85M)');
    }

    // Central Walkways & Outdoor Lounge in 'all' view
    if (this.activeFilter === 'all') {
      // Connecting Walkway 1 (X = 40 to 45)
      const w1 = document.createElementNS(svgNS, 'rect');
      w1.setAttribute('x', '40');
      w1.setAttribute('y', '40');
      w1.setAttribute('width', '5');
      w1.setAttribute('height', '10');
      w1.setAttribute('fill', '#DCE8E0');
      w1.setAttribute('stroke', '#1E5E3A');
      w1.setAttribute('stroke-width', '0.2');
      w1.setAttribute('stroke-dasharray', '0.8,0.5');
      svg.appendChild(w1);

      // Connecting Walkway 2 (X = 71 to 76)
      const w2 = document.createElementNS(svgNS, 'rect');
      w2.setAttribute('x', '71');
      w2.setAttribute('y', '40');
      w2.setAttribute('width', '5');
      w2.setAttribute('height', '10');
      w2.setAttribute('fill', '#DCE8E0');
      w2.setAttribute('stroke', '#1E5E3A');
      w2.setAttribute('stroke-width', '0.2');
      w2.setAttribute('stroke-dasharray', '0.8,0.5');
      svg.appendChild(w2);

      // Outdoor Lounge Deck
      const lounge = document.createElementNS(svgNS, 'rect');
      lounge.setAttribute('x', '48');
      lounge.setAttribute('y', '42.5');
      lounge.setAttribute('width', '20');
      lounge.setAttribute('height', '5');
      lounge.setAttribute('fill', '#8B5A2B');
      lounge.setAttribute('rx', '0.6');
      svg.appendChild(lounge);

      const loungeText = document.createElementNS(svgNS, 'text');
      loungeText.setAttribute('x', '58');
      loungeText.setAttribute('y', '45.5');
      loungeText.setAttribute('fill', '#FFFFFF');
      loungeText.setAttribute('font-size', '1.2');
      loungeText.setAttribute('font-weight', '700');
      loungeText.setAttribute('text-anchor', 'middle');
      loungeText.textContent = '☕ OUTDOOR TEA TASTING LOUNGE';
      svg.appendChild(loungeText);

      // Entrance Badge (South-West)
      const entryBadge = document.createElementNS(svgNS, 'rect');
      entryBadge.setAttribute('x', '4');
      entryBadge.setAttribute('y', '81.5');
      entryBadge.setAttribute('width', '36');
      entryBadge.setAttribute('height', '2.5');
      entryBadge.setAttribute('fill', '#0F3020');
      entryBadge.setAttribute('stroke', '#D4AF37');
      entryBadge.setAttribute('stroke-width', '0.25');
      entryBadge.setAttribute('rx', '0.4');
      svg.appendChild(entryBadge);

      const entryText = document.createElementNS(svgNS, 'text');
      entryText.setAttribute('x', '22');
      entryText.setAttribute('y', '83.2');
      entryText.setAttribute('fill', '#FFD700');
      entryText.setAttribute('font-size', '1.1');
      entryText.setAttribute('font-weight', '700');
      entryText.setAttribute('text-anchor', 'middle');
      entryText.textContent = '▶ MAIN SUMMIT ENTRANCE (SOUTH-WEST)';
      svg.appendChild(entryText);

      // Exit Badge (North-West)
      const exitBadge = document.createElementNS(svgNS, 'rect');
      exitBadge.setAttribute('x', '4');
      exitBadge.setAttribute('y', '5.2');
      exitBadge.setAttribute('width', '30');
      exitBadge.setAttribute('height', '2.4');
      exitBadge.setAttribute('fill', '#143D2B');
      exitBadge.setAttribute('stroke', '#A3FFC2');
      exitBadge.setAttribute('stroke-width', '0.25');
      exitBadge.setAttribute('rx', '0.4');
      svg.appendChild(exitBadge);

      const exitText = document.createElementNS(svgNS, 'text');
      exitText.setAttribute('x', '19');
      exitText.setAttribute('y', '6.8');
      exitText.setAttribute('fill', '#FFFFFF');
      exitText.setAttribute('font-size', '1.1');
      exitText.setAttribute('font-weight', '700');
      exitText.setAttribute('text-anchor', 'middle');
      exitText.textContent = '◀ SUMMIT EXIT (NORTH-WEST)';
      svg.appendChild(exitText);
    }

    // 5. Booth Elements
    const boothGroup = document.createElementNS(svgNS, 'g');
    boothGroup.setAttribute('id', 'svg-booth-group');

    // 6. Top-Layer Selection Overlay Group (Rendered above ALL booths to prevent clipping)
    const selectionGroup = document.createElementNS(svgNS, 'g');
    selectionGroup.setAttribute('id', 'svg-selection-overlay');

    const filteredBooths = this.booths.filter(b => {
      if (this.activeFilter === 'tent-a') return b.tent === 'tent-a';
      if (this.activeFilter === 'tent-b') return b.tent === 'tent-b';
      return true;
    });

    for (const booth of filteredBooths) {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'booth-node');

      const isVip = booth.type === 'vip' || booth.type === 'premium';
      const isSelected = booth.status === 'selected';
      const fill = isSelected ? BRAND_COLORS.selected : (booth.color || (isVip ? BRAND_COLORS.vip : BRAND_COLORS.available));

      // Rect
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', booth.x);
      rect.setAttribute('y', booth.y);
      rect.setAttribute('width', booth.w);
      rect.setAttribute('height', booth.h);
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', isSelected ? '#FFEAA7' : (booth.fascia_bg || '#FFFFFF'));
      rect.setAttribute('stroke-width', isSelected ? '0.25' : '0.15');
      rect.setAttribute('rx', '0.2');
      rect.classList.add('booth-rect');
      if (isSelected) rect.classList.add('selected');
      rect.setAttribute('tabindex', '0');
      rect.setAttribute('role', 'button');
      rect.setAttribute('aria-label', `Booth ${booth.id} — ${booth.tier || 'Standard'}`);
      rect.setAttribute('data-booth-id', booth.id);

      const title = document.createElementNS(svgNS, 'title');
      title.textContent = `Booth #${booth.id} (${booth.tier || 'Base'}) — ${booth.rate || 'USD 3,000'}`;
      rect.appendChild(title);

      g.appendChild(rect);

      // Label text
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', booth.x + booth.w / 2);
      text.setAttribute('y', booth.y + booth.h / 2);
      text.classList.add('booth-label');
      text.setAttribute('font-size', booth.w < 2 ? '0.9' : '1.1');
      text.setAttribute('fill', '#FFFFFF');
      text.textContent = booth.id;
      g.appendChild(text);

      boothGroup.appendChild(g);
      this._boothElements.set(booth.id, rect);

      // Render top-layer selection highlight if selected
      if (isSelected) {
        this._renderSelectionOverlayItem(selectionGroup, svgNS, booth);
      }
    }

    svg.appendChild(boothGroup);
    svg.appendChild(selectionGroup);

    // 7. Legend (8-Tier Matrix)
    this._renderLegend(svg, svgNS, minX, maxY + 1.5);

    target.innerHTML = '';
    target.appendChild(svg);
    this._attachEvents(svg);
  }

  _renderTentOutline(svg, svgNS, x, y, w, h, title) {
    // Floor
    const floor = document.createElementNS(svgNS, 'rect');
    floor.setAttribute('x', x);
    floor.setAttribute('y', y);
    floor.setAttribute('width', w);
    floor.setAttribute('height', h);
    floor.setAttribute('fill', '#F5FAF6');
    floor.setAttribute('stroke', '#1E5E3A');
    floor.setAttribute('stroke-width', '0.4');
    floor.setAttribute('rx', '0.6');
    svg.appendChild(floor);

    // Header Label
    const banner = document.createElementNS(svgNS, 'rect');
    banner.setAttribute('x', x);
    banner.setAttribute('y', y - 2.8);
    banner.setAttribute('width', w);
    banner.setAttribute('height', '2.4');
    banner.setAttribute('fill', '#143D2B');
    banner.setAttribute('rx', '0.4');
    svg.appendChild(banner);

    const txt = document.createElementNS(svgNS, 'text');
    txt.setAttribute('x', x + w / 2);
    txt.setAttribute('y', y - 1.2);
    txt.setAttribute('fill', '#FFDF80');
    txt.setAttribute('font-size', '1.3');
    txt.setAttribute('font-weight', '700');
    txt.setAttribute('text-anchor', 'middle');
    txt.textContent = title;
    svg.appendChild(txt);
  }

  _renderLegend(svg, svgNS, x, y) {
    const legendBg = document.createElementNS(svgNS, 'rect');
    legendBg.setAttribute('x', x);
    legendBg.setAttribute('y', y - 0.5);
    legendBg.setAttribute('width', '98');
    legendBg.setAttribute('height', '5.5');
    legendBg.setAttribute('fill', '#102C1F');
    legendBg.setAttribute('stroke', '#1E5E3A');
    legendBg.setAttribute('stroke-width', '0.2');
    legendBg.setAttribute('rx', '0.6');
    svg.appendChild(legendBg);

    const items = [
      { color: '#8A6A12', label: 'S1 Platinum ($6,000)', textColor: '#FFD700' },
      { color: '#C29B3A', label: 'S2 Gold ($5,250)', textColor: '#FFF0A5' },
      { color: '#E3CE8E', label: 'S3 Silver ($4,500)', textColor: '#FFFFFF' },
      { color: '#F5EDD5', label: 'S4 Bronze ($3,750)', textColor: '#FFFFFF' },
      { color: '#2E7A52', label: 'E1 Prime ($4,500)', textColor: '#A3FFC2' },
      { color: '#74B18E', label: 'E2 Better ($3,600)', textColor: '#FFFFFF' },
      { color: '#BEDECB', label: 'E3 Base ($3,000)', textColor: '#FFFFFF' },
      { color: '#E9F4EE', label: 'E4 Value ($2,400)', textColor: '#FFFFFF' }
    ];

    let row = 0;
    let col = 0;
    for (const item of items) {
      const lx = x + 2 + col * 24;
      const ly = y + 0.3 + row * 2.4;

      const r = document.createElementNS(svgNS, 'rect');
      r.setAttribute('x', lx);
      r.setAttribute('y', ly);
      r.setAttribute('width', '1.8');
      r.setAttribute('height', '1.6');
      r.setAttribute('fill', item.color);
      r.setAttribute('rx', '0.3');
      svg.appendChild(r);

      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', lx + 2.4);
      t.setAttribute('y', ly + 1.2);
      t.setAttribute('fill', item.textColor);
      t.setAttribute('font-size', '1.05');
      t.setAttribute('font-weight', '700');
      t.textContent = item.label;
      svg.appendChild(t);

      col++;
      if (col >= 4) {
        col = 0;
        row++;
      }
    }
  }

  _attachEvents(svg) {
    svg.addEventListener('click', (e) => {
      const rect = e.target.closest('.booth-rect');
      if (!rect) return;
      const boothId = parseInt(rect.getAttribute('data-booth-id'), 10);
      if (!isNaN(boothId) && this._clickCallback) {
        this._clickCallback(boothId);
      }
    });

    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const rect = e.target.closest('.booth-rect');
        if (!rect) return;
        e.preventDefault();
        const boothId = parseInt(rect.getAttribute('data-booth-id'), 10);
        if (!isNaN(boothId) && this._clickCallback) {
          this._clickCallback(boothId);
        }
      }
    });
  }

  _renderSelectionOverlayItem(parentGroup, svgNS, booth) {
    const margin = 0.25;
    const gx = booth.x - margin;
    const gy = booth.y - margin;
    const gw = booth.w + margin * 2;
    const gh = booth.h + margin * 2;

    const group = document.createElementNS(svgNS, 'g');
    group.setAttribute('class', 'selection-item-overlay');
    group.setAttribute('data-selection-id', booth.id);

    // Glowing outer gold ring (rendered above all booths)
    const ring = document.createElementNS(svgNS, 'rect');
    ring.setAttribute('x', gx);
    ring.setAttribute('y', gy);
    ring.setAttribute('width', gw);
    ring.setAttribute('height', gh);
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#FFD700');
    ring.setAttribute('stroke-width', '0.35');
    ring.setAttribute('rx', '0.4');
    ring.setAttribute('filter', 'url(#gold-glow)');
    group.appendChild(ring);

    // Crisp white inner border
    const innerBorder = document.createElementNS(svgNS, 'rect');
    innerBorder.setAttribute('x', booth.x);
    innerBorder.setAttribute('y', booth.y);
    innerBorder.setAttribute('width', booth.w);
    innerBorder.setAttribute('height', booth.h);
    innerBorder.setAttribute('fill', 'none');
    innerBorder.setAttribute('stroke', '#FFFFFF');
    innerBorder.setAttribute('stroke-width', '0.2');
    innerBorder.setAttribute('rx', '0.2');
    group.appendChild(innerBorder);

    // Floating selection badge pin
    const badgeW = 6.4;
    const badgeH = 1.6;
    const bx = booth.x + booth.w / 2 - badgeW / 2;
    const by = booth.y - badgeH - 0.4;

    if (by > 2) {
      const badgeBg = document.createElementNS(svgNS, 'rect');
      badgeBg.setAttribute('x', bx);
      badgeBg.setAttribute('y', by);
      badgeBg.setAttribute('width', badgeW);
      badgeBg.setAttribute('height', badgeH);
      badgeBg.setAttribute('fill', '#D4AF37');
      badgeBg.setAttribute('stroke', '#FFFFFF');
      badgeBg.setAttribute('stroke-width', '0.15');
      badgeBg.setAttribute('rx', '0.4');
      group.appendChild(badgeBg);

      const badgeTxt = document.createElementNS(svgNS, 'text');
      badgeTxt.setAttribute('x', bx + badgeW / 2);
      badgeTxt.setAttribute('y', by + 1.1);
      badgeTxt.setAttribute('fill', '#0A2318');
      badgeTxt.setAttribute('font-size', '0.9');
      badgeTxt.setAttribute('font-weight', '800');
      badgeTxt.setAttribute('text-anchor', 'middle');
      badgeTxt.textContent = `★ SELECTED #${booth.id}`;
      group.appendChild(badgeTxt);
    }

    parentGroup.appendChild(group);
  }

  onBoothClick(callback) {
    this._clickCallback = callback;
  }

  updateBoothStatus(id, status) {
    const rect = this._boothElements.get(id);
    if (!rect) return;

    const booth = this.booths.find(b => b.id === id);
    if (booth) booth.status = status;

    const isVip = booth && (booth.type === 'vip' || booth.type === 'premium');

    const fill = status === 'selected'
      ? BRAND_COLORS.selected
      : (booth && booth.color ? booth.color : (isVip ? BRAND_COLORS.vip : BRAND_COLORS.available));

    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', status === 'selected' ? '#FFEAA7' : (booth && booth.fascia_bg ? booth.fascia_bg : '#FFFFFF'));
    rect.setAttribute('stroke-width', status === 'selected' ? '0.35' : '0.15');

    if (status === 'selected') {
      rect.classList.add('selected');
    } else {
      rect.classList.remove('selected');
    }

    // Update top-layer selection overlay group
    const targetSvg = this.container.querySelector('svg');
    if (targetSvg) {
      let selectionGroup = targetSvg.querySelector('#svg-selection-overlay');
      if (!selectionGroup) {
        selectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        selectionGroup.setAttribute('id', 'svg-selection-overlay');
        targetSvg.appendChild(selectionGroup);
      }

      // Remove existing overlay item for this booth
      const existing = selectionGroup.querySelector(`[data-selection-id="${id}"]`);
      if (existing) existing.remove();

      // If now selected, render top-layer overlay item
      if (status === 'selected' && booth) {
        this._renderSelectionOverlayItem(selectionGroup, 'http://www.w3.org/2000/svg', booth);
      }
    }
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }

  isVisible() {
    return !this.container.classList.contains('hidden');
  }
}
