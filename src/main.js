import { PhysicsEngine } from './physics/engine.js';
import { PRESET_EXPERIMENTS, parseContextAndGenerate } from './physics/scenarios.js';
import { ObjectInspector } from './ui/inspector.js';
import { LiveCharts } from './ui/charts.js';

/**
 * AIPLab Studio — Main Application Controller
 *
 * Wires together the physics engine, UI inspector, chart dashboard,
 * preset library, toolbar, and keyboard shortcuts.
 */
window.addEventListener('DOMContentLoaded', () => {
  const canvas    = document.getElementById('physicsCanvas');
  const container = document.getElementById('mainCanvasContainer');

  /* ------------------------------------------------------------------
     Canvas sizing — must be done BEFORE PhysicsEngine is constructed
     because the constructor calls updateBoundaries() which reads
     canvas.width / canvas.height.
  ------------------------------------------------------------------ */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = container.clientWidth  * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width  = container.clientWidth  + 'px';
    canvas.style.height = container.clientHeight + 'px';
    // NOTE: We do NOT call ctx.scale() here.  The engine's render()
    // uses ctx.setTransform(dpr, …) at the start of every frame.
  }
  resizeCanvas();

  /* ------------------------------------------------------------------
     Core modules
  ------------------------------------------------------------------ */
  const engine    = new PhysicsEngine(canvas);
  canvas.dataset.tool = 'drag';
  const inspector = new ObjectInspector(engine);
  const charts    = new LiveCharts(document.getElementById('liveChartCanvas'), engine);

  window.addEventListener('resize', () => {
    resizeCanvas();
    engine.updateBoundaries();
    engine.render();
    charts.resize();
  });

  // Object selection bridge
  engine.onSelectCallback = (body) => inspector.setBody(body);

  /* ------------------------------------------------------------------
     Photogate data log
  ------------------------------------------------------------------ */
  const tbodyPhotogate = document.getElementById('tbodyPhotogate');

  engine.onPhotogateTrigger = (record) => {
    if (tbodyPhotogate.querySelector('td[colspan]')) tbodyPhotogate.innerHTML = '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${record.id}</td>
      <td style="color:var(--cyan-400)">${record.name}</td>
      <td>${record.time}s</td>
      <td style="color:var(--emerald-400);font-weight:700">${record.speed} m/s</td>`;
    tbodyPhotogate.prepend(tr);
  };

  document.getElementById('btnClearPhotogateLog').addEventListener('click', () => {
    engine.photogate.log = [];
    tbodyPhotogate.innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">Chưa có lượt đo nào.</td></tr>';
  });

  /* ------------------------------------------------------------------
     Playback controls
  ------------------------------------------------------------------ */
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playIcon     = document.getElementById('playIcon');
  const playText     = document.getElementById('playText');

  const SVG_PLAY  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  const SVG_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

  function setPlayState(playing) {
    if (playing) { engine.start(); } else { engine.pause(); }
    btnPlayPause.classList.toggle('is-playing', playing);
    playIcon.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
    playText.textContent = playing ? 'Tạm Dừng' : 'Chạy Mô Phỏng';
  }

  btnPlayPause.addEventListener('click', () => setPlayState(!engine.isRunning));

  // Spacebar shortcut (only when focus is not on inputs)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !['TEXTAREA', 'INPUT', 'SELECT'].includes(e.target.tagName)) {
      e.preventDefault();
      setPlayState(!engine.isRunning);
    }
  });

  document.getElementById('btnStep').addEventListener('click', () => {
    setPlayState(false);
    engine.step();
    inspector.updateLiveValues();
    charts.update(engine.simTime);
  });

  /* ------------------------------------------------------------------
     Preset management
  ------------------------------------------------------------------ */
  let currentPresetId = 'projectile';

  function loadCurrentPreset() {
    const p = PRESET_EXPERIMENTS.find(item => item.id === currentPresetId);
    if (p) {
      p.setup(engine, engine.cssWidth, engine.cssHeight);
      charts.history = [];
      setPlayState(true);
    }
  }

  document.getElementById('btnReset').addEventListener('click', loadCurrentPreset);

  document.getElementById('btnClearCanvas').addEventListener('click', () => {
    engine.clear();
    charts.history = [];
    setPlayState(false);
  });

  /* ------------------------------------------------------------------
     Time-scale selector
  ------------------------------------------------------------------ */
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      engine.setTimeScale(parseFloat(btn.dataset.speed));
    });
  });

  /* ------------------------------------------------------------------
     Floating toolbar
  ------------------------------------------------------------------ */
  const toolButtons = document.querySelectorAll('.tool-btn');

  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;

      // Toggle-type tools (ruler, photogate)
      if (tool === 'ruler' || tool === 'photogate') {
        const instrument = tool === 'ruler' ? engine.ruler : engine.photogate;
        btn.classList.toggle('active', instrument.toggle());
        return;
      }

      // Exclusive select for creation tools
      toolButtons.forEach(b => {
        if (b.dataset.tool !== 'ruler' && b.dataset.tool !== 'photogate') {
          b.classList.remove('active');
        }
      });
      btn.classList.add('active');
      engine.activeTool = tool;
      canvas.dataset.tool = tool;
    });
  });

  /* ------------------------------------------------------------------
     Canvas view toggles
  ------------------------------------------------------------------ */
  document.getElementById('chkShowVectors').addEventListener('change', (e) => { engine.showVectors = e.target.checked; });
  document.getElementById('chkShowTrails').addEventListener('change', (e)  => { engine.showTrails  = e.target.checked; });
  document.getElementById('chkShowGrid').addEventListener('change', (e)    => { engine.showGrid    = e.target.checked; });

  /* ------------------------------------------------------------------
     Right sidebar tabs
  ------------------------------------------------------------------ */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = {
    'inspector':     document.getElementById('paneInspector'),
    'graphs':        document.getElementById('paneGraphs'),
    'photogate-log': document.getElementById('panePhotogate')
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      Object.entries(tabPanes).forEach(([k, pane]) => {
        if (pane) pane.classList.toggle('active', k === target);
      });
      if (target === 'graphs') charts.resize();
    });
  });

  /* ------------------------------------------------------------------
     Environment controls
  ------------------------------------------------------------------ */
  const selGravityPreset = document.getElementById('selGravityPreset');
  const rangeGravity     = document.getElementById('rangeGravity');
  const valGravityNum    = document.getElementById('valGravityNum');
  const badgeEnvName     = document.getElementById('badgeEnvName');

  const gPresets = {
    earth: { g: 9.80, name: 'Trái Đất (g = 9.8 m/s²)' },
    moon:  { g: 1.62, name: 'Mặt Trăng (g = 1.62 m/s²)' },
    mars:  { g: 3.71, name: 'Sao Hỏa (g = 3.71 m/s²)' },
    zero:  { g: 0.00, name: 'Không Trọng Lực (g = 0)' }
  };

  selGravityPreset.addEventListener('change', (e) => {
    const key = e.target.value;
    if (key === 'custom') return;
    const item = gPresets[key];
    if (item) {
      rangeGravity.value = item.g;
      valGravityNum.textContent = item.g.toFixed(1);
      badgeEnvName.textContent = item.name;
      engine.setGravity(item.g);
    }
  });

  rangeGravity.addEventListener('input', (e) => {
    const g = parseFloat(e.target.value);
    valGravityNum.textContent = g.toFixed(1);
    badgeEnvName.textContent = `Tùy chỉnh (g = ${g.toFixed(1)} m/s²)`;
    selGravityPreset.value = 'custom';
    engine.setGravity(g);
  });

  const rangeAirDrag = document.getElementById('rangeAirDrag');
  const valAirDrag   = document.getElementById('valAirDrag');
  rangeAirDrag.addEventListener('input', (e) => {
    const k = parseFloat(e.target.value);
    valAirDrag.textContent = k.toFixed(3);
    engine.setAirDrag(k);
  });

  document.getElementById('rangeWallRestitution').addEventListener('input', (e) => {
    engine.setWallRestitution(parseFloat(e.target.value));
  });

  /* ------------------------------------------------------------------
     Preset experiment library (left sidebar list)
  ------------------------------------------------------------------ */
  const presetListEl = document.getElementById('presetList');
  PRESET_EXPERIMENTS.forEach((preset) => {
    const item = document.createElement('div');
    item.className = `preset-item${preset.id === currentPresetId ? ' active' : ''}`;
    item.innerHTML = `
      <div class="preset-title">
        <span>${preset.title}</span>
        <span class="preset-category-tag">${preset.category}</span>
      </div>
      <div class="preset-desc">${preset.desc}</div>`;

    item.addEventListener('click', () => {
      document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      currentPresetId = preset.id;
      loadCurrentPreset();
    });
    presetListEl.appendChild(item);
  });

  /* ------------------------------------------------------------------
     AI context generator
  ------------------------------------------------------------------ */
  const txtContext = document.getElementById('txtContext');
  document.getElementById('btnGenerateScenario').addEventListener('click', () => {
    const prompt = txtContext.value.trim();
    if (!prompt) {
      alert('Vui lòng nhập mô tả thí nghiệm bạn muốn mô phỏng!');
      return;
    }
    parseContextAndGenerate(prompt, engine, engine.cssWidth, engine.cssHeight);
    document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
    charts.history = [];
    setPlayState(true);
  });

  /* ------------------------------------------------------------------
     Load initial experiment & start render loop
  ------------------------------------------------------------------ */
  loadCurrentPreset();

  let lastTime = performance.now();
  function loop(ts) {
    const dt = Math.min(0.05, (ts - lastTime) / 1000);
    lastTime = ts;

    if (engine.isRunning) {
      engine.updatePhysics(dt);
      inspector.updateLiveValues();
      charts.update(engine.simTime);
    }

    engine.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});
