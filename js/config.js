// ============================================================
// config.js — ค่าคอนฟิกหลักทั้งหมดของระบบ
// ============================================================

const config = {
  count: 45,
  bounds: 110,
  spawnSeparation: 10,
  minSpeed: 0.04,
  maxSpeed: 0.09,
  turnSpeed: 0.012,        // rad / frame (60fps)
  flapStrength: 0.6,
  flapSpeed: 0.75,
  eyeHover: 0.08,
  eyeX: 0.45,
  eyeY: 1.50,
  bodyDepth: 0.45,
  wingTaper: 0.15,
  segmentCount: 3,         // จำนวนริ้ว bulge ตามแนวลำตัว
  segmentBulge: 0.08,      // แอมพลิจูด bulge (เดิม 0.22 — มากเกิน ริ้วเห็นชัด)
  tailOffsetZ: 0.48,
  timeScale: 1.0,
  bloomStrength: 0.6,      // ใช้เฉพาะตอนกลางคืน
  // ---- สีต้นฉบับ ----
  bodyColor: '#ef0101',    // แดง
  eyeColor: '#3928b8',
  tailColor: '#0e5167'
};

// ---- Auto day/night cycle: 30 วิ/โหมด → 1 นาที = 2 ครั้ง ----
const autoCycle = {
  enabled: true,
  interval: 30,            // วินาทีต่อโหมด
  timer: 0
};

// ---- Presets กลางวัน / กลางคืน ----
const DAYNIGHT = {
  dark: {
    background: '#000810',
    ambientColor: 0x4488ff, ambientIntensity: 1.0,
    sunIntensity: 0.8, rimIntensity: 1.5,
    fogNear: 40, fogFar: 150,
    bloom: true,            // กลางคืนเปิด bloom
    eyeEmissive: 2.0, tailEmissive: 1.5
  },
  daylight: {
    background: '#88ccff',
    ambientColor: 0xffffff, ambientIntensity: 1.6,
    sunIntensity: 1.2, rimIntensity: 0.6,
    fogNear: 100, fogFar: 500,
    bloom: false,           // กลางวัน NO BLOOM — ปิดทั้ง pass
    eyeEmissive: 0.0, tailEmissive: 0.0   // ไม่มี glow ตอนกลางวัน
  }
};

// สถานะปัจจุบัน (dark | daylight)
const envState = { preset: 'dark' };
