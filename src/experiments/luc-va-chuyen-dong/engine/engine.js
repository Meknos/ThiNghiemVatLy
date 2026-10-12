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
 *  - A separate `scale` factor converts CSS pixels ↔ metres for display labels.
 *  - The ground plane sits 50 CSS-px above the canvas bottom so labels aren't clipped.
 */
export class PhysicsEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // --- Coordinate system ---
    // 1 metre = this.scale CSS-pixels
    this.scale = 25.0;
    this.timeScale = 1.0;
    this.gravityVal = 9.80; // m/s²
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
      gravity: { x: 0, y: 1.0, scale: 0.001 * (this.gravityVal / 9.8) }
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
    this.selectedBody = null;
    this.simTime = 0;
    this.photogate.log = [];
    this.photogate.lastTriggeredTime = 0;
    if (this.onSelectCallback) this.onSelectCallback(null);
    this.render();
  }

  setGravity(g) {
    this.gravityVal = g;
    this.engine.gravity.y = g === 0 ? 0 : 1.0;
    this.engine.gravity.scale = g === 0 ? 0 : (g / 9.8) * 0.001;
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

  addSpring(bodyA, bodyB, length, stiffness = 0.05, damping = 0.02) {
    const spring = Constraint.create({
      bodyA, bodyB,
      length: length || Vector.magnitude(Vector.sub(bodyA.position, bodyB.position)),
      stiffness, damping,
      render: { type: 'spring' }
    });
    Composite.add(this.world, spring);
    return spring;
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

    for (let i = 0; i < subSteps; i++) {
      // Apply quadratic air drag  F = -½ k |v|² v̂
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
      Engine.update(this.engine, stepDt);
    }

    this.simTime += effectiveDt;

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

    // Photogate sensor
    this.photogate.checkCollision(
      Composite.allBodies(this.world),
      this.simTime,
      (v) => this.toMetersSpeed(v)
    );
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
    const step = this.scale * 2; // Every 2 m
    const gy = this.groundY;

    // Vertical lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = step; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, gy); ctx.stroke();
    }
    // Horizontal lines
    for (let y = gy; y > 0; y -= step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // Labels
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textBaseline = 'middle';
    for (let x = step; x < w; x += step) {
      ctx.fillText(`${Math.round(x / this.scale)}m`, x + 2, gy + 14);
    }
    ctx.textAlign = 'right';
    for (let y = gy - step; y > 0; y -= step) {
      const m = Math.round((gy - y) / this.scale);
      ctx.fillText(`${m}m`, 30, y + 1);
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
    ctx.fillText(b.isStatic ? '⚓' : `${b.mass.toFixed(1)}kg`, 0, r + 14);
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
    const label = b.isStatic ? (b.label || 'Static') : `${b.mass.toFixed(1)}kg`;
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
        // Spring coil
        this._drawSpringCoil(ctx, pA, pB);
      }
      ctx.restore();
    });
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
      const vScale = 4;
      if (Math.hypot(vx, vy) > 0.15) {
        this._drawArrow(ctx, px, py, px + vx * vScale, py + vy * vScale, '#10b981', 2.5, 'v⃗');
      }

      // Gravity vector P = mg
      if (this.gravityVal > 0) {
        const pMag = Math.min(55, b.mass * this.gravityVal * 1.2);
        this._drawArrow(ctx, px, py, px, py + pMag, '#ef4444', 2, 'P⃗');
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

    this.canvas.addEventListener('mousedown', (e) => {
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

    window.addEventListener('mousemove', (e) => {
      const pos = getCSSPos(e);
      this.ruler.handleMouseMove(pos);
      this.photogate.handleMouseMove(pos);
    });

    window.addEventListener('mouseup', (e) => {
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
