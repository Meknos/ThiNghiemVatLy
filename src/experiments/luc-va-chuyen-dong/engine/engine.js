import Matter from 'matter-js';
import { VirtualRuler, VirtualPhotogate } from './tools.js';

const {
  Engine,
  Bodies,
  Composite,
  Constraint,
  Mouse,
  MouseConstraint,
  Body,
  Vector,
  Events,
  Bounds,
  Vertices
} = Matter;

/**
 * @class PhysicsEngine
 * Core simulation engine wrapping Matter.js with custom high-DPI Canvas2D renderer.
 *
 * Key design decisions:
 *  - Canvas is sized at CSS pixels × devicePixelRatio for sharp rendering.
 *  - All drawing coordinates are in CSS pixels (the ctx is scaled once per frame).
 *  - Matter.js body positions are also in CSS-pixel space so they map 1:1 to drawing.
 *  - `scale` (px per metre) ties pixels to SI units: 1 m = 100 px, so Matter's
 *    default gravity (0.001 px/ms² = 1000 px/s²) is exactly g = 10 m/s².
 *  - Body mass is read as kg. Springs and sliding friction are applied as real
 *    forces in newtons (see applyForceN) because Matter's own constraints and
 *    contact friction do not follow F = k·Δl or F = μ·N.
 *  - The ground plane sits 50 CSS-px above the canvas bottom so labels aren't clipped.
 */
