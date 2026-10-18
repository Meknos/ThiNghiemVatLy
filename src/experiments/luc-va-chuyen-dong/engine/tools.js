/**
 * AIPLab Studio - Virtual Instruments & Measurement Tools
 * Thước đo khoảng cách ảo (Virtual Ruler) & Cổng quang điện ảo (Photogate)
 */

export class VirtualRuler {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.p1 = { x: 100, y: 350 };
    this.p2 = { x: 300, y: 350 };
    this.draggingPoint = null;
    this.draggingWhole = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  show() {
    this.active = true;
  }

  hide() {
    this.active = false;
  }

  toggle() {
    this.active = !this.active;
    return this.active;
  }

  draw(ctx, toMeters) {
    if (!this.active) return;

    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const pixelDist = Math.hypot(dx, dy);
    const meterDist = toMeters(pixelDist);
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = ((angleRad * 180) / Math.PI).toFixed(1);

    ctx.save();

    // Thân thước đo phát sáng
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
    ctx.stroke();

    // Vạch chia thước đo
    const numTicks = Math.floor(meterDist * 10); // Mỗi 10 cm một vạch
    if (numTicks > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= numTicks; i++) {
        const t = (i / 10) / meterDist;
        const tx = this.p1.x + dx * t;
        const ty = this.p1.y + dy * t;
        const tickLen = i % 5 === 0 ? 10 : 5;
        const normalX = -Math.sin(angleRad) * tickLen;
        const normalY = Math.cos(angleRad) * tickLen;

        ctx.beginPath();
        ctx.moveTo(tx - normalX, ty - normalY);
        ctx.lineTo(tx + normalX, ty + normalY);
        ctx.stroke();
      }
    }

    // 2 Điểm mút điều khiển (Handles)
    this.drawHandle(ctx, this.p1.x, this.p1.y, '#38bdf8');
    this.drawHandle(ctx, this.p2.x, this.p2.y, '#a855f7');

    // Nhãn kích thước ở giữa thước
    const midX = (this.p1.x + this.p2.x) / 2;
    const midY = (this.p1.y + this.p2.y) / 2 - 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(midX - 36, midY - 12, 72, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`${meterDist.toFixed(2).replace('.', ',')} m`, midX, midY + 4);

    ctx.restore();
  }

  drawHandle(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  handleMouseDown(pos) {
    if (!this.active) return false;
    if (Math.hypot(pos.x - this.p1.x, pos.y - this.p1.y) < 14) {
      this.draggingPoint = 'p1';
      return true;
    }
    if (Math.hypot(pos.x - this.p2.x, pos.y - this.p2.y) < 14) {
      this.draggingPoint = 'p2';
      return true;
    }
    // Check line drag
    const distToLine = this.pointToSegmentDistance(pos, this.p1, this.p2);
    if (distToLine < 12) {
      this.draggingWhole = true;
      this.dragOffset = { x: pos.x - this.p1.x, y: pos.y - this.p1.y };
      return true;
    }
    return false;
  }

  handleMouseMove(pos) {
    if (!this.active) return false;
    if (this.draggingPoint === 'p1') {
      this.p1.x = pos.x;
      this.p1.y = pos.y;
      return true;
    }
    if (this.draggingPoint === 'p2') {
      this.p2.x = pos.x;
      this.p2.y = pos.y;
      return true;
    }
    if (this.draggingWhole) {
      const dx = this.p2.x - this.p1.x;
      const dy = this.p2.y - this.p1.y;
      this.p1.x = pos.x - this.dragOffset.x;
      this.p1.y = pos.y - this.dragOffset.y;
      this.p2.x = this.p1.x + dx;
      this.p2.y = this.p1.y + dy;
      return true;
    }
    return false;
  }

  handleMouseUp() {
    this.draggingPoint = null;
    this.draggingWhole = false;
  }

  pointToSegmentDistance(p, v, w) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }
}

