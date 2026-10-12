/**
 * AIPLab Studio — Thư viện kịch bản thí nghiệm & Bộ phân tích ngữ cảnh
 * 
 * Each scenario receives (engine, w, h) where w,h are CSS-pixel dimensions
 * of the canvas. engine.groundY gives the Y coordinate of the ground line.
 */
import Matter from 'matter-js';
const { Body } = Matter;

export const PRESET_EXPERIMENTS = [
  {
    id: 'projectile',
    title: 'Chuyển Động Ném Xiên & Va Chạm',
    category: 'Cơ Học',
    desc: 'Bắn đạn theo quỹ đạo parabol trong trọng trường và phá hủy tháp khối hộp mục tiêu.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(9.8);
      engine.setAirDrag(0.002);

      const gy = engine.groundY;
      const targetX = w * 0.72;
      const boxSize = 34;

      // Pyramid tower of target blocks
      for (let row = 0; row < 5; row++) {
        const cols = 5 - row;
        for (let col = 0; col < cols; col++) {
          const bx = targetX - (cols * boxSize) / 2 + col * boxSize + boxSize / 2;
          const by = gy - row * boxSize - boxSize / 2;
          engine.addBox(bx, by, boxSize - 2, boxSize - 2, {
            density: 0.0008,
            friction: 0.5,
            restitution: 0.25,
            color: '#f59e0b',
            label: `Hộp Gỗ [${row},${col}]`
          });
        }
      }

      // Cannonball launched from left
      const bullet = engine.addCircle(90, gy - 100, 16, {
        density: 0.005,
        restitution: 0.4,
        color: '#0ea5e9',
        label: 'Đạn Pháo (m≈3kg)'
      });
      Body.setVelocity(bullet, { x: 18, y: -12 });
    }
  },
  {
    id: 'inclined_plane',
    title: 'Mặt Phẳng Nghiêng & Ma Sát Trượt',
    category: 'Động Lực Học',
    desc: 'Khảo sát định luật II Newton và lực ma sát khi vật trượt xuống dốc 28°.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(9.8);
      engine.setAirDrag(0.0);

      const gy = engine.groundY;
      const angle = -28 * Math.PI / 180;
      const rampX = w * 0.35;
      const rampY = gy - 100;

      engine.addRamp(rampX, rampY, 380, 22, angle, {
        friction: 0.12,
        color: '#475569',
        label: 'Mặt Phẳng Nghiêng 28°'
      });

      // Block at top of ramp
      const block = engine.addBox(rampX - 130, rampY - 110, 44, 30, {
        friction: 0.15,
        restitution: 0.05,
        density: 0.002,
        color: '#10b981',
        label: 'Khối Trượt (m≈2kg)'
      });
      Body.setAngle(block, angle);

      // Photogate at base
      engine.photogate.x = rampX + 170;
      engine.photogate.y = gy - 40;
      engine.photogate.show();
    }
  },
  {
    id: 'simple_pendulum',
    title: 'Con Lắc Đơn & Bảo Toàn Cơ Năng',
    category: 'Dao Động',
    desc: 'Dao động điều hòa tuần hoàn và chuyển hóa liên tục giữa động năng và thế năng.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(9.8);
      engine.setAirDrag(0.001);

      const anchorX = w / 2;
      const anchorY = 80;
      const ropeLen = Math.min(280, engine.groundY - anchorY - 60);

      const anchor = engine.addBox(anchorX, anchorY, 50, 14, {
        isStatic: true,
        color: '#64748b',
        label: 'Giá Treo'
      });

      const theta = Math.PI / 4;
      const bobX = anchorX + ropeLen * Math.sin(theta);
      const bobY = anchorY + ropeLen * Math.cos(theta);

      const bob = engine.addCircle(bobX, bobY, 24, {
        density: 0.004,
        restitution: 0.15,
        friction: 0.02,
        color: '#ec4899',
        label: 'Quả Nặng Con Lắc'
      });

      engine.addSpring(anchor, bob, ropeLen, 1.0, 0.0);
    }
  },
  {
    id: 'spring_oscillator',
    title: 'Hệ Con Lắc Lò Xo Dao Động',
    category: 'Dao Động',
    desc: 'Lò xo đàn hồi tuân theo định luật Hooke (F = -kx) gắn với quả nặng.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(0);

      const centerY = h / 2;
      const wallX = 100;

      const wall = engine.addBox(wallX, centerY, 24, 200, {
        isStatic: true,
        color: '#475569',
        label: 'Vách Cố Định'
      });

      const restLen = 160;
      const block = engine.addBox(wallX + restLen + 120, centerY, 55, 55, {
        density: 0.002,
        friction: 0.0,
        frictionAir: 0.001,
        color: '#06b6d4',
        label: 'Vật Nặng Lò Xo (m≈1kg)'
      });

      engine.addSpring(wall, block, restLen, 0.035, 0.003);
    }
  },
  {
    id: 'lever_torque',
    title: 'Đòn Bẩy & Cân Bằng Mô-Men Lực',
    category: 'Tĩnh Học',
    desc: 'Quy tắc mô-men lực: F₁·d₁ = F₂·d₂ đối với trục quay cố định.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(9.8);
      engine.setAirDrag(0.0);

      const cx = w / 2;
      const gy = engine.groundY;
      const fulcrumY = gy - 80;

      // Fulcrum (point of support)
      engine.addBox(cx, fulcrumY + 30, 24, 55, {
        isStatic: true,
        color: '#64748b',
        label: 'Điểm Tựa'
      });

      // Beam
      const beam = engine.addBox(cx, fulcrumY, 440, 14, {
        density: 0.001,
        friction: 0.8,
        color: '#f59e0b',
        label: 'Thanh Đòn Bẩy'
      });
      engine.addPin(beam, cx, fulcrumY);

      // Left weight (m≈4kg at d=100px)
      engine.addBox(cx - 100, fulcrumY - 32, 38, 38, {
        density: 0.004,
        friction: 0.8,
        color: '#ef4444',
        label: 'Quả Cân 1 (4kg, d=4m)'
      });

      // Right weight (m≈2kg at d=200px) ⇒ 4×100 = 2×200 → equilibrium
      engine.addBox(cx + 200, fulcrumY - 28, 30, 30, {
        density: 0.002,
        friction: 0.8,
        color: '#10b981',
        label: 'Quả Cân 2 (2kg, d=8m)'
      });
    }
  },
  {
    id: 'elastic_collision',
    title: 'Va Chạm Đàn Hồi & Bảo Toàn Động Lượng',
    category: 'Động Lực Học',
    desc: 'Hai viên bi va chạm trực diện — bảo toàn tổng động lượng p⃗ = m₁v⃗₁ + m₂v⃗₂.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(0);

      const centerY = h / 2;

      const ball1 = engine.addCircle(w * 0.2, centerY, 30, {
        density: 0.003,
        restitution: 1.0,
        friction: 0,
        frictionAir: 0,
        color: '#06b6d4',
        label: 'Bi 1 (m≈2kg)'
      });
      Body.setVelocity(ball1, { x: 7, y: 0 });

      const ball2 = engine.addCircle(w * 0.8, centerY, 24, {
        density: 0.002,
        restitution: 1.0,
        friction: 0,
        frictionAir: 0,
        color: '#f97316',
        label: 'Bi 2 (m≈1kg)'
      });
      Body.setVelocity(ball2, { x: -6, y: 0 });
    }
  },
  {
    id: 'tower_sandbox',
    title: 'Hộp Trọng Lực & Tương Tác Tự Do',
    category: 'Tổng Hợp',
    desc: 'Không gian tự do — kéo, ném, nhấc, xoay bất kỳ vật nào bằng chuột.',
    setup: (engine, w, h) => {
      engine.clear();
      engine.setGravity(9.8);
      engine.setAirDrag(0.001);

      const gy = engine.groundY;
      const colors = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f43f5e', '#06b6d4', '#a855f7', '#fb923c'];

      // Mix of boxes and circles
      for (let i = 0; i < 10; i++) {
        const x = 140 + i * 60;
        const y = gy - 40 - (i % 3) * 70;
        if (i % 2 === 0) {
          engine.addBox(x, y, 42, 42, {
            density: 0.001,
            restitution: 0.6,
            friction: 0.12,
            color: colors[i % colors.length],
            label: `Khối Hộp #${i + 1}`
          });
        } else {
          engine.addCircle(x, y, 22, {
            density: 0.0015,
            restitution: 0.85,
            friction: 0.05,
            color: colors[i % colors.length],
            label: `Quả Cầu #${i + 1}`
          });
        }
      }
    }
  }
];

