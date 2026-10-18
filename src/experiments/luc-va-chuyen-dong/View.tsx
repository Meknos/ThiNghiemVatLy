import React, { useEffect, useRef, useState } from 'react';
import { ViewProps } from '../../core/types';
import { PhysicsEngine } from './engine/engine.js';
import { PRESET_EXPERIMENTS } from './engine/scenarios.js';
import Matter from 'matter-js';

export interface LucVaChuyenDongParams {
  scene: number;   // 1..5: bài thí nghiệm trong PRESET_EXPERIMENTS
  gravity: number; // N/kg (10 theo SGK THCS)
  airDrag: number; // hệ số cản không khí minh họa
}

interface HudItem {
  label: string;
  value: string;
  bar?: number;
  color?: string;
}

const TOOLS = [
  { id: 'drag', label: 'Kéo thả', title: 'Kéo, ném, nhấc vật bằng chuột hoặc ngón tay' },
  { id: 'add-box', label: 'Khối hộp', title: 'Bấm lên bàn thí nghiệm để thêm khối hộp' },
  { id: 'add-circle', label: 'Quả cầu', title: 'Bấm lên bàn thí nghiệm để thêm quả cầu' },
  { id: 'add-ramp', label: 'Mặt nghiêng', title: 'Thêm mặt phẳng nghiêng 30°' },
  { id: 'add-spring', label: 'Lò xo', title: 'Bấm lần lượt hai vật để nối lò xo' },
  { id: 'add-pin', label: 'Chốt', title: 'Ghim một điểm của vật để vật quay quanh điểm đó' }
];

