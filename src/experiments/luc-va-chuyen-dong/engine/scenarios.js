/**
 * AIPLab Studio — Thư viện bài thí nghiệm chuẩn SGK Khoa Học Tự Nhiên (THCS)
 * Bám sát chương trình KHTN 6, 7, 8 về Cơ học & Lực
 */
import Matter from 'matter-js';
const { Body, Constraint, Composite } = Matter;

export const PRESET_EXPERIMENTS = [
  {
    id: 'hooke_spring',
    title: 'Lò Xo Treo Quả Nặng (Độ Dãn Lò Xo)',
    category: 'Lực & Biến Dạng',
    grade: 6,
    desc: 'Khảo sát độ dãn của lò xo treo thẳng đứng tỉ lệ thuận với khối lượng quả nặng treo vào nó.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(10.0);
      engine.setAirDrag(0.005);

      const anchorX = w / 2;
      const anchorY = 70;
      const restLen = 140;

      // Quả nặng treo ban đầu 1kg (10N)
      const weight = engine.addBox(anchorX, anchorY + restLen, 50, 40, {
        density: 0.002,
        friction: 0.2,
        restitution: 0.1,
        color: '#38bdf8',
        label: 'Quả Nặng m=1kg (P=10N)'
      });

      // Lò xo đàn hồi kết nối từ điểm treo
      const spring = Constraint.create({
        pointA: { x: anchorX, y: anchorY },
        bodyB: weight,
        pointB: { x: 0, y: -20 },
        stiffness: 0.02,
        damping: 0.02,
        length: restLen,
        render: {
          visible: true,
          type: 'spring',
          strokeStyle: '#38bdf8',
          lineWidth: 3
        }
      });
      Composite.add(engine.world, spring);

      // Thước đo bên cạnh để đo độ dãn Δl
      engine.ruler.p1 = { x: anchorX - 80, y: anchorY };
      engine.ruler.p2 = { x: anchorX - 80, y: anchorY + restLen + 50 };
      engine.ruler.show();
    }
  },
  {
    id: 'friction_surfaces',
    title: 'Lực Ma Sát Trượt Trên Các Bề Mặt',
    category: 'Lực Tiếp Xúc',
    grade: 6,
    desc: 'So sánh lực cản và quãng đường trượt của khối gỗ trên 3 bề mặt: Mặt băng (trơn), Mặt gỗ (vừa), Mặt nhám (lớn).',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(10.0);
      engine.setAirDrag(0.0);

      const gy = engine.groundY;
      const laneH = 40;

      // 3 Khối hộp được đẩy cùng tốc độ ban đầu v = 8 m/s trên 3 làn
      // Làn 1: Mặt Băng (μ = 0.01)
      const box1 = engine.addBox(120, gy - 80, 50, 30, {
        friction: 0.01,
        density: 0.002,
        color: '#38bdf8',
        label: 'Khối 1: Bề mặt băng (ít ma sát)'
      });
      Body.setVelocity(box1, { x: 12, y: 0 });

      // Làn 2: Mặt Gỗ (μ = 0.25)
      const box2 = engine.addBox(120, gy - 40, 50, 30, {
        friction: 0.25,
        density: 0.002,
        color: '#f59e0b',
        label: 'Khối 2: Bề mặt gỗ (ma sát vừa)'
      });
      Body.setVelocity(box2, { x: 12, y: 0 });

      // Làn 3: Mặt Nhám (μ = 0.8)
      const box3 = engine.addBox(120, gy, 50, 30, {
        friction: 0.8,
        density: 0.002,
        color: '#f43f5e',
        label: 'Khối 3: Bề mặt nhám (ma sát lớn)'
      });
      Body.setVelocity(box3, { x: 12, y: 0 });
    }
  },
  {
    id: 'photogate_speed',
    title: 'Đo Tốc Độ Chuyển Động Bằng Cổng Quang',
    category: 'Tốc Độ',
    grade: 7,
    desc: 'Khảo sát công thức tính tốc độ v = s / t bằng cách cho xe trượt đi qua cổng quang điện.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(10.0);
      engine.setAirDrag(0.0);

      const gy = engine.groundY;
      const rampAngle = -15 * Math.PI / 180;
      const rampX = w * 0.35;
      const rampY = gy - 70;

      // Đường trượt nghiêng nhẹ
      engine.addRamp(rampX, rampY, 320, 20, rampAngle, {
        friction: 0.02,
        color: '#475569',
        label: 'Đường trượt thực nghiệm'
      });

      // Xe trượt có cờ chắn quang
      const cart = engine.addBox(rampX - 110, rampY - 70, 55, 30, {
        friction: 0.02,
        restitution: 0.1,
        density: 0.002,
        color: '#10b981',
        label: 'Xe Trượt Thí Nghiệm'
      });
      Body.setAngle(cart, rampAngle);

      // Đặt cổng quang điện ngay chân dốc
      engine.photogate.x = rampX + 130;
      engine.photogate.y = gy - 35;
      engine.photogate.show();

      // Thước đo quãng đường trượt s
      engine.ruler.p1 = { x: rampX - 110, y: rampY - 50 };
      engine.ruler.p2 = { x: rampX + 130, y: gy - 35 };
      engine.ruler.show();
    }
  },
  {
    id: 'lever_balance',
    title: 'Đòn Bẩy Cân Bằng (Quy Tắc Đòn Bẩy)',
    category: 'Máy Cơ Đơn Giản',
    grade: 8,
    desc: 'Khảo sát điều kiện cân bằng của đòn bẩy: F₁ · d₁ = F₂ · d₂ quanh điểm tựa O.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(10.0);
      engine.setAirDrag(0.002);

      const gy = engine.groundY;
      const fulcrumX = w / 2;
      const fulcrumY = gy - 50;

      // Điểm tựa tam giác O
      engine.addRamp(fulcrumX, fulcrumY + 25, 60, 40, 0, {
        isStatic: true,
        color: '#64748b',
        label: 'Điểm Tựa O'
      });

      // Thanh đòn bẩy dài 360px
      const bar = engine.addBox(fulcrumX, fulcrumY, 360, 16, {
        friction: 0.4,
        density: 0.001,
        color: '#38bdf8',
        label: 'Thanh Đòn Bẩy AB'
      });

      // Khớp trục xoay tại tâm điểm tựa O
      engine.addPin(bar, fulcrumX, fulcrumY);

      // Quả nặng bên trái: m = 2kg tại d1 = 120px
      engine.addBox(fulcrumX - 120, fulcrumY - 25, 35, 35, {
        density: 0.004,
        friction: 0.8,
        color: '#f59e0b',
        label: 'Vật 1 (m₁=2kg, d₁=12cm)'
      });

      // Quả nặng bên phải: m = 4kg tại d2 = 60px (cân bằng 2 * 120 = 4 * 60)
      engine.addBox(fulcrumX + 60, fulcrumY - 25, 45, 35, {
        density: 0.008,
        friction: 0.8,
        color: '#10b981',
        label: 'Vật 2 (m₂=4kg, d₂=6cm)'
      });
    }
  },
  {
    id: 'energy_transformation',
    title: 'Chuyển Hóa Động Năng & Thế Năng',
    category: 'Năng Lượng',
    grade: 9,
    desc: 'Vật trượt từ đỉnh dốc: thế năng chuyển hóa thành động năng, cơ năng được bảo toàn khi bỏ qua ma sát.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(10.0);
      engine.setAirDrag(0.0);

      const gy = engine.groundY;
      const angle = -25 * Math.PI / 180;
      const rampX = w * 0.32;
      const rampY = gy - 90;

      // Dốc trượt nhẵn không ma sát
      engine.addRamp(rampX, rampY, 340, 20, angle, {
        friction: 0.0,
        restitution: 0.0,
        color: '#475569',
        label: 'Mặt Dốc Nhẵn (μ=0)'
      });

      // Quả cầu thả rơi từ đỉnh dốc
      const ball = engine.addCircle(rampX - 120, rampY - 95, 20, {
        friction: 0.0,
        restitution: 0.2,
        density: 0.003,
        color: '#10b981',
        label: 'Quả Cầu (Thế Năng Cực Đại)'
      });
      Body.setAngle(ball, angle);
    }
  }
];

export function parseContextAndGenerate(prompt, engine, w, h) {
  const text = prompt.toLowerCase();
  if (text.includes('lò xo') || text.includes('dãn') || text.includes('treo')) {
    PRESET_EXPERIMENTS[0].setup(engine, w, h);
    return;
  }
  if (text.includes('ma sát') || text.includes('trơn') || text.includes('nhám')) {
    PRESET_EXPERIMENTS[1].setup(engine, w, h);
    return;
  }
  if (text.includes('tốc độ') || text.includes('cổng quang') || text.includes('vận tốc')) {
    PRESET_EXPERIMENTS[2].setup(engine, w, h);
    return;
  }
  if (text.includes('đòn bẩy') || text.includes('cân bằng') || text.includes('điểm tựa')) {
    PRESET_EXPERIMENTS[3].setup(engine, w, h);
    return;
  }
  if (text.includes('động năng') || text.includes('thế năng') || text.includes('cơ năng')) {
    PRESET_EXPERIMENTS[4].setup(engine, w, h);
    return;
  }
  // Mặc định
  PRESET_EXPERIMENTS[0].setup(engine, w, h);
}
