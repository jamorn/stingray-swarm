// ============================================================
// texture.js — สร้าง texture โลโก้ POLIMAXX แบบต้นฉบับ (mirror 2 ฝั่ง)
// texture ถูก cache ต่อสี — ไม่สร้างซ้ำเปลือง VRAM
// ============================================================

const textureCache = new Map();

function getBrightness(hexColor) {
  const rgb = parseInt(hexColor.replace('#', ''), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function createPolimaxxTexture(color = '#ffffff') {
  if (textureCache.has(color)) return textureCache.get(color);

  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const brightness = getBrightness(color);
  const brandBlue = '#0e3a66', brandOrange = '#f37021';
  const textColor = brightness > 140 ? brandBlue : '#ffffff';

  ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = brandOrange; ctx.fillRect(0, 0, 2048, 60);
  ctx.fillStyle = brandBlue; ctx.fillRect(0, 964, 2048, 60);

  const drawLogoSet = (offsetX, isMirror = false) => {
    ctx.save();
    ctx.translate(offsetX + 512, 512);
    if (isMirror) ctx.scale(-1, 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
    ctx.fillStyle = textColor; ctx.font = 'bold 44px Arial'; ctx.fillText('POLIMAXX', 0, -145);
    ctx.fillStyle = brandOrange; ctx.font = '900 220px Arial'; ctx.fillText('PP', 0, -10);
    ctx.fillStyle = textColor; ctx.font = 'bold 38px Arial'; ctx.fillText('POLYETHYLENE', 0, 105);
    ctx.restore();
  };
  drawLogoSet(0, false); drawLogoSet(1024, true);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  textureCache.set(color, texture);
  return texture;
}
