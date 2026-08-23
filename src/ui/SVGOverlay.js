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
            <span class="summit-pill">Kenya-China Tea Summit 2027</span>
            <h2>2D MASTER FLOOR PLAN & BOOTH RESERVATION</h2>
          </div>
          <div class="svg-tabs">
            <button class="svg-tab active" data-filter="all">All Pavilions (196)</button>
            <button class="svg-tab" data-filter="tent-a">Pavilion A · Main Hall (146)</button>
            <button class="svg-tab" data-filter="tent-b">Pavilion B · Innovation (50)</button>
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
    let minX = 0, maxX = 98, minY = 2, maxY = 82;

    if (this.activeFilter === 'tent-a') {
      minY = 5;
      maxY = 44;
    } else if (this.activeFilter === 'tent-b') {
      minY = 46;
      maxY = 78;
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

    // 3. Render Pavilion A (Main Hall)
    if (this.activeFilter === 'all' || this.activeFilter === 'tent-a') {
      this._renderTentOutline(svg, svgNS, 5, 10, 85, 30, 'PAVILION A — MAIN EXHIBITION HALL (30M × 80M)');
    }

    // 4. Render Pavilion B (Innovation Hall)
    if (this.activeFilter === 'all' || this.activeFilter === 'tent-b') {
      this._renderTentOutline(svg, svgNS, 5, 50, 85, 20, 'PAVILION B — TEA INNOVATION & B2B MATCHMAKING (20M × 80M)');
    }

    // Central Walkway & Outdoor Lounge in 'all' view
    if (this.activeFilter === 'all') {
      const lounge = document.createElementNS(svgNS, 'rect');
      lounge.setAttribute('x', '35');
      lounge.setAttribute('y', '41');
      lounge.setAttribute('width', '25');
      lounge.setAttribute('height', '8');
      lounge.setAttribute('fill', '#8B5A2B');
      lounge.setAttribute('rx', '0.6');
      svg.appendChild(lounge);

      const loungeText = document.createElementNS(svgNS, 'text');
      loungeText.setAttribute('x', '47.5');
      loungeText.setAttribute('y', '45.5');
      loungeText.setAttribute('fill', '#FFFFFF');
      loungeText.setAttribute('font-size', '1.3');
      loungeText.setAttribute('font-weight', '700');
      loungeText.setAttribute('text-anchor', 'middle');
      loungeText.textContent = '☕ OUTDOOR TEA TASTING LOUNGE';
      svg.appendChild(loungeText);
    }

    // 5. Booth Elements
    const boothGroup = document.createElementNS(svgNS, 'g');

    const filteredBooths = this.booths.filter(b => {
      if (this.activeFilter === 'tent-a') return b.tent === 'tent-a';
      if (this.activeFilter === 'tent-b') return b.tent === 'tent-b';
      return true;
    });

    for (const booth of filteredBooths) {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'booth-node');

      const isVip = booth.type === 'vip' || booth.type === 'premium';
      const fill = booth.status === 'selected'
        ? BRAND_COLORS.selected
        : (isVip ? BRAND_COLORS.vip : (BRAND_COLORS[booth.status] || BRAND_COLORS.available));

      // Rect
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', booth.x);
      rect.setAttribute('y', booth.y);
      rect.setAttribute('width', booth.w);
      rect.setAttribute('height', booth.h);
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', booth.status === 'selected' ? '#FFEAA7' : (isVip ? BRAND_COLORS.gold_border : '#FFFFFF'));
      rect.setAttribute('stroke-width', booth.status === 'selected' ? '0.35' : (isVip ? '0.25' : '0.12'));
      rect.setAttribute('rx', '0.2');
      rect.classList.add('booth-rect');
      if (booth.status === 'selected') rect.classList.add('selected');
      rect.setAttribute('tabindex', '0');
      rect.setAttribute('role', 'button');
      rect.setAttribute('aria-label', `Booth ${booth.id} — ${booth.zone}`);
      rect.setAttribute('data-booth-id', booth.id);

      const title = document.createElementNS(svgNS, 'title');
      title.textContent = `Booth #${booth.id} (${booth.zone}) — ${booth.rate || 'Available'}`;
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
    }

    svg.appendChild(boothGroup);

    // 6. Legend (Rendered with crisp, clear text colors for high readability)
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
    // Legend bar background container for crisp contrast
    const legendBg = document.createElementNS(svgNS, 'rect');
    legendBg.setAttribute('x', x);
    legendBg.setAttribute('y', y - 0.5);
    legendBg.setAttribute('width', '98');
    legendBg.setAttribute('height', '3.2');
    legendBg.setAttribute('fill', '#102C1F');
    legendBg.setAttribute('stroke', '#1E5E3A');
    legendBg.setAttribute('stroke-width', '0.2');
    legendBg.setAttribute('rx', '0.6');
    svg.appendChild(legendBg);

    const items = [
      { color: BRAND_COLORS.available, label: 'Available Stand', textColor: '#FFFFFF' },
      { color: BRAND_COLORS.selected, label: 'Selected Stand', textColor: '#FFFFFF' },
      { color: BRAND_COLORS.vip, border: BRAND_COLORS.gold_border, label: 'VIP / Premium Lounge', textColor: '#FFFFFF' },
      { color: BRAND_COLORS.reserved, label: 'Reserved', textColor: '#D1DDD5' }
    ];

    let cx = x + 3;
    for (const item of items) {
      const r = document.createElementNS(svgNS, 'rect');
      r.setAttribute('x', cx);
      r.setAttribute('y', y + 0.3);
      r.setAttribute('width', '1.8');
      r.setAttribute('height', '1.6');
      r.setAttribute('fill', item.color);
      if (item.border) {
        r.setAttribute('stroke', item.border);
        r.setAttribute('stroke-width', '0.25');
      }
      r.setAttribute('rx', '0.3');
      svg.appendChild(r);

      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', cx + 2.6);
      t.setAttribute('y', y + 1.5);
      t.setAttribute('fill', item.textColor);
      t.setAttribute('font-size', '1.15');
      t.setAttribute('font-weight', '700');
      t.textContent = item.label;
      svg.appendChild(t);

      cx += 23.5;
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

  onBoothClick(callback) {
    this._clickCallback = callback;
  }

  updateBoothStatus(id, status) {
    const rect = this._boothElements.get(id);
    if (!rect) return;

    const data = this.booths.find(b => b.id === id);
    const isVip = data && (data.type === 'vip' || data.type === 'premium');

    const fill = status === 'selected'
      ? BRAND_COLORS.selected
      : (isVip ? BRAND_COLORS.vip : (BRAND_COLORS[status] || BRAND_COLORS.available));

    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', status === 'selected' ? '#FFEAA7' : (isVip ? BRAND_COLORS.gold_border : '#FFFFFF'));
    rect.setAttribute('stroke-width', status === 'selected' ? '0.35' : (isVip ? '0.25' : '0.12'));

    if (status === 'selected') {
      rect.classList.add('selected');
    } else {
      rect.classList.remove('selected');
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
