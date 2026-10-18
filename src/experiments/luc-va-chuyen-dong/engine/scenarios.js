/**
 * AIPLab Studio — Các bài thí nghiệm cơ học theo chương trình KHTN THCS.
 *
 * Mỗi bài có:
 *  - setup(engine, w, h, st): dựng cảnh; st là trạng thái riêng của bài (giữ qua các lần dựng lại).
 *  - hud(engine, st): các số liệu đo hiển thị cho giáo viên, dạng [{ label, value, bar?, color? }].
 *  - actions: các nút thao tác, mỗi nút { label, run(engine, st), rebuild? }.
 *
 * Đơn vị: 1 m = engine.scale px, khối lượng tính bằng kg, lực tính bằng N.
 */
import Matter from 'matter-js';

const fmt = (x, digits = 2) => x.toFixed(digits).replace('.', ',');

function setMass(body, m) {
  Matter.Body.setMass(body, m);
}

/** Đặt vận tốc cho vật theo m/s. */
function setVelocityMps(engine, body, vx, vy) {
  Matter.Body.setVelocity(body, { x: (vx * engine.scale) / 60, y: (vy * engine.scale) / 60 });
}

export const PRESET_EXPERIMENTS = [
  {
    id: 'hooke_spring',
    title: 'Lò xo treo quả nặng',
    grade: 6,
    desc: 'Độ giãn của lò xo treo thẳng đứng tỉ lệ thuận với khối lượng vật treo.',
    initial: () => ({ m: 0.5 }),
    setup: (engine, w, h, st) => {
      engine.clear();
      const ax = w / 2, ay = 50;
      const restLen = 110;
      st.k = 20; // N/m

      st.weight = engine.addBox(ax, ay + restLen + 22, 60, 44, {
        mass: st.m,
        friction: 0.2,
        restitution: 0.1,
        color: '#38bdf8',
        label: 'Quả nặng'
      });
      st.spring = engine.addSpring(null, st.weight, restLen, st.k, 1.2, {
        pointA: { x: ax, y: ay },
        offsetB: { x: 0, y: -22 }
      });

      // Thước thẳng đứng đặt cạnh lò xo, vạch 0 ngang đầu dưới lò xo khi chưa treo vật
      engine.ruler.p1 = { x: ax - 90, y: ay + restLen };
      engine.ruler.p2 = { x: ax - 90, y: ay + restLen + 200 };
      engine.ruler.show();
    },
    update: (engine, st) => { st.m = st.weight.mass; },
    hud: (engine, st) => {
      const P = st.m * engine.gravityVal;
      return [
        { label: 'Khối lượng vật treo m', value: `${fmt(st.m, 1)} kg` },
        { label: 'Trọng lượng P = 10·m', value: `${fmt(P, 1)} N` },
        { label: 'Độ giãn lò xo đo được', value: `${fmt(engine.springExtensionM(st.spring) * 100, 1)} cm`, color: '#38bdf8' },
        { label: 'Độ giãn khi cân bằng', value: `${fmt((P / st.k) * 100, 1)} cm` }
      ];
    },
    actions: [
      {
        label: '＋ Treo thêm 0,5 kg',
        run: (engine, st) => {
          st.m = Math.min(2, st.weight.mass + 0.5);
          setMass(st.weight, st.m);
        }
      },
      {
        label: '－ Bớt 0,5 kg',
        run: (engine, st) => {
          st.m = Math.max(0.5, st.weight.mass - 0.5);
          setMass(st.weight, st.m);
        }
      }
    ]
  },
  {
    id: 'friction_surfaces',
    title: 'Lực ma sát trượt trên các bề mặt',
    grade: 6,
    desc: 'Ba khối gỗ giống nhau được đẩy với cùng tốc độ trên ba mặt khác nhau: mặt càng nhám, lực ma sát càng lớn, khối gỗ dừng càng sớm.',
    initial: () => ({ v0: 2 }),
    setup: (engine, w, h, st) => {
      engine.clear();
      const gy = engine.groundY;
      const lanes = [
        { name: 'Mặt băng (trơn)', mu: 0.1, color: '#38bdf8' },
        { name: 'Mặt gỗ', mu: 0.3, color: '#f59e0b' },
        { name: 'Mặt giấy nhám', mu: 0.6, color: '#f43f5e' }
      ];
      const shelfW = w - 120;
      st.blocks = lanes.map((lane, k) => {
        const top = gy - 70 - k * 120;
        const shelf = engine.addRamp(w / 2, top + 8, shelfW, 16, 0, {
          friction: 0,
          restitution: 0,
          label: lane.name
        });
        shelf.customColor = lane.color;

        const x0 = w / 2 - shelfW / 2 + 50;
        const body = engine.addBox(x0, top - 18, 60, 36, {
          mass: 1,
          friction: 0,
          restitution: 0,
          color: lane.color,
          label: `Khối gỗ trên ${lane.name.toLowerCase()}`
        });
        body.slideMu = lane.mu;
        setVelocityMps(engine, body, st.v0, 0);
        return { ...lane, body, x0 };
      });
    },
    hud: (engine, st) =>
      st.blocks.flatMap(b => [
        {
          label: `${b.name}: lực ma sát`,
          value: `${fmt(b.mu * b.body.mass * engine.gravityVal, 1)} N`
        },
        {
          label: 'Quãng đường trượt',
          value: `${fmt(Math.max(0, b.body.position.x - b.x0) / engine.scale)} m`,
          color: b.color
        }
      ]),
    actions: [
      { label: 'Đẩy nhẹ (1 m/s)', rebuild: true, run: (engine, st) => { st.v0 = 1; } },
      { label: 'Đẩy vừa (2 m/s)', rebuild: true, run: (engine, st) => { st.v0 = 2; } }
    ]
  },
  {
    id: 'photogate_speed',
    title: 'Đo tốc độ bằng cổng quang điện',
    grade: 7,
    desc: 'Xe có tấm chắn sáng rộng d đi qua cổng quang. Đồng hồ đo thời gian t tấm chắn che tia sáng, từ đó tính tốc độ v = d / t.',
    initial: () => ({ v0: 2 }),
    setup: (engine, w, h, st) => {
      engine.clear();
      const gy = engine.groundY;

      st.cart = engine.addBox(90, gy - 18, 50, 36, {
        mass: 1,
        friction: 0,
        restitution: 0.2,
        color: '#10b981',
        label: 'Xe có tấm chắn sáng'
      });
      st.cart.slideMu = 0.02; // đệm khí: ma sát rất nhỏ
      setVelocityMps(engine, st.cart, st.v0, 0);

      engine.photogate.x = Math.round(w * 0.55);
      engine.photogate.y = gy - 45;
      engine.photogate.show();

      // Thước đo bề rộng tấm chắn sáng d
      engine.ruler.p1 = { x: 65, y: gy - 60 };
      engine.ruler.p2 = { x: 115, y: gy - 60 };
      engine.ruler.show();
    },
    hud: (engine, st) => {
      const r = engine.photogate.lastRecord;
      return [
        { label: 'Bề rộng tấm chắn sáng d', value: '0,50 m' },
        { label: 'Thời gian chắn sáng t', value: r ? `${fmt(r.blockTime, 3)} s` : '—' },
        { label: 'Tốc độ v = d / t', value: r ? `${String(r.speed).replace('.', ',')} m/s` : '—', color: '#34d399' },
        { label: 'Tốc độ xe lúc này', value: `${fmt(Math.abs(engine.velocityMps(st.cart).x))} m/s` }
      ];
    },
    actions: [
      { label: 'Đẩy chậm (1 m/s)', rebuild: true, run: (engine, st) => { st.v0 = 1; } },
      { label: 'Đẩy vừa (2 m/s)', rebuild: true, run: (engine, st) => { st.v0 = 2; } },
      { label: 'Đẩy nhanh (4 m/s)', rebuild: true, run: (engine, st) => { st.v0 = 4; } }
    ]
  },
  {
    id: 'lever_balance',
    title: 'Đòn bẩy và mô men lực',
    grade: 8,
    desc: 'Đòn bẩy cân bằng khi mô men lực hai bên bằng nhau: F₁·d₁ = F₂·d₂.',
    initial: () => ({ m1: 2, d1: 1.2, m2: 4, d2: 0.6 }),
    setup: (engine, w, h, st) => {
      engine.clear();
      const gy = engine.groundY;
      const px = w / 2;
      const py = gy - 240;
      const S = engine.scale;
      const BAR = 0x0004, STOP = 0x0008;

      // Giá đỡ: chỉ để nhìn, không va chạm
      const post = engine.addBox(px, (py + gy) / 2 + 8, 14, gy - py - 16, {
        isStatic: true,
        label: ' '
      });
      post.collisionFilter.mask = 0;

      // Thanh đòn bẩy, trục quay O nằm ngay trên trọng tâm thanh nên thanh tự cân bằng
      st.bar = engine.addBox(px, py + 5, 400, 12, {
        mass: 1,
        friction: 0.4,
        frictionAir: 0.03,
        color: '#38bdf8',
        label: 'Thanh đòn bẩy'
      });
      st.bar.collisionFilter.category = BAR;
      engine.addPin(st.bar, px, py);

      // Hai chốt chặn giới hạn góc nghiêng của thanh
      [-1, 1].forEach(side => {
        const stop = engine.addBox(px + side * 185, py + 78, 16, 8, { isStatic: true, label: ' ' });
        stop.collisionFilter.category = STOP;
        stop.collisionFilter.mask = BAR;
      });

      const hang = (m, d, side, color, name) => {
        const weight = engine.addBox(px + side * d * S, py + 5 + 110, 46, 40, {
          mass: m,
          frictionAir: 0.02,
          color,
          label: name
        });
        weight.collisionFilter.mask = 0xFFFFFFFF & ~STOP & ~BAR;
        engine.addSpring(st.bar, weight, 90, 3000, 25, {
          offsetA: { x: side * d * S, y: 0 },
          offsetB: { x: 0, y: -20 },
          rope: true
        });
        return weight;
      };
      st.w1 = hang(st.m1, st.d1, -1, '#f59e0b', 'Vật 1');
      st.w2 = hang(st.m2, st.d2, 1, '#10b981', 'Vật 2');
      st.pivotX = px;
    },
    // Cầm một quả nặng kéo sang ngang: điểm treo trượt theo dọc thanh (bước 0,1 m)
    update: (engine, st) => {
      // Dù bị giật mạnh, thanh cũng không quay vượt qua hai chốt chặn
      const limit = 0.45;
      if (Math.abs(st.bar.angle) > limit) {
        Matter.Body.setAngle(st.bar, Math.sign(st.bar.angle) * limit);
        Matter.Body.setAngularVelocity(st.bar, 0);
      }
      st.m1 = st.w1.mass;
      st.m2 = st.w2.mass;
      const dragged = engine.mouseConstraint.body;
      [[st.w1, -1, 'd1'], [st.w2, 1, 'd2']].forEach(([weight, side, key]) => {
        if (dragged !== weight) return;
        const rope = engine.springs.find(s => s.bodyB === weight);
        const d = Math.round((side * (weight.position.x - st.pivotX)) / engine.scale * 10) / 10;
        st[key] = Math.max(0.2, Math.min(1.8, d));
        rope.offsetA.x = side * st[key] * engine.scale;
      });
    },
    hud: (engine, st) => {
      const g = engine.gravityVal;
      const M1 = st.m1 * g * st.d1, M2 = st.m2 * g * st.d2;
      const tilt = (st.bar.angle * 180) / Math.PI;
      const state = Math.abs(M1 - M2) < 0.05
        ? 'Cân bằng'
        : M1 > M2 ? 'Nghiêng về phía vật 1' : 'Nghiêng về phía vật 2';
      return [
        { label: `Vật 1: F₁ = ${fmt(st.m1 * g, 0)} N, d₁ = ${fmt(st.d1, 1)} m`, value: `${fmt(M1, 1)} N·m`, color: '#f59e0b' },
        { label: `Vật 2: F₂ = ${fmt(st.m2 * g, 0)} N, d₂ = ${fmt(st.d2, 1)} m`, value: `${fmt(M2, 1)} N·m`, color: '#10b981' },
        { label: 'Góc nghiêng của thanh', value: `${fmt(Math.abs(tilt), 1)}°` },
        { label: 'Trạng thái', value: state }
      ];
    },
    actions: [
      { label: 'Vật 2 ra xa điểm tựa (+0,2 m)', rebuild: true, run: (engine, st) => { st.d2 = Math.min(1.8, +(st.d2 + 0.2).toFixed(1)); } },
      { label: 'Vật 2 lại gần (−0,2 m)', rebuild: true, run: (engine, st) => { st.d2 = Math.max(0.2, +(st.d2 - 0.2).toFixed(1)); } },
      { label: 'Về vị trí cân bằng', rebuild: true, run: (engine, st) => { st.d2 = (st.m1 * st.d1) / st.m2; } }
    ]
  },
  {
    id: 'energy_transformation',
    title: 'Chuyển hóa động năng và thế năng',
    grade: 9,
    desc: 'Con lắc dao động: thế năng chuyển hóa thành động năng và ngược lại. Khi bỏ qua lực cản, cơ năng được bảo toàn.',
    initial: () => ({ angle: 40 }),
    setup: (engine, w, h, st) => {
      engine.clear();
      const px = w / 2, py = 40;
      const L = Math.min(300, engine.groundY - py - 70);
      const th = (st.angle * Math.PI) / 180;
      st.lowestY = py + L;

      st.bob = engine.addCircle(px - L * Math.sin(th), py + L * Math.cos(th), 22, {
        mass: 1,
        friction: 0,
        restitution: 0.2,
        color: '#ec4899',
        label: 'Quả nặng con lắc'
      });
      // Dây treo: lò xo rất cứng, không giảm chấn nên không làm hao cơ năng
      engine.addSpring(null, st.bob, L, 6000, 0, { pointA: { x: px, y: py }, rope: true });
      st.W0 = st.bob.mass * engine.gravityVal * ((st.lowestY - st.bob.position.y) / engine.scale);
    },
    // Cầm quả nặng kéo lệch rồi thả: cơ năng ban đầu là cơ năng lúc buông tay
    update: (engine, st) => {
      if (engine.mouseConstraint.body !== st.bob) return;
      const v = engine.velocityMps(st.bob);
      st.W0 = 0.5 * st.bob.mass * (v.x * v.x + v.y * v.y) +
        st.bob.mass * engine.gravityVal * ((st.lowestY - st.bob.position.y) / engine.scale);
    },
    hud: (engine, st) => {
      const v = engine.velocityMps(st.bob);
      const Wd = 0.5 * st.bob.mass * (v.x * v.x + v.y * v.y);
      const Wt = st.bob.mass * engine.gravityVal * ((st.lowestY - st.bob.position.y) / engine.scale);
      const ref = Math.max(st.W0, 0.01);
      return [
        { label: 'Thế năng Wt (mốc: vị trí thấp nhất)', value: `${fmt(Wt)} J`, bar: Wt / ref, color: '#f59e0b' },
        { label: 'Động năng Wđ', value: `${fmt(Wd)} J`, bar: Wd / ref, color: '#10b981' },
        { label: 'Cơ năng W = Wđ + Wt', value: `${fmt(Wd + Wt)} J`, bar: (Wd + Wt) / ref, color: '#38bdf8' }
      ];
    },
    actions: [
      { label: 'Thả từ góc 20°', rebuild: true, run: (engine, st) => { st.angle = 20; } },
      { label: 'Thả từ góc 40°', rebuild: true, run: (engine, st) => { st.angle = 40; } },
      { label: 'Thả từ góc 60°', rebuild: true, run: (engine, st) => { st.angle = 60; } }
    ]
  }
];