export class PhysicsEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // --- Coordinate system ---
    // 1 metre = this.scale CSS-pixels
    this.scale = 100.0;
    this.timeScale = 1.0;
    this.gravityVal = 10.0; // N/kg theo SGK KHTN THCS
    this.airDrag = 0.0;

    // --- Simulation state ---
    this.isRunning = false;
    this.simTime = 0;

    // --- Display flags ---
    this.showVectors = true;
    this.showTrails = true;
    this.showGrid = true;

    // --- Selection / Interaction ---
    this.selectedBody = null;
    this.hoveredBody = null;
    this.activeTool = 'drag';
    this.springFirstBody = null;

    // --- Force-based springs (Hooke's law), see addSpring ---
    this.springs = [];

    // --- Instruments ---
    this.ruler = new VirtualRuler(this);
    this.photogate = new VirtualPhotogate(this);

    // --- Callbacks (wired by main.js) ---
    this.onSelectCallback = null;
    this.onPhotogateTrigger = null;
    this.photogate.onTriggerCallback = (record) => {
      if (this.onPhotogateTrigger) this.onPhotogateTrigger(record);
    };

    // --- Initialise Matter.js ---
    this.boundaries = [];
    this.initMatter();
    this.setupEvents();
  }

  /* ------------------------------------------------------------------
     Matter.js bootstrap
  ------------------------------------------------------------------ */

  initMatter() {
    this.engine = Engine.create({
      gravity: { x: 0, y: 1.0, scale: 0.001 * (this.gravityVal / 10.0) }
    });
    this.world = this.engine.world;

    this.updateBoundaries();

    // Mouse drag-&-throw interaction
    this.mouse = Mouse.create(this.canvas);
    this.mouseConstraint = MouseConstraint.create(this.engine, {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.8,
        damping: 0.1,
        render: { visible: false }
      }
    });
    Composite.add(this.world, this.mouseConstraint);

    // Keep the pixel ratio of the mouse up-to-date
    this._syncMouseScale();
  }

  /** Correct mouse offset when canvas is hi-DPI scaled */
  _syncMouseScale() {
    if (!this.mouse) return;
    const dpr = window.devicePixelRatio || 1;
    Mouse.setScale(this.mouse, { x: dpr, y: dpr });
  }

  /* ------------------------------------------------------------------
     Canvas helpers (CSS-px dimensions)
  ------------------------------------------------------------------ */

  /** @returns Width in CSS pixels */
  get cssWidth() {
    return this.canvas.width / (window.devicePixelRatio || 1);
  }
  /** @returns Height in CSS pixels */
  get cssHeight() {
    return this.canvas.height / (window.devicePixelRatio || 1);
  }
  /** Y coordinate of the ground line in CSS pixels */
  get groundY() {
    return this.cssHeight - 50;
  }

  /* ------------------------------------------------------------------
     Boundaries (floor + walls)
  ------------------------------------------------------------------ */

  updateBoundaries() {
    // Remove old boundaries
    if (this.boundaries.length) {
      this.boundaries.forEach(b => Composite.remove(this.world, b, true));
    }
    const w = this.cssWidth;
    const h = this.cssHeight;
    const thick = 80;
    const gy = this.groundY;
    const restitution = 0.4;

    const floor = Bodies.rectangle(w / 2, gy + thick / 2, w * 3, thick, {
      isStatic: true, label: '__floor', restitution, friction: 0.6
    });
    const leftWall = Bodies.rectangle(-thick / 2, h / 2, thick, h * 3, {
      isStatic: true, label: '__leftWall', restitution
    });
    const rightWall = Bodies.rectangle(w + thick / 2, h / 2, thick, h * 3, {
      isStatic: true, label: '__rightWall', restitution
    });

    this.boundaries = [floor, leftWall, rightWall];
    Composite.add(this.world, this.boundaries);

    this._syncMouseScale();
  }

  setWallRestitution(e) {
    this.boundaries.forEach(b => { b.restitution = e; });
  }

  isBoundary(body) {
    return this.boundaries.includes(body);
  }

  /* ------------------------------------------------------------------
     Unit conversions (CSS-pixels ↔ real-world metres)
  ------------------------------------------------------------------ */

  toMeters(px) { return px / this.scale; }
  toPixels(m)  { return m * this.scale; }
  /** Convert Matter.js velocity magnitude (px/tick at 60 Hz) → m/s */
  toMetersSpeed(velMag) {
    return (velMag * 60) / this.scale;
  }
  /** Y position in metres (0 = ground, up = positive) */
  bodyHeightM(body) {
    return Math.max(0, (this.groundY - body.position.y) / this.scale);
  }

  /* ------------------------------------------------------------------
     Simulation controls
  ------------------------------------------------------------------ */

  start() {
    this.isRunning = true;
  }
  pause() {
    this.isRunning = false;
  }
  step() {
    this.updatePhysics(1 / 60);
    this.render();
  }

  clear() {
    Composite.allBodies(this.world).forEach(b => {
      if (!this.isBoundary(b)) Composite.remove(this.world, b);
    });
    Composite.allConstraints(this.world).forEach(c => {
      if (c !== this.mouseConstraint.constraint) Composite.remove(this.world, c);
    });
    this.springs = [];
    this.springFirstBody = null;
    this.selectedBody = null;
    this.simTime = 0;
    this.ruler.hide();
    this.photogate.hide();
    this.photogate.reset();
    if (this.onSelectCallback) this.onSelectCallback(null);
    this.render();
  }

  setGravity(g) {
    // scale 0.001 px/ms² ⇔ 10 m/s² at 100 px/m
    this.gravityVal = g;
    this.engine.gravity.y = g === 0 ? 0 : 1.0;
    this.engine.gravity.scale = g === 0 ? 0 : (g / 10.0) * 0.001;
  }

  setAirDrag(k) { this.airDrag = k; }
  setTimeScale(speed) { this.timeScale = speed; }

  /* ------------------------------------------------------------------
     Factory helpers — add bodies to the world
  ------------------------------------------------------------------ */

  addBox(x, y, w, h, options = {}) {
    const box = Bodies.rectangle(x, y, w, h, {
      density:     options.density   ?? 0.001,
      friction:    options.friction  ?? 0.1,
      frictionAir: options.frictionAir ?? 0,
      restitution: options.restitution ?? 0.5,
      isStatic:    options.isStatic  || false,
      label:       options.label     || 'Khối Hộp',
      customColor: options.color     || '#38bdf8',
      trail: []
    });
    if (options.mass)     Body.setMass(box, options.mass);
    if (options.angle)    Body.setAngle(box, options.angle);
    if (options.velocity) Body.setVelocity(box, options.velocity);
    Composite.add(this.world, box);
    return box;
  }

  addCircle(x, y, radius, options = {}) {
    const circle = Bodies.circle(x, y, radius, {
      density:     options.density   ?? 0.001,
      friction:    options.friction  ?? 0.05,
      frictionAir: options.frictionAir ?? 0,
      restitution: options.restitution ?? 0.8,
      isStatic:    options.isStatic  || false,
      label:       options.label     || 'Quả Cầu',
      customColor: options.color     || '#10b981',
      trail: []
    });
    if (options.mass)     Body.setMass(circle, options.mass);
    if (options.velocity) Body.setVelocity(circle, options.velocity);
    Composite.add(this.world, circle);
    return circle;
  }

  addRamp(x, y, w, h, angleRad = -Math.PI / 6, options = {}) {
    const ramp = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      label:       options.label    || 'Mặt Phẳng Nghiêng',
      friction:    options.friction ?? 0.15,
      restitution: options.restitution ?? 0.2,
      customColor: options.color    || '#64748b',
      angle: angleRad,
      trail: []
    });
    Composite.add(this.world, ramp);
    return ramp;
  }

  /**
   * Lò xo theo định luật Hooke: F = k·Δl (k tính bằng N/m), giảm chấn c (N·s/m).
   * bodyA có thể là null, khi đó đầu A gắn vào điểm cố định `anchors.pointA`.
   * `anchors.offsetA/offsetB` là điểm gắn trên vật (tọa độ theo vật, xoay cùng vật).
   * `anchors.rope = true`: dây mềm, chỉ kéo chứ không đẩy.
   */
  addSpring(bodyA, bodyB, length, k = 20, c = 0.5, anchors = {}) {
    const spring = {
      bodyA, bodyB, k, c,
      pointA: anchors.pointA || null,
      offsetA: anchors.offsetA || { x: 0, y: 0 },
      offsetB: anchors.offsetB || { x: 0, y: 0 },
      rope: !!anchors.rope,
      length: 0
    };
    const { pA, pB } = this._springEnds(spring);
    spring.length = length || Math.hypot(pB.x - pA.x, pB.y - pA.y);
    this.springs.push(spring);
    return spring;
  }

  _springEnds(s) {
    const end = (body, offset, fixed) => {
      if (!body) return fixed;
      const r = Vector.rotate(offset, body.angle);
      return { x: body.position.x + r.x, y: body.position.y + r.y };
    };
    return { pA: end(s.bodyA, s.offsetA, s.pointA), pB: end(s.bodyB, s.offsetB, null) };
  }

  /** Độ giãn hiện tại của lò xo (m), dương khi bị kéo dài. */
  springExtensionM(s) {
    const { pA, pB } = this._springEnds(s);
    return (Math.hypot(pB.x - pA.x, pB.y - pA.y) - s.length) / this.scale;
  }

  /** Tác dụng một lực tính bằng newton lên vật tại một điểm. */
  applyForceN(body, point, fx, fy) {
    const f = this.scale / 1e6; // N/kg → px/ms²
    Body.applyForce(body, point, { x: fx * f, y: fy * f });
  }

  /** Vận tốc của vật theo m/s. */
  velocityMps(body) {
    const v = Body.getVelocity(body);
    return { x: (v.x * 60) / this.scale, y: (v.y * 60) / this.scale };
  }

  _applySprings() {
    const alive = new Set(Composite.allBodies(this.world));
    this.springs = this.springs.filter(s => alive.has(s.bodyB) && (!s.bodyA || alive.has(s.bodyA)));

    for (const s of this.springs) {
      const { pA, pB } = this._springEnds(s);
      const dx = pB.x - pA.x, dy = pB.y - pA.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const ux = dx / len, uy = dy / len;
      const ext = (len - s.length) / this.scale;
      if (s.rope && ext <= 0) continue;

      const vB = this.velocityMps(s.bodyB);
      const vA = s.bodyA ? this.velocityMps(s.bodyA) : { x: 0, y: 0 };
      const vRel = (vB.x - vA.x) * ux + (vB.y - vA.y) * uy;
      const F = s.k * ext + s.c * vRel; // > 0: kéo hai đầu lại gần nhau

      if (!s.bodyB.isStatic) this.applyForceN(s.bodyB, pB, -F * ux, -F * uy);
      if (s.bodyA && !s.bodyA.isStatic) this.applyForceN(s.bodyA, pA, F * ux, F * uy);
    }
  }

  /**
   * Ma sát trượt F = μ·N = μ·m·g cho các vật có `slideMu`, đang trượt trên mặt
   * nằm ngang. Vật dừng hẳn khi tốc độ về 0 (không bị đẩy ngược lại).
   */
  _applySlidingFriction(dtSec) {
    Composite.allBodies(this.world).forEach(b => {
      if (b.isStatic || b.slideMu == null || b === this.mouseConstraint.body) return;
      const v = this.velocityMps(b);
      if (Math.abs(v.y) > 0.3) return; // đang rơi, chưa nằm trên mặt đỡ
      const dv = b.slideMu * this.gravityVal * dtSec;
      if (Math.abs(v.x) <= dv) {
        Body.setVelocity(b, { x: 0, y: Body.getVelocity(b).y });
      } else {
        this.applyForceN(b, b.position, -Math.sign(v.x) * b.slideMu * b.mass * this.gravityVal, 0);
      }
    });
  }

  /** Động năng, thế năng hấp dẫn và thế năng đàn hồi (J) của các vật tự do. */
  energy() {
    let ke = 0, pe = 0, elastic = 0;
    Composite.allBodies(this.world).forEach(b => {
      if (b.isStatic || this.isBoundary(b)) return;
      const v = this.velocityMps(b);
      ke += 0.5 * b.mass * (v.x * v.x + v.y * v.y);
      pe += b.mass * this.gravityVal * ((this.groundY - b.position.y) / this.scale);
    });
    for (const s of this.springs) {
      const ext = this.springExtensionM(s);
      if (!(s.rope && ext <= 0)) elastic += 0.5 * s.k * ext * ext;
    }
    return { ke, pe, elastic, total: ke + pe + elastic };
  }

  addPin(body, x, y) {
    const pin = Constraint.create({
      pointA: { x, y },
      bodyB: body,
      pointB: { x: x - body.position.x, y: y - body.position.y },
      stiffness: 1,
      length: 0
    });
    Composite.add(this.world, pin);
    return pin;
  }

  /* ------------------------------------------------------------------
     Physics tick
  ------------------------------------------------------------------ */

  updatePhysics(dt) {
    const effectiveDt = dt * this.timeScale;
    const subSteps = 4;
    const stepDt = (effectiveDt * 1000) / subSteps;

    const stepSec = stepDt / 1000;

    for (let i = 0; i < subSteps; i++) {
      // Lực cản không khí (mô hình minh họa): tỉ lệ với bình phương tốc độ
      if (this.airDrag > 0) {
        Composite.allBodies(this.world).forEach(b => {
          if (b.isStatic) return;
          const vx = b.velocity.x, vy = b.velocity.y;
          const speed = Math.hypot(vx, vy);
          if (speed > 0.01) {
            const mag = 0.5 * this.airDrag * speed * speed;
            Body.applyForce(b, b.position, {
              x: -mag * (vx / speed),
              y: -mag * (vy / speed)
            });
          }
        });
      }
      this._applySprings();
      this._applySlidingFriction(stepSec);
      Engine.update(this.engine, stepDt);

      this.simTime += stepSec;
      this.photogate.update(Composite.allBodies(this.world), this.simTime, this);
    }

    // Record motion trails
    Composite.allBodies(this.world).forEach(b => {
      if (b.isStatic || this.isBoundary(b)) return;
      if (!b.trail) b.trail = [];
      const last = b.trail[b.trail.length - 1];
      if (!last || Math.hypot(b.position.x - last.x, b.position.y - last.y) > 5) {
        b.trail.push({ x: b.position.x, y: b.position.y });
        if (b.trail.length > 120) b.trail.shift();
      }
    });
  }

  /* ------------------------------------------------------------------
     Rendering — all coordinates in CSS-pixel space
  ------------------------------------------------------------------ */

  render() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.cssWidth;
    const h = this.cssHeight;
    const ctx = this.ctx;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset & apply DPR scale

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#080c14');
    bgGrad.addColorStop(1, '#0c1121');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    if (this.showGrid)   this._drawGrid(ctx, w, h);
    this._drawGround(ctx, w, h);
    if (this.showTrails)  this._drawTrails(ctx);

    this._drawConstraints(ctx);
    this._drawSprings(ctx);
    this._drawBodies(ctx);

    if (this.showVectors) this._drawVectors(ctx);

    // Instruments overlay
    this.ruler.draw(ctx, (px) => this.toMeters(px));
    this.photogate.draw(ctx);

    // Selection highlight
    if (this.selectedBody && !this.isBoundary(this.selectedBody)) {
      this._drawSelection(ctx, this.selectedBody);
    }

    ctx.restore();
  }

  /* ---- Grid ---- */
  _drawGrid(ctx, w, h) {
    ctx.save();
    const step = this.scale / 2; // vạch mỗi 0,5 m
    const gy = this.groundY;

    ctx.lineWidth = 1;
    for (let i = 1, x = step; x < w; i++, x += step) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, gy); ctx.stroke();
    }
    for (let i = 0, y = gy; y > 0; i++, y -= step) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // Nhãn mỗi 1 m
    ctx.fillStyle = 'rgba(148,163,184,0.55)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textBaseline = 'middle';
    for (let x = this.scale; x < w; x += this.scale) {
      ctx.fillText(`${Math.round(x / this.scale)}m`, x + 2, gy + 14);
    }
    ctx.textAlign = 'right';
    for (let y = gy - this.scale; y > 0; y -= this.scale) {
      ctx.fillText(`${Math.round((gy - y) / this.scale)}m`, 30, y + 1);
    }
    ctx.restore();
  }

  /* ---- Ground surface ---- */
  _drawGround(ctx, w, h) {
    const gy = this.groundY;
    // Ground fill
    const grd = ctx.createLinearGradient(0, gy, 0, h);
    grd.addColorStop(0, 'rgba(30,41,59,0.95)');
    grd.addColorStop(1, 'rgba(15,23,42,1)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, gy, w, h - gy);

    // Ground line glow
    ctx.strokeStyle = 'rgba(56,189,248,0.5)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(56,189,248,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    ctx.shadowBlur = 0;

    // Hatch marks
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + 8, gy + 10);
      ctx.stroke();
    }
  }

  /* ---- Trails ---- */
  _drawTrails(ctx) {
    ctx.save();
    Composite.allBodies(this.world).forEach(b => {
      if (!b.trail || b.trail.length < 2) return;
      ctx.strokeStyle = this._trailColor(b);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(b.trail[0].x, b.trail[0].y);
      for (let i = 1; i < b.trail.length; i++) {
        ctx.lineTo(b.trail[i].x, b.trail[i].y);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  _trailColor(b) {
    if (!b.customColor) return 'rgba(56,189,248,0.5)';
    // Convert hex to rgba for trail transparency
    const hex = b.customColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const bl = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${bl},0.55)`;
  }

  /* ---- Bodies ---- */
  _drawBodies(ctx) {
    Composite.allBodies(this.world).forEach(b => {
      if (this.isBoundary(b)) return; // Don't draw boundary rectangles

      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);

      const color = b.customColor || '#38bdf8';

      if (b.circleRadius) {
        this._drawCircleBody(ctx, b, color);
      } else {
        this._drawPolygonBody(ctx, b, color);
      }

      ctx.restore();
    });
  }

  _drawCircleBody(ctx, b, color) {
    const r = b.circleRadius;

    // Glow halo
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Gradient sphere
    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.08, 0, 0, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, '#0f172a');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Spoke (angle indicator)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.85, 0);
    ctx.stroke();

    // Mass label (rotate back so text is upright)
    ctx.rotate(-b.angle);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.isStatic ? '⚓' : `${b.mass.toFixed(1).replace('.', ',')} kg`, 0, r + 14);
  }

  _drawPolygonBody(ctx, b, color) {
    ctx.beginPath();
    const verts = b.vertices;
    ctx.moveTo(verts[0].x - b.position.x, verts[0].y - b.position.y);
    for (let i = 1; i < verts.length; i++) {
      ctx.lineTo(verts[i].x - b.position.x, verts[i].y - b.position.y);
    }
    ctx.closePath();

    if (b.isStatic) {
      ctx.fillStyle = 'rgba(71,85,105,0.9)';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Static hatch pattern overlay
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      const bounds = b.bounds;
      const bw = bounds.max.x - bounds.min.x;
      const bh = bounds.max.y - bounds.min.y;
      for (let d = -bw; d < bw + bh; d += 10) {
        ctx.beginPath();
        ctx.moveTo(d - bh - b.position.x + bounds.min.x, bounds.min.y - b.position.y);
        ctx.lineTo(d - b.position.x + bounds.min.x, bounds.max.y - b.position.y);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Subtle gradient fill
      ctx.fillStyle = color + 'cc';
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Mass label
    ctx.rotate(-b.angle);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = b.isStatic ? (b.label || '') : `${b.mass.toFixed(1).replace('.', ',')} kg`;
    ctx.fillText(label, 0, 0);
  }

  /* ---- Constraints (springs, pins, rods) ---- */
  _drawConstraints(ctx) {
    Composite.allConstraints(this.world).forEach(c => {
      if (c === this.mouseConstraint.constraint) {
        // Mouse drag line
        if (this.mouseConstraint.body) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56,189,248,0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          const pa = this.mouse.position;
          const pb = this.mouseConstraint.body.position;
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
          ctx.restore();
        }
        return;
      }

      const pA = c.bodyA
        ? Vector.add(c.bodyA.position, c.pointA || { x: 0, y: 0 })
        : c.pointA;
      const pB = c.bodyB
        ? Vector.add(c.bodyB.position, c.pointB || { x: 0, y: 0 })
        : (c.pointB || { x: 0, y: 0 });

      ctx.save();
      if (c.length === 0) {
        // Pin joint
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pA.x, pA.y, 6, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Dây treo / thanh nối
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.stroke();
      }
      ctx.restore();
    });
  }

  _drawSprings(ctx) {
    for (const s of this.springs) {
      const { pA, pB } = this._springEnds(s);
      ctx.save();
      if (s.rope) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.stroke();
      } else {
        this._drawSpringCoil(ctx, pA, pB);
      }
      if (!s.bodyA) {
        // Giá treo cố định
        ctx.fillStyle = '#64748b';
        ctx.fillRect(pA.x - 30, pA.y - 8, 60, 8);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(pA.x, pA.y, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawSpringCoil(ctx, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const angle = Math.atan2(dy, dx);
    const coils = 14;

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // Coil wire
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const step = dist / coils;
    const amp = 7;
    for (let i = 1; i <= coils; i++) {
      ctx.lineTo((i - 0.5) * step, (i % 2 === 0 ? amp : -amp));
    }
    ctx.lineTo(dist, 0);
    ctx.stroke();

    // End dots
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(dist, 0, 3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  /* ---- Kinematic Vectors ---- */
  _drawVectors(ctx) {
    Composite.allBodies(this.world).forEach(b => {
      if (b.isStatic || this.isBoundary(b)) return;
      const px = b.position.x, py = b.position.y;
      const vx = b.velocity.x, vy = b.velocity.y;

      // Velocity vector
      const vScale = 6;
      if (Math.hypot(vx, vy) > 0.15) {
        this._drawArrow(ctx, px, py, px + vx * vScale, py + vy * vScale, '#10b981', 2.5, 'v');
      }

      // Gravity vector P = mg
      if (this.gravityVal > 0) {
        const pMag = Math.min(70, 12 + b.mass * this.gravityVal * 1.5);
        this._drawArrow(ctx, px, py, px, py + pMag, '#ef4444', 2, 'P');
      }
    });
  }

  _drawArrow(ctx, x1, y1, x2, y2, color, width, label) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 4) return;
    const angle = Math.atan2(dy, dx);
    const head = 7;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - 0.45), y2 - head * Math.sin(angle - 0.45));
    ctx.lineTo(x2 - head * Math.cos(angle + 0.45), y2 - head * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, x2 + 5, y2 - 3);
    }
    ctx.restore();
  }

  /* ---- Selection outline ---- */
  _drawSelection(ctx, body) {
    ctx.save();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 8;

    const { min, max } = body.bounds;
    const pad = 8;
    ctx.strokeRect(min.x - pad, min.y - pad, max.x - min.x + pad * 2, max.y - min.y + pad * 2);
    ctx.restore();
  }

  /* ------------------------------------------------------------------
     Mouse / Touch event handling
  ------------------------------------------------------------------ */

  setupEvents() {
    let downPos = { x: 0, y: 0 };

    const getCSSPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // Pointer events: dùng được cả chuột lẫn ngón tay trên bảng tương tác
    this.canvas.addEventListener('pointerdown', (e) => {
      const pos = getCSSPos(e);
      downPos = { ...pos };

      // Instruments first
      if (this.ruler.handleMouseDown(pos)) return;
      if (this.photogate.handleMouseDown(pos)) return;

      // Tool-specific click actions
      switch (this.activeTool) {
        case 'add-box':
          this.addBox(pos.x, pos.y, 50, 50);
          return;
        case 'add-circle':
          this.addCircle(pos.x, pos.y, 22);
          return;
        case 'add-ramp':
          this.addRamp(pos.x, pos.y, 170, 20, -Math.PI / 6);
          return;
        case 'add-pin': {
          const hit = this.getBodyAt(pos);
          if (hit && !this.isBoundary(hit)) this.addPin(hit, pos.x, pos.y);
          return;
        }
        case 'add-spring': {
          const hit = this.getBodyAt(pos);
          if (hit && !this.isBoundary(hit)) {
            if (!this.springFirstBody) {
              this.springFirstBody = hit;
            } else if (this.springFirstBody !== hit) {
              this.addSpring(this.springFirstBody, hit);
              this.springFirstBody = null;
            }
          }
          return;
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      const pos = getCSSPos(e);
      this.ruler.handleMouseMove(pos);
      this.photogate.handleMouseMove(pos);
    });

    window.addEventListener('pointerup', (e) => {
      const pos = getCSSPos(e);
      this.ruler.handleMouseUp();
      this.photogate.handleMouseUp();

      // Detect click (not drag) to select object for inspector
      if (Math.hypot(pos.x - downPos.x, pos.y - downPos.y) < 6 && this.activeTool === 'drag') {
        const hit = this.getBodyAt(pos);
        if (hit && !this.isBoundary(hit)) {
          this.selectedBody = hit;
          if (this.onSelectCallback) this.onSelectCallback(hit);
        } else {
          this.selectedBody = null;
          if (this.onSelectCallback) this.onSelectCallback(null);
        }
      }
    });
  }

  getBodyAt(pos) {
    const bodies = Composite.allBodies(this.world);
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      if (Bounds.contains(b.bounds, pos) && Vertices.contains(b.vertices, pos)) {
        return b;
      }
    }
    return null;
  }
}