export class VirtualPhotogate {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.x = 420;
    this.y = 350;
    this.height = 90;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.log = [];
    this.blocking = null;
    this.lastRecord = null;
    this.onTriggerCallback = null;
  }

  show() {
    this.active = true;
  }

  hide() {
    this.active = false;
  }

  toggle() {
    this.active = !this.active;
    return this.active;
  }

  reset() {
    this.log = [];
    this.blocking = null;
    this.lastRecord = null;
  }

  /**
   * Đo như cổng quang thật: ghi thời gian t mà vật chắn tia sáng, rồi tính
   * tốc độ v = d / t với d là bề rộng của vật (tấm chắn sáng).
   * Thời điểm vào/ra được nội suy theo vận tốc để không phụ thuộc bước mô phỏng.
   */
  update(bodies, currentTime, engine) {
    if (!this.active) { this.blocking = null; return; }

    const gateTop = this.y - this.height / 2;
    const gateBottom = this.y + this.height / 2;
    // Dùng đỉnh của vật, vì body.bounds của Matter bị nới thêm theo vận tốc
    const extent = (b) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const v of b.vertices) {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      }
      return { minX, maxX, minY, maxY };
    };
    const blocks = (e) =>
      e.minX <= this.x && e.maxX >= this.x && e.maxY >= gateTop && e.minY <= gateBottom;
    const crossTime = (edgeX, vxPxPerSec) =>
      Math.abs(vxPxPerSec) > 1e-6 ? currentTime - (edgeX - this.x) / vxPxPerSec : currentTime;

    if (this.blocking) {
      const b = this.blocking.body;
      const e = extent(b);
      if (blocks(e)) return;
      const vx = engine.velocityMps(b).x * engine.scale;
      const tExit = crossTime(vx >= 0 ? e.minX : e.maxX, vx);
      const t = tExit - this.blocking.tEnter;
      const d = this.blocking.width / engine.scale;
      this.blocking = null;
      if (t <= 0) return;

      const record = {
        id: this.log.length + 1,
        name: b.label || 'Vật thể',
        time: tExit.toFixed(2),
        blockTime: t,
        width: d,
        speed: (d / t).toFixed(2)
      };
      this.lastRecord = record;
      this.log.unshift(record);
      if (this.onTriggerCallback) this.onTriggerCallback(record);
      return;
    }

    for (const b of bodies) {
      if (b.isStatic || engine.isBoundary(b)) continue;
      const e = extent(b);
      if (!blocks(e)) continue;
      const vx = engine.velocityMps(b).x * engine.scale;
      this.blocking = {
        body: b,
        width: e.maxX - e.minX,
        tEnter: crossTime(vx >= 0 ? e.maxX : e.minX, vx)
      };
      break;
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    const halfH = this.height / 2;

    // Cột cổng quang trên và dưới
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    // Cực phát trên
    ctx.fillRect(this.x - 8, this.y - halfH - 14, 16, 14);
    ctx.strokeRect(this.x - 8, this.y - halfH - 14, 16, 14);

    // Cực thu dưới
    ctx.fillRect(this.x - 8, this.y + halfH, 16, 14);
    ctx.strokeRect(this.x - 8, this.y + halfH, 16, 14);

    // Tia sáng: liền nét khi thông, đứt nét mờ khi đang bị vật chắn
    const blocked = !!this.blocking;
    ctx.strokeStyle = blocked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.95)';
    ctx.lineWidth = blocked ? 1.5 : 2.5;
    ctx.setLineDash(blocked ? [4, 4] : []);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - halfH);
    ctx.lineTo(this.x, this.y + halfH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('CỔNG QUANG', this.x, this.y - halfH - 20);

    // Đồng hồ đo thời gian hiện số
    const r = this.lastRecord;
    const lines = blocked
      ? ['Đang chắn sáng…']
      : r
        ? [`t = ${r.blockTime.toFixed(3)} s`, `d = ${r.width.toFixed(2)} m`, `v = d/t = ${r.speed} m/s`].map(s => s.replace(/\./g, ','))
        : ['Chờ vật đi qua'];
    const boxW = 138, boxH = 10 + lines.length * 14;
    const bx = this.x + 16, by = this.y - halfH - 14;
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'left';
    lines.forEach((ln, k) => ctx.fillText(ln, bx + 8, by + 15 + k * 14));

    ctx.restore();
  }

  handleMouseDown(pos) {
    if (!this.active) return false;
    const halfH = this.height / 2;
    if (Math.abs(pos.x - this.x) < 16 && pos.y >= this.y - halfH - 16 && pos.y <= this.y + halfH + 16) {
      this.isDragging = true;
      this.dragOffset = { x: pos.x - this.x, y: pos.y - this.y };
      return true;
    }
    return false;
  }

  handleMouseMove(pos) {
    if (this.isDragging) {
      this.x = pos.x - this.dragOffset.x;
      this.y = pos.y - this.dragOffset.y;
      return true;
    }
    return false;
  }

  handleMouseUp() {
    this.isDragging = false;
  }
}
