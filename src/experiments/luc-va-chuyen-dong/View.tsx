import React, { useEffect, useRef, useState } from 'react';
import { ViewProps } from '../../core/types';
import { PhysicsEngine } from './engine/engine.js';
import { PRESET_EXPERIMENTS } from './engine/scenarios.js';

export interface LucVaChuyenDongParams {
  gravity: number; // m/s2 (10 theo SGK THCS)
  airDrag: number; // 0 - 0.05
}

export const LucVaChuyenDongView: React.FC<ViewProps<LucVaChuyenDongParams>> = ({
  params,
  outputs,
  onParamChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTool, setActiveTool] = useState('drag');
  const [speed, setSpeed] = useState(1.0);
  const [activePreset, setActivePreset] = useState('pendulum');
  const [showVectors, setShowVectors] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Resize canvas helper
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight || 520;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (engineRef.current) {
      engineRef.current.updateBoundaries();
      engineRef.current.render();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    handleResize();
    const engine = new PhysicsEngine(canvas);
    engineRef.current = engine;
    canvas.dataset.tool = 'drag';

    // Set initial gravity & air drag
    engine.setGravity(params.gravity ?? 10);
    engine.setAirDrag(params.airDrag ?? 0);

    // Load initial preset
    const preset = PRESET_EXPERIMENTS.find((p: any) => p.id === activePreset) || PRESET_EXPERIMENTS[0];
    if (preset) {
      preset.setup(engine, engine.cssWidth, engine.cssHeight);
    }

    engine.start();

    // Main animation loop
    let animId: number;
    let lastTime = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTime) / 1000);
      lastTime = ts;

      if (engine.isRunning) {
        engine.updatePhysics(dt);
      }
      engine.render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      engine.pause();
      engineRef.current = null;
    };
  }, []);

  // Update gravity when param changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setGravity(params.gravity ?? 10);
      engineRef.current.setAirDrag(params.airDrag ?? 0);
    }
  }, [params.gravity, params.airDrag]);

  // Tool change
  const handleSelectTool = (tool: string) => {
    if (!engineRef.current) return;
    if (tool === 'ruler') {
      engineRef.current.ruler.toggle();
      return;
    }
    if (tool === 'photogate') {
      engineRef.current.photogate.toggle();
      return;
    }

    setActiveTool(tool);
    engineRef.current.activeTool = tool;
    if (canvasRef.current) canvasRef.current.dataset.tool = tool;
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.pause();
      setIsPlaying(false);
    } else {
      engineRef.current.start();
      setIsPlaying(true);
    }
  };

  // Reset preset
  const handleReset = () => {
    if (!engineRef.current) return;
    const p = PRESET_EXPERIMENTS.find((item: any) => item.id === activePreset);
    if (p) {
      p.setup(engineRef.current, engineRef.current.cssWidth, engineRef.current.cssHeight);
      engineRef.current.start();
      setIsPlaying(true);
    }
  };

  // Switch preset
  const handleChoosePreset = (id: string) => {
    setActivePreset(id);
    if (!engineRef.current) return;
    const p = PRESET_EXPERIMENTS.find((item: any) => item.id === id);
    if (p) {
      p.setup(engineRef.current, engineRef.current.cssWidth, engineRef.current.cssHeight);
      engineRef.current.start();
      setIsPlaying(true);
    }
  };

  return (
    <div className="canvas-main-area" style={{ position: 'relative', width: '100%', height: '100%', minHeight: 520 }}>
      {/* FLOATING TOOLBAR */}
      <div className="floating-toolbar">
        <button
          className={`tool-btn ${activeTool === 'drag' ? 'active' : ''}`}
          onClick={() => handleSelectTool('drag')}
          title="Tương tác trực tiếp bằng chuột (kéo, ném, nhấc)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.83L7 15"/></svg>
          <span className="tool-label">Tương tác</span>
        </button>

        <div className="tool-sep" />

        <button
          className={`tool-btn ${activeTool === 'add-box' ? 'active' : ''}`}
          onClick={() => handleSelectTool('add-box')}
          title="Thêm khối hộp chữ nhật"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          <span className="tool-label">Khối Hộp</span>
        </button>

        <button
          className={`tool-btn ${activeTool === 'add-circle' ? 'active' : ''}`}
          onClick={() => handleSelectTool('add-circle')}
          title="Thêm quả cầu tròn"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9"/></svg>
          <span className="tool-label">Quả Cầu</span>
        </button>

        <button
          className={`tool-btn ${activeTool === 'add-ramp' ? 'active' : ''}`}
          onClick={() => handleSelectTool('add-ramp')}
          title="Thêm mặt phẳng nghiêng"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="3 20 21 20 21 6 3 20"/></svg>
          <span className="tool-label">Mặt Nghiêng</span>
        </button>

        <button
          className={`tool-btn ${activeTool === 'add-spring' ? 'active' : ''}`}
          onClick={() => handleSelectTool('add-spring')}
          title="Thêm lò xo đàn hồi"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 12h3l2-5 3 10 3-10 3 10 2-5h3"/></svg>
          <span className="tool-label">Lò Xo</span>
        </button>

        <button
          className={`tool-btn ${activeTool === 'add-pin' ? 'active' : ''}`}
          onClick={() => handleSelectTool('add-pin')}
          title="Ghim cố định vật"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A4 4 0 0 1 14 9V6a2 2 0 0 0-4 0v3a4 4 0 0 1-2.11 3.56l-1.78.89A2 2 0 0 0 5 15.24Z"/></svg>
          <span className="tool-label">Ghim Chốt</span>
        </button>

        <div className="tool-sep" />

        <button
          className="tool-btn"
          onClick={() => handleSelectTool('ruler')}
          title="Bật/Tắt Thước đo ảo"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21.3 8.7 8.7 21.3c-.4.4-1 .4-1.4 0l-4.6-4.6c-.4-.4-.4-1 0-1.4L15.3 2.7c.4-.4 1-.4 1.4 0l4.6 4.6c.4.4.4 1 0 1.4z"/></svg>
          <span className="tool-label">Thước Đo</span>
        </button>

        <button
          className="tool-btn"
          onClick={() => handleSelectTool('photogate')}
          title="Bật/Tắt Cổng quang điện đo tốc độ"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 22V4c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v18"/><path d="M9 12h6"/></svg>
          <span className="tool-label">Cổng Quang</span>
        </button>
      </div>

      {/* VIEW OPTIONS OVERLAY */}
      <div className="canvas-view-overlay">
        <label className="check-overlay">
          <input
            type="checkbox"
            checked={showVectors}
            onChange={(e) => {
              setShowVectors(e.target.checked);
              if (engineRef.current) engineRef.current.showVectors = e.target.checked;
            }}
          />
          <span>Vectơ Vận Tốc & Lực</span>
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
          <span>Vết Quỹ Đạo</span>
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
          <span>Lưới Tọa Độ (1m = 25px)</span>
        </label>
      </div>

      {/* CANVAS */}
      <canvas ref={canvasRef} id="physicsCanvas" />

      {/* BOTTOM CONTROL & HINT BAR */}
      <div className="canvas-hint-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>💡 Bấm chuột & kéo <b>BẤT KỲ VẬT NÀO</b> để tương tác trực tiếp trong thời gian thực.</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="ctrl-btn btn-primary" onClick={togglePlay} style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
            {isPlaying ? 'Tạm dừng' : 'Tiếp tục'}
          </button>
          <button className="ctrl-btn btn-secondary" onClick={handleReset} style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
            Đặt lại bài
          </button>
        </div>
      </div>
    </div>
  );
};
