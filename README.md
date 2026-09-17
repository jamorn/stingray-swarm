# Stingray Swarm — Polimaxx Interactive Env

ฉาก 3D แบบ interactive ของฝูงปลากระเบน (Stingray) ว่ายอยู่ในท้องทะเล
สร้างด้วย **Three.js (r128)** — รองรับทั้ง Desktop / Mobile / Tablet พร้อมระบบ
กลางวัน–กลางคืน (สลับเองด้วยการคลิก) และ post-processing (Bloom)

## ✨ ฟีเจอร์

- **ฝูงปลากระเบน 3D** — รูปร่าง diamond + ลายปีกที่บิดขึ้นลงตามจังหวะว่ายน้ำ (flap)
- **หางโค้งนุ่ม** — ใช้ cone ความละเอียดสูง + smoothstep amplitude ป้องกันหางเป็นปล้อง
- **ระบบหลบกัน (separation)** — ปลาแต่ละตัวเว้นระยะห่าง ไม่ทับกัน
- **Cohesion** — ดึงปลาเข้าหาศูนย์กลางเบาๆ ทำให้ฝูงกระจายทั่ว ไม่กองที่ขอบ
- **Wander / Steering** — เปลี่ยนทิศทางแบบสุ่มและหันตัวอย่างนุ่มนวล (frame-rate independent)
- **Day / Night** — สลับกลางวัน–กลางคืน**ทันที**เมื่อคลิก (ไม่มี fade) เริ่มที่ Dark Mode
- **สีตามโหมด** — สีน้ำและสีหาง/ตาปลาเปลี่ยนตามกลางวัน/กลางคืน (ดู `THEME_COLORS`)
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
    ├── config.js       # ค่าคอนฟิกหลัก + สีหาง/ตา (THEME_COLORS) + presets day/night
    ├── texture.js      # สร้าง texture โลโก้ POLIMAXX (cache ต่อสี)
    ├── stingray.js     # class Stingray — mesh, animation, steering, cohesion
    ├── app.js          # class App — scene, renderer, lights, day/night, GUI
    ├── ui.js           # device detection + control hints
    └── main.js         # entry point
```

## 🚀 วิธีรัน

โปรเจกต์นี้เป็น static site — ใช้ CDN สำหรับ Three.js จึงต้องมีอินเทอร์เน็ต

**แนะนำ: ใช้ Live Server (VS Code)**
1. เปิดโฟลเดอร์โปรเจกต์ใน VS Code
2. คลิกขวาที่ `index.html` → **Open with Live Server**
3. เบราว์เซอร์จะเปิดที่ `http://127.0.0.1:5500/` (หรือพอร์ตที่ Live Server ตั้งไว้)

> หรือจะใช้ server ตัวอื่นก็ได้ เช่น `npx serve` หรือ `python3 -m http.server 8000`
> (แนะนำให้รันผ่าน server เพื่อความเสถียร ไม่ควรเปิด `index.html` ตรงๆ)

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
  count: 25,           // จำนวนปลา
  bounds: 110,         // ขอบเขตการว่าย
  minSpeed: 0.04,      // ความเร็วต่ำสุด
  maxSpeed: 0.09,      // ความเร็วสูงสุด
  flapSpeed: 0.75,     // ความเร็วการกระพือปีก
  flapStrength: 0.6,   // ความแรงการกระพือ
  bloomStrength: 0.6,  // ความแรง bloom (กลางคืน)
  // ...
};
```

**สีหางปลา / ตาปลา** (แยกตามโหมด) อยู่ที่ `THEME_COLORS` ใน `js/config.js`:

```javascript
const THEME_COLORS = {
  dark:     { tail: '#0e5167', eye: '#3928b8' },   // กลางคืน
  daylight: { tail: '#e8622a', eye: '#3928b8' }    // กลางวัน (ส้มแดง ตัดกับน้ำเขียว)
};
```

สีน้ำและค่าอื่นๆ ของแต่ละโหมด อยู่ที่ `DAYNIGHT` ใน `js/config.js`
(เช่น `daylight.background = '#1f8a7a'` = สีน้ำเขียวมรกต)

> **หมายเหตุ:** ระบบเปลี่ยนโหมด**ทันที**เมื่อคลิก (ไม่มี fade) และ**ไม่มี auto cycle**
> — เริ่มที่ Dark Mode เสมอ ผู้ใช้เป็นคนกดสลับเอง

## 🛠 Tech Stack

- [Three.js r128](https://threejs.org/)
- [UnrealBloomPass](https://threejs.org/examples/#webgl_postprocessing_unreal_bloom) (post-processing)
- [lil-gui](https://lil-gui.georgealways.com/) (control panel)

## 👨‍💻 Developer

likit_se@irpc.co.th

## 📄 License

This project is for internal/demo use.
