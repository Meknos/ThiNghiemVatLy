import { describe, it, expect, beforeAll } from 'vitest';
import Matter from 'matter-js';
import { PhysicsEngine } from './engine/engine.js';
import { PRESET_EXPERIMENTS } from './engine/scenarios.js';

// Các phép thử này chạy engine thật (Matter.js + lực tự tính), không phải tính tay công thức.

const W = 900, H = 620;

function makeEngine(): any {
  const noop = () => {};
  const ctx: any = new Proxy(function () {}, {
    get: (_t, prop) => (prop === 'canvas' ? null : () => ctx),
    set: () => true
  });
  const canvas = {
    width: W,
    height: H,
    style: {},
    dataset: {},
    getContext: () => ctx,
    addEventListener: noop,
    removeEventListener: noop,
    getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: W, height: H })
  };
  return new PhysicsEngine(canvas as any);
}

function run(engine: any, seconds: number, eachFrame?: () => void) {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    engine.updatePhysics(1 / 60);
    eachFrame?.();
  }
}

function load(id: string, overrides: Record<string, number> = {}) {
  const engine = makeEngine();
  const preset: any = PRESET_EXPERIMENTS.find((p: any) => p.id === id);
  const st = { ...preset.initial(), ...overrides };
  preset.setup(engine, W, H, st);
  return { engine, preset, st };
}

beforeAll(() => {
  (globalThis as any).window = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
});

describe('Cơ học THCS — kiểm tra trên engine mô phỏng', () => {
  it('rơi tự do 1 s từ trạng thái nghỉ: quãng đường 5 m, tốc độ 10 m/s (g = 10)', () => {
    const engine = makeEngine();
    const ball = engine.addCircle(200, 20, 10, { mass: 1 });
    const y0 = ball.position.y;
    run(engine, 1);
    expect((ball.position.y - y0) / engine.scale).toBeCloseTo(5, 0);
    expect(Math.abs((ball.position.y - y0) / engine.scale - 5)).toBeLessThan(0.1);
    expect(engine.velocityMps(ball).y).toBeCloseTo(10, 0);
  });

  it('lò xo: độ giãn khi cân bằng bằng P/k và tỉ lệ thuận với khối lượng', () => {
    const ext = [0.5, 1].map((m) => {
      const { engine, st } = load('hooke_spring', { m });
      run(engine, 15);
      return engine.springExtensionM(st.spring);
    });
    expect(Math.abs(ext[0] - 0.25) / 0.25).toBeLessThan(0.02); // 0,5 kg → 5 N / 20 N/m
    expect(Math.abs(ext[1] - 0.5) / 0.5).toBeLessThan(0.02);
    expect(ext[1] / ext[0]).toBeCloseTo(2, 1);
  });

  it('ma sát trượt: quãng đường dừng bằng v²/(2μg), mặt càng nhám dừng càng sớm', () => {
    const { engine, st } = load('friction_surfaces', { v0: 2 });
    run(engine, 6);
    const s = st.blocks.map((b: any) => (b.body.position.x - b.x0) / engine.scale);
    st.blocks.forEach((b: any, k: number) => {
      const theory = (2 * 2) / (2 * b.mu * 10);
      expect(Math.abs(s[k] - theory) / theory).toBeLessThan(0.05);
    });
    expect(s[0]).toBeGreaterThan(s[1]);
    expect(s[1]).toBeGreaterThan(s[2]);
  });

  it('cổng quang: v = d/t khớp với tốc độ thật của xe khi đi qua cổng', () => {
    const { engine, st } = load('photogate_speed', { v0: 2 });
    let speedAtGate = 0;
    run(engine, 4, () => {
      if (engine.photogate.blocking) speedAtGate = Math.abs(engine.velocityMps(st.cart).x);
    });
    const rec = engine.photogate.lastRecord;
    expect(rec).toBeTruthy();
    expect(rec.width).toBeCloseTo(0.5, 2);
    expect(Math.abs(Number(rec.speed) - speedAtGate) / speedAtGate).toBeLessThan(0.03);
  });

  it('đòn bẩy: nằm ngang khi F₁·d₁ = F₂·d₂, nghiêng về bên có mô men lớn hơn', () => {
    const balanced = load('lever_balance');
    run(balanced.engine, 10);
    expect(Math.abs(balanced.st.bar.angle) * (180 / Math.PI)).toBeLessThan(1.5);

    const heavyRight = load('lever_balance', { d2: 1.0 }); // 4 kg × 1,0 m > 2 kg × 1,2 m
    run(heavyRight.engine, 10);
    expect(heavyRight.st.bar.angle * (180 / Math.PI)).toBeGreaterThan(5);

    const heavyLeft = load('lever_balance', { d2: 0.2 });
    run(heavyLeft.engine, 10);
    expect(heavyLeft.st.bar.angle * (180 / Math.PI)).toBeLessThan(-5);
  });

  it('con lắc: cơ năng được bảo toàn khi không có lực cản', () => {
    const { engine, preset, st } = load('energy_transformation', { angle: 40 });
    const W0 = st.W0;
    let maxDrift = 0;
    let maxKe = 0;
    run(engine, 12, () => {
      const hud = preset.hud(engine, st);
      const total = hud[2].bar * W0;
      maxDrift = Math.max(maxDrift, Math.abs(total - W0) / W0);
      maxKe = Math.max(maxKe, hud[1].bar * W0);
    });
    expect(maxDrift).toBeLessThan(0.03);
    expect(maxKe / W0).toBeGreaterThan(0.95); // ở vị trí thấp nhất, thế năng đã chuyển hết thành động năng
  });
});

describe('Thao tác trực tiếp lên vật', () => {
  it('đòn bẩy: kéo quả nặng dọc thanh thì cánh tay đòn đổi theo và thanh nghiêng về phía đó', () => {
    const { engine, preset, st } = load('lever_balance');
    run(engine, 4);

    // Giả lập việc cầm vật 2 kéo ra cách điểm tựa 1,0 m
    engine.mouseConstraint.body = st.w2;
    Matter.Body.setPosition(st.w2, { x: st.pivotX + 1.0 * engine.scale, y: st.w2.position.y });
    preset.update(engine, st);
    engine.mouseConstraint.body = null;

    expect(st.d2).toBeCloseTo(1.0, 5);
    run(engine, 10, () => preset.update(engine, st));
    expect(st.bar.angle * (180 / Math.PI)).toBeGreaterThan(5);
    expect(preset.hud(engine, st)[3].value).toContain('vật 2');
  });

  it('lò xo: đổi khối lượng quả nặng thì số liệu đọc theo khối lượng mới', () => {
    const { engine, preset, st } = load('hooke_spring');
    preset.actions[0].run(engine, st); // treo thêm 0,5 kg
    preset.update(engine, st);
    expect(st.weight.mass).toBeCloseTo(1, 5);
    run(engine, 15, () => preset.update(engine, st));
    expect(engine.springExtensionM(st.spring)).toBeCloseTo(0.5, 1); // 10 N / 20 N/m
  });
});
