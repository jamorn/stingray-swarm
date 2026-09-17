// ============================================================
// app.js — class App: scene, renderer, composer, lights,
// day/night cycle, interactions, GUI, collisions
// ============================================================

class App {
  constructor() {
    this.frame = 0;
    this.lastTimestamp = 0;
    this.rayInstances = [];

    // ---- scene / camera / renderer ----
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(DAYNIGHT.dark.background);
    this.scene.fog = new THREE.Fog(DAYNIGHT.dark.background, DAYNIGHT.dark.fogNear, DAYNIGHT.dark.fogFar);

    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 2000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    document.body.appendChild(this.renderer.domElement);

    // ---- post-processing ----
    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
    this.bloom = new THREE.UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight),
      config.bloomStrength, 0.4, 0.21
    );
    this.composer.addPass(this.bloom);
    // ---- shared materials (สร้างครั้งเดียว — ทุกตัวใช้ร่วมกัน) ----
    this.bodyMat = new THREE.MeshStandardMaterial({
      map: createPolimaxxTexture(config.bodyColor),   // สีแดงต้นฉบับ
      roughness: 0.3, metalness: 0.2
    });
    this.eyeMat = new THREE.MeshPhongMaterial({
      color: config.eyeColor, emissive: config.eyeColor,
      emissiveIntensity: 2.0, shininess: 100
    });
    this.tailMat = new THREE.MeshStandardMaterial({
      color: config.tailColor, emissive: config.tailColor, emissiveIntensity: 1.5
    });
    this.materials = { body: this.bodyMat, eye: this.eyeMat, tail: this.tailMat };

    // ---- lights ----
    this.ambient = new THREE.AmbientLight(0x4488ff, 1.0);
    this.sun = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sun.position.set(50, 100, 50);
    this.rim = new THREE.DirectionalLight(0xffffff, 1.5);
    this.rim.position.set(-50, -50, -50);
    this.scene.add(this.ambient, this.sun, this.rim);

    // ---- camera control state ----
    this.orbitRotation = { x: 0.2, y: 0 };
    this.zoom = 90;
    this.pointerPos = { x: 0, y: 0 };
    this.initialPinchDist = 0;
    this.initialZoom = this.zoom;
    this.touches = new Map();

    // ---- device-based tuning (จาก production) ----
    const maxTouch = navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0;
    const hasTouch = maxTouch > 0 || 'ontouchstart' in window;
    const hasFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    const isiPadUA = /ipad|macintosh/.test((navigator.userAgent || '').toLowerCase()) && hasTouch && /Macintosh/i.test(navigator.userAgent);
    const isNonDesktopTouch = (hasTouch && !hasFine) || isiPadUA;
    this.pinchScale = isNonDesktopTouch ? 1.2 : 0.5;
    this.wheelScale  = isNonDesktopTouch ? 0.6 : 0.12;
    this.zoomMin = isNonDesktopTouch ? 20 : 40;
    this.zoomMax = isNonDesktopTouch ? 800 : 450;

    this.initGUI();
    this.createStingrays();
    this.setupCamera();
    this.setupEvents();
    this.setupModeToggle();
    this.applyPreset(envState.preset);

    requestAnimationFrame(this.animate.bind(this));
  }

  // ============================================================
  // Day / Night — เปลี่ยนทันที (ไม่มี fade)
  // ============================================================

  // อ่านค่า env ปัจจุบัน (สร้างจาก preset ครั้งแรก ถ้ายังไม่มี)
  _readCurrentEnv() {
    if (!this._env) {
      const p = DAYNIGHT.dark;
      this._env = this._presetToEnv(p, 'dark');
    }
    return this._env;
  }

  // แปลง preset → env object (ค่าตัวเลข + Color ใหม่ทุกครั้ง)
  _presetToEnv(p, mode) {
    const theme = (typeof THEME_COLORS !== 'undefined' && THEME_COLORS[mode]) || null;
    return {
      bg: new THREE.Color(p.background),
      ambientColor: new THREE.Color(p.ambientColor),
      ambientIntensity: p.ambientIntensity,
      sunIntensity: p.sunIntensity,
      rimIntensity: p.rimIntensity,
      fogNear: p.fogNear,
      fogFar: p.fogFar,
      bloom: p.bloom ? config.bloomStrength : 0,
      eyeEmissive: p.eyeEmissive,
      tailEmissive: p.tailEmissive,
      // สีหาง/ตา ตามโหมด
      tailColor: new THREE.Color(theme ? theme.tail : config.tailColor),
      eyeColor:  new THREE.Color(theme ? theme.eye  : config.eyeColor)
    };
  }

  applyPreset(mode) {
    const p = DAYNIGHT[mode];

    // ---- apply ค่าทันที (ไม่มี fade) ----
    this._env = this._presetToEnv(p, mode);
    envState.preset = mode;

    // ---- อัปเดต UI ทันที (ตัวหนังสือ/ไอคอน) ----
    const isDay = (mode === 'daylight');
    document.getElementById('mode-text').innerText = isDay ? 'Daylight Mode' : 'Dark Mode';
    document.getElementById('mode-icon').innerText = isDay ? '☀️' : '🌙';
    document.getElementById('mode-toggle').classList.toggle('daylight-ui', isDay);

    if (this.gui) this.gui.controllersRecursive().forEach(c => c.updateDisplay());

    // ---- เขียนลง scene จริงทันที ----
    this.applyEnvToScene();
  }

  // เขียนค่า env ปัจจุบันลง scene (lights / fog / bg / bloom / emissive)
  applyEnvToScene() {
    const e = this._readCurrentEnv();

    this.scene.background.copy(e.bg);
    this.scene.fog.color.copy(e.bg);
    this.scene.fog.near = e.fogNear * config.fogScale;
    this.scene.fog.far  = e.fogFar  * config.fogScale;

    this.ambient.color.copy(e.ambientColor);
    this.ambient.intensity = e.ambientIntensity;
    this.sun.intensity = e.sunIntensity;
    this.rim.intensity = e.rimIntensity;

    this.bloom.strength = e.bloom;

    // ---- สีหาง/ตา ตามโหมด ----
    // ★ สีจริงกำหนดที่ THEME_COLORS ใน js/config.js (dark / daylight) ★
    // ตรงนี้แค่ copy ค่าจาก env ลง material ที่ใช้ร่วมกันทุกตัว
    if (e.tailColor) this.tailMat.color.copy(e.tailColor);
    if (e.eyeColor) {
      this.eyeMat.color.copy(e.eyeColor);
      this.eyeMat.emissive.copy(e.eyeColor);
    }

    this.eyeMat.emissiveIntensity  = e.eyeEmissive;
    this.tailMat.emissiveIntensity = e.tailEmissive;
  }

  // เรียกทุกเฟรม — เขียนค่า env ลง scene (ให้ GUI ปรับสดได้)
  updateEnvironment(delta) {
    this.applyEnvToScene();
  }

  setupModeToggle() {
    document.getElementById('mode-toggle').addEventListener('click', () => {
      this.applyPreset(envState.preset === 'dark' ? 'daylight' : 'dark');
    });
  }

  // ============================================================
  // Stingrays
  // ============================================================
  createStingrays() {
    const placed = [];
    for (let i = 0; i < config.count; i++) {
      const s = new Stingray(this.scene, this.materials, i);

      // spawn separation — หาจุดที่ห่างจากตัวที่วางแล้ว
      let tries = 0;
      let pos;
      do {
        // สุ่มในปริมาตรลูกบาศก์ → กระจายทั่ว volume (ไม่เบียดขอบ)
        pos = new THREE.Vector3(
          (Math.random() * 2 - 1) * config.bounds * 0.7,
          (Math.random() * 2 - 1) * config.bounds * 0.4,
          (Math.random() * 2 - 1) * config.bounds * 0.7
        );
        let ok = true;
        for (const p of placed) {
          if (pos.distanceTo(p) < config.spawnSeparation) { ok = false; break; }
        }
        if (ok) break;
        tries++;
      } while (tries < 60);

      placed.push(pos.clone());
      s.group.position.copy(pos);
      this.rayInstances.push(s);
    }
  }

  rebuildStingrays() {
    this.rayInstances.forEach(r => r.dispose());
    this.rayInstances = [];
    this.createStingrays();
  }

  // ============================================================
  // Collisions — push apart (reuse temp vectors, ไม่สร้าง object ใหม่ทุกเฟรม)
  // ============================================================
  resolveCollisions() {
    const rays = this.rayInstances;
    const margin = 2.5;
    for (let i = 0; i < rays.length; i++) {
      const a = rays[i];
      for (let j = i + 1; j < rays.length; j++) {
        const b = rays[j];
        _v1.subVectors(a.group.position, b.group.position);
        const dist = _v1.length();
        const minDist = a.radius + b.radius + margin;
        if (dist >= minDist || dist < 1e-6) continue;
        _v1.normalize();
        const push = Math.min((minDist - dist) * 0.55, 1.0) * 0.6;
        a.group.position.addScaledVector(_v1, push);
        b.group.position.addScaledVector(_v1, -push);
      }
    }
  }

  // ============================================================
  // GUI
  // ============================================================
  initGUI() {
    if (!window.lil) return;
    try {
      this.gui = new lil.GUI({ title: 'Polimaxx Stingray Swarm' });

      const envFolder = this.gui.addFolder('Environment');
      envFolder.add(envState, 'preset', ['dark', 'daylight']).name('Mode').onChange(m => {
        this.applyPreset(m);
      });
      envFolder.add(config, 'bloomStrength', 0, 1.5, 0.01).name('Bloom (dark)').onChange(() => {
        // ค่าใหม่จะถูก lerp เข้าเองใน updateEnvironment ทุกเฟรม
      });
      envFolder.add(config, 'fogScale', 0.2, 4.0, 0.05).name('Water Clarity (fog)');

      const motionFolder = this.gui.addFolder('Motion');
      motionFolder.add(config, 'flapSpeed', 0.1, 2.0).name('Flap Speed');
      motionFolder.add(config, 'flapStrength', 0.1, 2.0).name('Flap Strength');
      motionFolder.add(config, 'timeScale', 0.1, 2.0).name('Time Scale');
      motionFolder.add(config, 'count', 5, 100, 1).name('Count').onChange(() => this.rebuildStingrays());

      this.gui.close();
    } catch (err) {
      console.warn('Could not create GUI', err);
    }
  }

  // ============================================================
  // Camera + Interactions
  // ============================================================
  setupCamera() { this.updateCamera(); }

  updateCamera() {
    this.camera.position.set(
      this.zoom * Math.sin(this.orbitRotation.y) * Math.cos(this.orbitRotation.x),
      this.zoom * Math.sin(this.orbitRotation.x),
      this.zoom * Math.cos(this.orbitRotation.y) * Math.cos(this.orbitRotation.x)
    );
    this.camera.lookAt(0, 0, 0);
  }

  setupEvents() {
    window.addEventListener('resize', () => this.onResize());

    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    el.style.msTouchAction = 'none';

    el.addEventListener('pointerdown', e => {
      if (e.target.closest('.lil-gui') || e.target.closest('#mode-toggle')) return;
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.pointerPos = { x: e.clientX, y: e.clientY };
      if (this.touches.size === 2) {
        const pts = Array.from(this.touches.values());
        this.initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.initialZoom = this.zoom;
      }
      el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', e => {
      if (!this.touches.has(e.pointerId)) return;
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.touches.size === 1) {
        this.orbitRotation.y -= (e.clientX - this.pointerPos.x) * 0.005;
        this.orbitRotation.x -= (e.clientY - this.pointerPos.y) * 0.005;
        // อนุญาตพลิกดูใต้ scene
        this.orbitRotation.x = Math.max(-Math.PI + 0.1, Math.min(Math.PI - 0.1, this.orbitRotation.x));
        this.pointerPos = { x: e.clientX, y: e.clientY };
      } else if (this.touches.size === 2) {
        const pts = Array.from(this.touches.values());
        const currDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (!this.initialPinchDist) {
          this.initialPinchDist = currDist;
          this.initialZoom = this.zoom;
        }
        const diff = this.initialPinchDist - currDist;
        this.zoom = THREE.MathUtils.clamp(this.initialZoom + diff * this.pinchScale, this.zoomMin, this.zoomMax);
      }
      this.updateCamera();
    });

    const endPointer = (e) => {
      this.touches.delete(e.pointerId);
      if (this.touches.size < 2) this.initialPinchDist = 0;
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

    el.addEventListener('wheel', e => {
      this.zoom = THREE.MathUtils.clamp(this.zoom + e.deltaY * this.wheelScale, this.zoomMin, this.zoomMax);
      this.updateCamera();
    }, { passive: true });
  }

  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
  }

  // ============================================================
  // Main loop
  // ============================================================
  animate(timestamp) {
    requestAnimationFrame(this.animate.bind(this));

    let delta = timestamp - (this.lastTimestamp || timestamp);
    this.lastTimestamp = timestamp;
    if (delta > 200) delta = 200;          // กันกระโดดตอนแท็บหลับ
    const dt = delta / 16.667;             // 1.0 = 60fps — frame-rate independent

    // ---- เขียนค่า environment ลง scene (bg/fog/lights/bloom/emissive) ----
    this.updateEnvironment(delta);

    this.frame++;
    for (const r of this.rayInstances) r.update(delta, this.rayInstances, dt, this.frame);
    this.resolveCollisions();
    this.composer.render();
  }
}