export const LucVaChuyenDongView: React.FC<ViewProps<LucVaChuyenDongParams>> = ({ params, onParamChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const stateRef = useRef<any>(null);

  const sceneIndex = Math.min(PRESET_EXPERIMENTS.length, Math.max(1, Math.round(params.scene || 1))) - 1;
  const preset: any = PRESET_EXPERIMENTS[sceneIndex];

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTool, setActiveTool] = useState('drag');
  const [rulerOn, setRulerOn] = useState(false);
  const [gateOn, setGateOn] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hud, setHud] = useState<HudItem[]>([]);
  // Vật đang chọn (bấm vào vật): hiện số liệu và cho chỉnh trực tiếp
  const [picked, setPicked] = useState<{ name: string; mass: number; speed: number; height: number; isStatic: boolean } | null>(null);
  const presetRef = useRef<any>(null);

  const applyEnvironment = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setGravity(params.gravity ?? 10);
    engine.setAirDrag(params.airDrag ?? 0);
  };

  /** Dựng lại bài đang chọn; `fresh` = quay về số liệu ban đầu của bài. */
  const buildScene = (fresh: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (fresh || !stateRef.current) stateRef.current = preset.initial();
    presetRef.current = null; // tạm ngừng update của bài cũ trong lúc dựng cảnh mới
    preset.setup(engine, engine.cssWidth, engine.cssHeight, stateRef.current);
    presetRef.current = preset;
    applyEnvironment();
    engine.start();
    setIsPlaying(true);
    setRulerOn(engine.ruler.active);
    setGateOn(engine.photogate.active);
    setActiveTool('drag');
    engine.activeTool = 'drag';
  };

  // Khởi tạo engine và vòng lặp vẽ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement!.clientWidth;
      const h = canvas.parentElement!.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    };
    fit();

    const engine = new PhysicsEngine(canvas);
    engineRef.current = engine;

    let animId = 0;
    let lastTime = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTime) / 1000);
      lastTime = ts;
      if (engine.isRunning) engine.updatePhysics(dt);
      if (presetRef.current?.update && stateRef.current) presetRef.current.update(engine, stateRef.current);
      engine.render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      fit();
      engine.updateBoundaries();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      engine.pause();
      engineRef.current = null;
    };
  }, []);

  // Đổi bài thí nghiệm
  useEffect(() => {
    buildScene(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIndex]);

  useEffect(applyEnvironment, [params.gravity, params.airDrag]);

  // Cập nhật bảng số liệu đo ~10 lần/giây
  useEffect(() => {
    const read = () => {
      const engine = engineRef.current;
      if (!engine || !stateRef.current || presetRef.current !== preset) return;
      setHud(preset.hud(engine, stateRef.current));
      const b = engine.selectedBody;
      const v = b ? engine.velocityMps(b) : null;
      setPicked(
        b && v
          ? { name: (b.label || '').trim() || 'Vật', mass: b.mass, speed: Math.hypot(v.x, v.y), height: engine.bodyHeightM(b), isStatic: b.isStatic }
          : null
      );
    };
    read();
    const id = window.setInterval(read, 100);
    return () => window.clearInterval(id);
  }, [preset]);

  const selectTool = (tool: string) => {
    setActiveTool(tool);
    if (engineRef.current) engineRef.current.activeTool = tool;
  };

  const togglePlay = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isPlaying) engine.pause();
    else engine.start();
    setIsPlaying(!isPlaying);
  };

  const changeMass = (delta: number) => {
    const b = engineRef.current?.selectedBody;
    if (b && !b.isStatic) Matter.Body.setMass(b, Math.max(0.1, Math.min(20, Math.round((b.mass + delta) * 10) / 10)));
  };
  const pushSelected = () => {
    const engine = engineRef.current;
    const b = engine?.selectedBody;
    if (engine && b && !b.isStatic) {
      const v = Matter.Body.getVelocity(b);
      Matter.Body.setVelocity(b, { x: v.x + (1 * engine.scale) / 60, y: v.y }); // thêm 1 m/s sang phải
    }
  };
  const toggleStatic = () => {
    const b = engineRef.current?.selectedBody;
    if (b) Matter.Body.setStatic(b, !b.isStatic);
  };
  const removeSelected = () => {
    const engine = engineRef.current;
    if (!engine?.selectedBody) return;
    Matter.Composite.remove(engine.world!, engine.selectedBody);
    engine.selectedBody = null;
  };

  const runAction = (action: any) => {
    const engine = engineRef.current;
    if (!engine || !stateRef.current) return;
    action.run(engine, stateRef.current);
    if (action.rebuild) buildScene(false);
  };

  return (
    <div className="mech-view">
      {/* CHỌN BÀI THÍ NGHIỆM */}
      <div className="mech-scenes">
        {PRESET_EXPERIMENTS.map((p: any, idx: number) => (
          <button
            key={p.id}
            className={`quick-pill ${idx === sceneIndex ? 'active' : ''}`}
            onClick={() => onParamChange('scene', idx + 1)}
          >
            {p.title}
          </button>
        ))}
      </div>
      <p className="mech-desc">{preset.desc}</p>

      <div className="mech-toolbar">
        {/* CÔNG CỤ */}
        <div className="mech-tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={`tool-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => selectTool(t.id)}
              title={t.title}
            >
              <span className="tool-label">{t.label}</span>
            </button>
          ))}
          <div className="tool-sep" />
          <button
            className={`tool-btn ${rulerOn ? 'active' : ''}`}
            onClick={() => engineRef.current && setRulerOn(engineRef.current.ruler.toggle())}
            title="Bật/tắt thước đo, kéo hai đầu thước để đo"
          >
            <span className="tool-label">Thước đo</span>
          </button>
          <button
            className={`tool-btn ${gateOn ? 'active' : ''}`}
            onClick={() => engineRef.current && setGateOn(engineRef.current.photogate.toggle())}
            title="Bật/tắt cổng quang điện, kéo để đổi vị trí"
          >
            <span className="tool-label">Cổng quang</span>
          </button>
        </div>
        <div className="mech-view-options">
          <label className="check-overlay">
            <input
              type="checkbox"
              checked={showVectors}
              onChange={(e) => {
                setShowVectors(e.target.checked);
                if (engineRef.current) engineRef.current.showVectors = e.target.checked;
              }}
            />
            <span>Mũi tên tốc độ (v) và trọng lực (P)</span>
          </label>
          <label className="check-overlay">
            <input
              type="checkbox"
              checked={showTrails}
              onChange={(e) => {
                setShowTrails(e.target.checked);
                if (engineRef.current) engineRef.current.showTrails = e.target.checked;
              }}
            />
            <span>Vết quỹ đạo</span>
          </label>
          <label className="check-overlay">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => {
                setShowGrid(e.target.checked);
                if (engineRef.current) engineRef.current.showGrid = e.target.checked;
              }}
            />
            <span>Lưới (mỗi ô 0,5 m)</span>
          </label>
        </div>
      </div>

      <div className="mech-stage">
        <canvas ref={canvasRef} id="physicsCanvas" data-tool={activeTool} />

        {/* VẬT ĐANG CHỌN */}
        {picked && (
          <div className="mech-picked">
            <div className="mech-picked-title">{picked.name}</div>
            <div className="mech-hud-line"><span>Khối lượng</span><b>{picked.mass.toFixed(1).replace('.', ',')} kg</b></div>
            <div className="mech-hud-line"><span>Tốc độ</span><b>{picked.speed.toFixed(2).replace('.', ',')} m/s</b></div>
            <div className="mech-hud-line"><span>Độ cao</span><b>{picked.height.toFixed(2).replace('.', ',')} m</b></div>
            <div className="mech-picked-actions">
              <button className="quick-pill" disabled={picked.isStatic} onClick={() => changeMass(-0.5)}>− 0,5 kg</button>
              <button className="quick-pill" disabled={picked.isStatic} onClick={() => changeMass(0.5)}>+ 0,5 kg</button>
              <button className="quick-pill" disabled={picked.isStatic} onClick={pushSelected}>Đẩy →</button>
              <button className="quick-pill" onClick={toggleStatic}>{picked.isStatic ? 'Thả tự do' : 'Giữ cố định'}</button>
              <button className="quick-pill" onClick={removeSelected}>Xóa</button>
            </div>
          </div>
        )}

        {/* SỐ LIỆU ĐO */}
        <div className="mech-hud">
          {hud.map((item, i) => (
            <div key={i} className="mech-hud-row">
              <div className="mech-hud-line">
                <span>{item.label}</span>
                <b style={item.color ? { color: item.color } : undefined}>{item.value}</b>
              </div>
              {item.bar !== undefined && (
                <div className="mech-hud-bar">
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(1, item.bar)) * 100}%`,
                      background: item.color
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* THAO TÁC */}
      <div className="quick-orientation-bar">
        {preset.actions.map((a: any) => (
          <button key={a.label} className="quick-pill" onClick={() => runAction(a)}>
            {a.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="ctrl-btn btn-primary" onClick={togglePlay}>
            {isPlaying ? 'Tạm dừng' : 'Tiếp tục'}
          </button>
          <button className="ctrl-btn btn-secondary" onClick={() => buildScene(true)}>
            Làm lại từ đầu
          </button>
        </span>
      </div>
    </div>
  );
};
