// ============================================================
// config.js — ค่าคอนฟิกหลักทั้งหมดของระบบ
// ============================================================

const config = {
  count: 25,
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
  fogScale: 1.0,           // ตัวคูณความใสของน้ำ (มาก = ไกล/ใส, น้อย = ขุ่น)
  // ---- สีต้นฉบับ ----
  bodyColor: '#ef0101',    // แดง
  eyeColor: '#3928b8',
  tailColor: '#0e5167'     // ค่าเริ่มต้น (ถูก override ตาม preset)
};

// ============================================================
// ★ สีหางปลา / ตาปลา — แก้สีตรงนี้ ★
// ------------------------------------------------------------
// - dark     = ตอนกลางคืน (โหมดเริ่มต้น)
// - daylight = ตอนกลางวัน
// ค่า 'tail' = สีหาง, ค่า 'eye' = สีตา
// สีเหล่านี้ถูก apply อัตโนมัติเมื่อสลับโหมด (ดู App.applyPreset)
// ============================================================
const THEME_COLORS = {
  dark:     { tail: '#0e5167', eye: '#3928b8' },   // กลางคืน: ฟ้าเข้ม / ตาน้ำเงิน
  daylight: { tail: '#e8622a', eye: '#3928b8' }    // กลางวัน: ส้มแดง ตัดกับน้ำเขียว #1f8a7a
};

// ---- Auto day/night cycle: ปิดไว้ — user กดเปลี่ยนเองเท่านั้น ----
const autoCycle = {
  enabled: false,
  interval: 30,            // (ไม่ใช้แล้ว — เก็บไว้เผื่อเปิดทีหลัง)
  timer: 0
};

// ---- Presets กลางวัน / กลางคืน ----
// อยู่ใต้ทะเลแต่ "ใส" — fogNear/Far ไกลขึ้นเพื่อให้มองเห็นปลาได้ลึก
const DAYNIGHT = {
  dark: {
    background: '#000810',
    ambientColor: 0x4488ff, ambientIntensity: 1.0,
    sunIntensity: 0.8, rimIntensity: 1.5,
    fogNear: 150, fogFar: 520,   // ใสขึ้น (เดิม 40/150 — ขุ่นเกิน)
    bloom: true,            // กลางคืนเปิด bloom
    eyeEmissive: 2.0, tailEmissive: 1.5
  },
  daylight: {
    background: '#1f8a7a',
    ambientColor: 0x8fd8e8, ambientIntensity: 1.6,
    sunIntensity: 1.2, rimIntensity: 0.6,
    fogNear: 220, fogFar: 900,   // ใสขึ้น (เดิม 100/500)
    bloom: false,           // กลางวัน NO BLOOM — ปิดทั้ง pass
    eyeEmissive: 0.0, tailEmissive: 0.0   // ไม่มี glow ตอนกลางวัน
  }
};

// สถานะปัจจุบัน (dark | daylight)
const envState = { preset: 'dark' };