/**
 * Natural-language keyword parser — matches user text to preset scenarios.
 */
export function parseContextAndGenerate(userPrompt, engine, w, h) {
  const text = (userPrompt || '').toLowerCase();

  const keywords = [
    { pattern: ['nghiêng', 'dốc', 'nêm', 'ramp', 'trượt'], id: 'inclined_plane' },
    { pattern: ['con lắc đơn', 'dây treo'], id: 'simple_pendulum' },
    { pattern: ['lò xo', 'đàn hồi', 'spring', 'hooke'], id: 'spring_oscillator' },
    { pattern: ['va chạm', 'bắn bi', 'động lượng', 'collision'], id: 'elastic_collision' },
    { pattern: ['đòn bẩy', 'mô men', 'mô-men', 'bập bênh', 'cân bằng', 'lever'], id: 'lever_torque' },
    { pattern: ['ném', 'pháo', 'parabol', 'đạn', 'projectile'], id: 'projectile' },
    { pattern: ['con lắc'], id: 'simple_pendulum' },  // fallback for generic "con lắc"
  ];

  for (const entry of keywords) {
    if (entry.pattern.some(kw => text.includes(kw))) {
      const preset = PRESET_EXPERIMENTS.find(p => p.id === entry.id);
      if (preset) {
        preset.setup(engine, w, h);
        return { title: preset.title, desc: `Đã tạo thí nghiệm: ${preset.title}` };
      }
    }
  }

  // Fallback → sandbox
  const fallback = PRESET_EXPERIMENTS.find(p => p.id === 'tower_sandbox');
  fallback.setup(engine, w, h);
  return {
    title: 'Không gian thí nghiệm tự do',
    desc: 'Đã tạo các vật thể đa dạng. Bạn có thể tương tác trực tiếp lên toàn bộ các vật!'
  };
}
