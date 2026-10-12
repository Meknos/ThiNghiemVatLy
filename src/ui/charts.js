import Matter from 'matter-js';

export class LiveCharts {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.engine = engine;
    this.metric = 'energy'; // 'energy', 'speed', 'height'
    this.history = [];
    this.maxPoints = 250;

    this.lblKe = document.getElementById('lblKe');
    this.lblPe = document.getElementById('lblPe');
    this.lblTe = document.getElementById('lblTe');
    this.barKe = document.getElementById('barKe');
    this.barPe = document.getElementById('barPe');
    this.barTe = document.getElementById('barTe');

    const sel = document.getElementById('selGraphMetric');
    if (sel) sel.addEventListener('change', (e) => { this.metric = e.target.value; });

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width  = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  update(simTime) {
    const bodies = Matter.Composite.allBodies(this.engine.world);
    let totalKe = 0, totalPe = 0, maxSpeed = 0, maxHeight = 0;

    const targets = (this.engine.selectedBody && !this.engine.isBoundary(this.engine.selectedBody))
      ? [this.engine.selectedBody]
      : bodies.filter(b => !b.isStatic && !this.engine.isBoundary(b));

    targets.forEach(b => {
      const spd = this.engine.toMetersSpeed(Math.hypot(b.velocity.x, b.velocity.y));
      const h   = this.engine.bodyHeightM(b);

      totalKe += 0.5 * b.mass * spd * spd;
      totalPe += b.mass * this.engine.gravityVal * h;
      if (spd > maxSpeed) maxSpeed = spd;
      if (h > maxHeight) maxHeight = h;
    });

    const totalTe = totalKe + totalPe;
    this.history.push({ t: simTime, ke: totalKe, pe: totalPe, te: totalTe, speed: maxSpeed, height: maxHeight });
    if (this.history.length > this.maxPoints) this.history.shift();

    // Update energy bar UI
    this.lblKe.textContent = `${totalKe.toFixed(1)} J`;
    this.lblPe.textContent = `${totalPe.toFixed(1)} J`;
    this.lblTe.textContent = `${totalTe.toFixed(1)} J`;

    const scale = Math.max(10, totalTe * 1.3, totalKe * 1.3, totalPe * 1.3);
    this.barKe.style.width = `${Math.min(100, (totalKe / scale) * 100)}%`;
    this.barPe.style.width = `${Math.min(100, (totalPe / scale) * 100)}%`;
    this.barTe.style.width = `${Math.min(100, (totalTe / scale) * 100)}%`;

    this._render();
  }

  _render() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    const ctx = this.ctx;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (this.history.length < 2) {
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Chạy mô phỏng để xem biểu đồ...', w / 2, h / 2);
      ctx.restore();
      return;
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let y = 20; y < h - 15; y += 25) {
      ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(w - 5, y); ctx.stroke();
    }

    // Compute Y scale
    let maxVal = 1;
    if (this.metric === 'energy')  maxVal = Math.max(...this.history.map(d => Math.max(d.te, d.ke, d.pe)), 5);
    else if (this.metric === 'speed') maxVal = Math.max(...this.history.map(d => d.speed), 1);
    else maxVal = Math.max(...this.history.map(d => d.height), 1);
    maxVal *= 1.2;

    const padT = 14, padB = 18, padL = 32;
    const plotW = w - padL - 5;
    const plotH = h - padT - padB;

    const getX = (i) => padL + (i / (this.maxPoints - 1)) * plotW;
    const getY = (val) => padT + plotH - (val / maxVal) * plotH;

    if (this.metric === 'energy') {
      this._line(ctx, this.history.map(d => d.ke), '#10b981', getX, getY, 2);
      this._line(ctx, this.history.map(d => d.pe), '#f59e0b', getX, getY, 2);
      this._line(ctx, this.history.map(d => d.te), '#38bdf8', getX, getY, 2.5);
      this._legend(ctx, w, [
        { label: 'Wđ', color: '#10b981' },
        { label: 'Wt', color: '#f59e0b' },
        { label: 'W',  color: '#38bdf8' }
      ]);
    } else if (this.metric === 'speed') {
      this._line(ctx, this.history.map(d => d.speed), '#10b981', getX, getY, 2);
      this._legend(ctx, w, [{ label: 'v(t) m/s', color: '#10b981' }]);
    } else {
      this._line(ctx, this.history.map(d => d.height), '#8b5cf6', getX, getY, 2);
      this._legend(ctx, w, [{ label: 'y(t) m', color: '#8b5cf6' }]);
    }

    // Y axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(maxVal.toFixed(1), padL - 4, padT + 3);
    ctx.fillText('0', padL - 4, padT + plotH + 3);

    ctx.restore();
  }

  _line(ctx, data, color, getX, getY, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    for (let i = 1; i < data.length; i++) ctx.lineTo(getX(i), getY(data[i]));
    ctx.stroke();
    ctx.restore();
  }

  _legend(ctx, w, items) {
    ctx.save();
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    let x = w - 8;
    for (let i = items.length - 1; i >= 0; i--) {
      const tw = ctx.measureText(items[i].label).width;
      x -= tw + 18;
      ctx.fillStyle = items[i].color;
      ctx.fillRect(x, 4, 8, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(items[i].label, x + 11, 12);
    }
    ctx.restore();
  }
}
