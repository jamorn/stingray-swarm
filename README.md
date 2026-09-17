# Stingray Swarm — Polimaxx Interactive Env

ฉาก 3D แบบ interactive ของฝูงปลากระเบน (Stingray) ว่ายอยู่ในท้องทะเล
สร้างด้วย **Three.js (r128)** — รองรับทั้ง Desktop / Mobile / Tablet พร้อมระบบ
กลางวัน–กลางคืนอัตโนมัติ และ post-processing (Bloom)

## ✨ ฟีเจอร์

- **ฝูงปลากระเบน 3D** — รูปร่าง diamond + ลายปีกที่บิดขึ้นลงตามจังหวะว่ายน้ำ (flap)
- **หางโค้งนุ่ม** — ใช้ cone ความละเอียดสูง + smoothstep amplitude ป้องกันหางเป็นปล้อง
- **ระบบหลบกัน (separation)** — ปลาแต่ละตัวเว้นระยะห่าง ไม่ทับกัน
- **Wander / Steering** — เปลี่ยนทิศทางแบบสุ่มและหันตัวอย่างนุ่มนวล (frame-rate independent)
- **Day / Night** — สลับกลางวัน–กลางคืนแบบค่อยๆ (smooth fade) พร้อม auto cycle ทุก 30 วินาที
- **Bloom** — เรืองแสงตอนกลางคืน / ปิดสนิทตอนกลางวัน
- **ควบคุมกล้อง** — หมุน (left drag / touch) และ zoom (scroll / pinch)
- **GUI (lil-gui)** — ปรับค่า motion และ environment ได้สดๆ
- **Responsive UI** — แสดง control hints ตามอุปกรณ์ที่ตรวจพบ

## 📁 โครงสร้างโปรเจกต์

```
stingray-swarm/
├── index.html          # โหลด Three.js + script ทั้งหมด
├── css/
│   └── style.css       # สไตล์ UI (mode toggle, hints, dev info)
└── js/
    ├── config.js       # ค่าคอนฟิกหลัก + presets กลางวัน/กลางคืน
    ├── texture.js      # สร้าง texture โลโก้ POLIMAXX (cache ต่อสี)
    ├── stingray.js     # class Stingray — mesh, animation, steering
    ├── app.js          # class App — scene, renderer, lights, day/night, GUI
    ├── ui.js           # device detection + control hints
    └── main.js         # entry point
```

## 🚀 วิธีรัน

โปรเจกต์นี้เป็น static site — ใช้ CDN สำหรับ Three.js จึงต้องมีอินเทอร์เน็ต

```bash
# เปิด local server
python3 -m http.server 8000
```

แล้วเปิดเบราว์เซอร์ที่ http://localhost:8000

> หรือเปิด `index.html` ตรงๆ ก็ได้ แต่แนะนำให้รันผ่าน server เพื่อความเสถียร

## 🎮 การควบคุม

| การกระทำ | Desktop | Mobile / Tablet |
|----------|---------|-----------------|
| หมุนกล้อง | Left click + drag | Touch + drag |
| Zoom | Scroll | 2 fingers / Pinch |
| สลับโหมด | ปุ่มมุมซ้ายบน | ปุ่มมุมซ้ายบน |
| ปรับค่า | lil-gui (มุมขวาบน) | lil-gui (มุมขวาบน) |

## ⚙️ การปรับแต่ง

แก้ค่าหลักทั้งหมดได้ที่ `js/config.js`:

```javascript
const config = {
  count: 45,           // จำนวนปลา
  bounds: 110,         // ขอบเขตการว่าย
  minSpeed: 0.04,      // ความเร็วต่ำสุด
  maxSpeed: 0.09,      // ความเร็วสูงสุด
  flapSpeed: 0.75,     // ความเร็วการกระพือปีก
  flapStrength: 0.6,   // ความแรงการกระพือ
  bloomStrength: 0.6,  // ความแรง bloom (กลางคืน)
  // ...
};
```

รอบกลางวัน–กลางคืน:

```javascript
const autoCycle = {
  enabled: true,
  interval: 30    // วินาทีต่อโหมด
};
```

ค่าความเร็วของ fade กลางวัน/กลางคืน อยู่ที่ `updateEnvironment()` ใน `js/app.js`
(ตัวแปร `dur` — ยิ่งมากยิ่งนุ่ม)

## 🛠 Tech Stack

- [Three.js r128](https://threejs.org/)
- [UnrealBloomPass](https://threejs.org/examples/#webgl_postprocessing_unreal_bloom) (post-processing)
- [lil-gui](https://lil-gui.georgealways.com/) (control panel)

## 👨‍💻 Developer

likit_se@irpc.co.th

## 📄 License

This project is for internal/demo use.
