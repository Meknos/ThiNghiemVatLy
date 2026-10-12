import Matter from 'matter-js';

export class ObjectInspector {
  constructor(engine) {
    this.engine = engine;
    this.selectedBody = null;

    // DOM
    this.emptyState = document.getElementById('inspectorEmptyState');
    this.content    = document.getElementById('inspectorContent');
    this.lblType    = document.getElementById('inspObjType');
    this.lblStatic  = document.getElementById('inspObjStatic');

    this.valPosX   = document.getElementById('inspPosX');
    this.valPosY   = document.getElementById('inspPosY');
    this.valSpeed  = document.getElementById('inspSpeed');
    this.valAngle  = document.getElementById('inspAngle');

    this.rangeMass        = document.getElementById('rangeInspMass');
    this.valMass          = document.getElementById('valInspMass');
    this.rangeFriction    = document.getElementById('rangeInspFriction');
    this.valFriction      = document.getElementById('valInspFriction');
    this.rangeRestitution = document.getElementById('rangeInspRestitution');
    this.valRestitution   = document.getElementById('valInspRestitution');
    this.chkStatic        = document.getElementById('chkInspStatic');

    this.btnImpulse   = document.getElementById('btnApplyImpulse');
    this.btnDuplicate = document.getElementById('btnDuplicateObj');
    this.btnDelete    = document.getElementById('btnDeleteObj');

    this._bindControls();
  }

  setBody(body) {
    this.selectedBody = body;

    if (!body || this.engine.isBoundary(body)) {
      this.emptyState.style.display = 'flex';
      this.content.style.display = 'none';
      return;
    }

    this.emptyState.style.display = 'none';
    this.content.style.display    = 'flex';

    this.lblType.textContent = body.label || (body.circleRadius ? 'Quả Cầu' : 'Khối Hộp');

    this._updateStaticBadge(body.isStatic);

    this.rangeMass.value      = Math.max(0.1, Math.min(20, body.mass));
    this.valMass.textContent  = `${body.mass.toFixed(1)} kg`;
    this.rangeFriction.value     = body.friction;
    this.valFriction.textContent = body.friction.toFixed(2);
    this.rangeRestitution.value     = body.restitution;
    this.valRestitution.textContent = body.restitution.toFixed(2);
    this.chkStatic.checked = body.isStatic;

    this.updateLiveValues();
  }

  updateLiveValues() {
    if (!this.selectedBody || this.engine.isBoundary(this.selectedBody)) return;
    const b = this.selectedBody;

    const xm = this.engine.toMeters(b.position.x);
    const ym = this.engine.bodyHeightM(b);
    const spd = this.engine.toMetersSpeed(Math.hypot(b.velocity.x, b.velocity.y));
    const angleDeg = ((b.angle * 180 / Math.PI) % 360);

    this.valPosX.textContent  = `${xm.toFixed(2)} m`;
    this.valPosY.textContent  = `${ym.toFixed(2)} m`;
    this.valSpeed.textContent = `${spd.toFixed(2)} m/s`;
    this.valAngle.textContent = `${angleDeg.toFixed(1)}°`;
  }

  _updateStaticBadge(isStatic) {
    this.lblStatic.textContent = isStatic ? 'Cố Định' : 'Tự Do';
    this.lblStatic.style.background = isStatic
      ? 'rgba(245,158,11,0.15)'
      : 'rgba(16,185,129,0.15)';
    this.lblStatic.style.color = isStatic
      ? 'var(--amber-400)'
      : 'var(--emerald-400)';
    this.lblStatic.style.borderColor = isStatic
      ? 'rgba(245,158,11,0.3)'
      : 'rgba(16,185,129,0.3)';
  }

  _bindControls() {
    this.rangeMass.addEventListener('input', (e) => {
      if (!this.selectedBody || this.selectedBody.isStatic) return;
      const m = parseFloat(e.target.value);
      this.valMass.textContent = `${m.toFixed(1)} kg`;
      Matter.Body.setMass(this.selectedBody, m);
    });

    this.rangeFriction.addEventListener('input', (e) => {
      if (!this.selectedBody) return;
      this.selectedBody.friction = parseFloat(e.target.value);
      this.valFriction.textContent = this.selectedBody.friction.toFixed(2);
    });

    this.rangeRestitution.addEventListener('input', (e) => {
      if (!this.selectedBody) return;
      this.selectedBody.restitution = parseFloat(e.target.value);
      this.valRestitution.textContent = this.selectedBody.restitution.toFixed(2);
    });

    this.chkStatic.addEventListener('change', (e) => {
      if (!this.selectedBody) return;
      Matter.Body.setStatic(this.selectedBody, e.target.checked);
      this._updateStaticBadge(e.target.checked);
    });

    this.btnImpulse.addEventListener('click', () => {
      if (!this.selectedBody || this.selectedBody.isStatic) return;
      Matter.Body.applyForce(this.selectedBody, this.selectedBody.position, {
        x: 0.06 * this.selectedBody.mass,
        y: -0.04 * this.selectedBody.mass
      });
    });

    this.btnDuplicate.addEventListener('click', () => {
      if (!this.selectedBody) return;
      const b = this.selectedBody;
      const off = 50;
      let clone;
      if (b.circleRadius) {
        clone = this.engine.addCircle(b.position.x + off, b.position.y - off, b.circleRadius, {
          density: b.density, friction: b.friction, restitution: b.restitution,
          isStatic: b.isStatic, color: b.customColor,
          label: (b.label || 'Vật') + ' (Bản sao)'
        });
      } else {
        const bw = b.bounds.max.x - b.bounds.min.x;
        const bh = b.bounds.max.y - b.bounds.min.y;
        clone = this.engine.addBox(b.position.x + off, b.position.y - off, bw, bh, {
          density: b.density, friction: b.friction, restitution: b.restitution,
          isStatic: b.isStatic, color: b.customColor, angle: b.angle,
          label: (b.label || 'Khối') + ' (Bản sao)'
        });
      }
      this.engine.selectedBody = clone;
      this.setBody(clone);
    });

    this.btnDelete.addEventListener('click', () => {
      if (!this.selectedBody) return;
      Matter.Composite.remove(this.engine.world, this.selectedBody);
      this.setBody(null);
      this.engine.selectedBody = null;
    });
  }
}
