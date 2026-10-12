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
    const numTicks = Math.floor(meterDist * 4); // Mỗi 0.25m 1 vạch
    if (numTicks > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= numTicks; i++) {
        const t = i / numTicks;
        const tx = this.p1.x + dx * t;
        const ty = this.p1.y + dy * t;
        const tickLen = i % 4 === 0 ? 10 : 5;
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
    ctx.roundRect(midX - 55, midY - 12, 110, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`d = ${meterDist.toFixed(2)}m (${angleDeg}°)`, midX, midY + 4);

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
    this.lastTriggeredTime = 0;
    this.log = [];
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

  checkCollision(bodies, currentTime, toMetersSpeed) {
    if (!this.active) return;
    if (currentTime - this.lastTriggeredTime < 0.3) return; // Debounce 300ms

    const gateTop = this.y - this.height / 2;
    const gateBottom = this.y + this.height / 2;

    for (const body of bodies) {
      if (body.isStatic) continue;

      // Check if body bounding box or center intersects gate laser
      const bx = body.position.x;
      const by = body.position.y;
      const r = body.circleRadius || Math.max(body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y) / 2;

      if (Math.abs(bx - this.x) < r && by >= gateTop && by <= gateBottom) {
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        const speedMps = toMetersSpeed(speed);
        this.lastTriggeredTime = currentTime;

        const record = {
          id: this.log.length + 1,
          name: body.label || 'Vật thể',
          time: currentTime.toFixed(2),
          speed: speedMps.toFixed(2)
        };
        this.log.unshift(record);

        if (this.onTriggerCallback) {
          this.onTriggerCallback(record);
        }
        break;
      }
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

    // Tia Laser hồng ngoại
    const isLit = performance.now() / 1000 - this.lastTriggeredTime < 0.25;
    ctx.strokeStyle = isLit ? 'rgba(239, 68, 68, 1)' : 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = isLit ? 3 : 1.5;
    ctx.setLineDash(isLit ? [] : [4, 4]);

    ctx.beginPath();
    ctx.moveTo(this.x, this.y - halfH);
    ctx.lineTo(this.x, this.y + halfH);
    ctx.stroke();

    // Nhãn Cổng quang
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTOGATE', this.x, this.y - halfH - 20);

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
