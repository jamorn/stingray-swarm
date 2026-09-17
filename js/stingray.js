// ============================================================
// stingray.js — class Stingray (Full OOP)
// แก้ไขจากเวอร์ชันเดิม:
//   1. หาง: cone 20x48 segments + smoothstep amplitude + ลดความถี่คลื่น
//      → ไม่เป็นปล้อง, computeVertexNormals สลับเฟรมเพื่อประหยัด CPU
//   2. ไม่มี allocation ใน update loop (reuse temp vectors)
//   3. this.direction ถูกอัปเดตตาม targetDirection จริง (เดิมค้างค่า init)
//   4. movement/turn scale ด้วย dt → frame-rate independent
//   5. dispose() สำหรับ rebuild
// ============================================================

// temp objects ใช้ร่วมกันทั้งระบบ — ห้ามเก็บ reference ถาวร
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _dummy = new THREE.Object3D();

class Stingray {
  constructor(scene, materials, index = 0) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.animTime = Math.random() * 100;
    this.frameOffset = index % 3;   // กระจายจังหวะ computeVertexNormals

    // ขนาด: 8% ตัวยักษ์, 17% ตัวกลาง, ที่เหลือตัวเล็ก
    const rand = Math.random();
    let scale;
    if (rand > 0.92)      scale = 4.5 + Math.random() * 2.0;
    else if (rand > 0.75) scale = 2.5 + Math.random() * 1.5;
    else                  scale = 0.8 + Math.random() * 0.8;

    this.group.scale.set(scale, scale, scale);
    this.radius = scale * 2.5;

    const baseSpeed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
    this.moveSpeed = (scale > 3) ? baseSpeed * 0.5 : baseSpeed;

    const angle = Math.random() * Math.PI * 2;
    this.direction = new THREE.Vector3(Math.cos(angle), (Math.random() - 0.5) * 0.1, Math.sin(angle)).normalize();
    this.targetDirection = this.direction.clone();

    const r = Math.random() * config.bounds;
    const a = Math.random() * Math.PI * 2;
    const py = (Math.random() - 0.5) * config.bounds * 0.6;
    this.group.position.set(Math.cos(a) * r, py, Math.sin(a) * r);

    this.changeTargetTime = 0;
    this.currentRoll = 0;
    this.initMesh(materials);
    scene.add(this.group);
  }

  initMesh(materials) {
    // ---- body shape (diamond) ----
    const shape = new THREE.Shape();
    shape.moveTo(0, -1.8);
    shape.bezierCurveTo(1.7, -1.6, 3.2, -0.8, 3.2, 0);
    shape.bezierCurveTo(3.2, 0.8, 1.4, 1.6, 0, 1.8);
    shape.bezierCurveTo(-1.4, 1.6, -3.2, 0.8, -3.2, 0);
    shape.bezierCurveTo(-3.2, -0.8, -1.7, -1.6, 0, -1.8);

    const geom = new THREE.ExtrudeBufferGeometry(shape, {
      depth: config.bodyDepth,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.3,
      bevelSegments: 15
    });

    const pos = geom.attributes.position;
    const uvs = geom.attributes.uv;

    // ---- UV mapping แบบต้นฉบับ (mirror logo 2 ฝั่ง) ----
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);

      const distFromCenter = Math.abs(x) / 3.2;
      const taper = THREE.MathUtils.lerp(1.0, config.wingTaper, distFromCenter);
      const centeredZ = z - (config.bodyDepth / 2);
      pos.setZ(i, (centeredZ * taper) + (config.bodyDepth / 2));

      if (z >= config.bodyDepth - 0.05) {
        uvs.setXY(i, (-x / 6.4 * 0.45) + 0.25, (-y / 3.6 * 0.45) + 0.5);
      } else if (z <= 0.05) {
        uvs.setXY(i, (-x / 6.4 * 0.45) + 0.75, (-y / 3.6 * 0.45) + 0.5);
      } else {
        uvs.setXY(i, 0.5, (z > config.bodyDepth / 2) ? 0.03 : 0.97);
      }
    }

    // ---- bulge ริ้วตามแนวลำตัว (บางลงจากเดิม) ----
    let maxAbsX = 0, zMin = Infinity, zMax = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), pz = pos.getZ(i);
      maxAbsX = Math.max(maxAbsX, Math.abs(px));
      if (pz < zMin) zMin = pz;
      if (pz > zMax) zMax = pz;
    }
    const depthRange = Math.max(1e-6, zMax - zMin);
    const segs = config.segmentCount || 3;
    const bulgeAmp = config.segmentBulge || 0.08;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const vz = (z - zMin) / depthRange;
      const ring = Math.sin(vz * Math.PI * segs);
      const sideFactor = (maxAbsX > 0) ? Math.pow(Math.abs(x) / maxAbsX, 1.2) : 0;
      const bulge = ring * bulgeAmp * sideFactor;
      const r = Math.hypot(x, y) || 1;
      pos.setX(i, x + (x / r) * bulge);
      pos.setY(i, y + (y / r) * bulge);
    }

    this.initialPositions = new Float32Array(pos.array);
    this.mesh = new THREE.Mesh(geom, materials.body);
    this.mesh.rotation.x = -Math.PI / 2;
    this.group.add(this.mesh);

    // ---- eyes (shared material) ----
    const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    this.eyeL = new THREE.Mesh(eyeGeo, materials.eye);
    this.eyeR = new THREE.Mesh(eyeGeo, materials.eye);
    this.mesh.add(this.eyeL, this.eyeR);

    const eyeDistFromCenter = config.eyeX / 3.2;
    const eyeTaperFactor = THREE.MathUtils.lerp(1.0, config.wingTaper, eyeDistFromCenter);
    this.eyeZPos = (config.bodyDepth / 2) * eyeTaperFactor;

    // ---- tail: cone หนาแน่น 20x48 → โค้งนุ่ม ไม่เป็นปล้อง ----
    geom.computeBoundingBox();
    const bb = geom.boundingBox;
    const bodyCenterY = (bb.min.y + bb.max.y) * 0.5;
    const surfaceZ = (config.bodyDepth / 2) + this.eyeZPos;
    const bodyBackZ = (Math.abs(bb.min.z - surfaceZ) > Math.abs(bb.max.z - surfaceZ)) ? bb.min.z : bb.max.z;

    const tailLen = 4.0;
    const tgeo = new THREE.ConeGeometry(0.06, tailLen, 20, 48);   // เดิม (8, 12)
    tgeo.translate(0, (tailLen / 2 + 1.8), 0);
    this.tailInitPos = new Float32Array(tgeo.attributes.position.array);
    this.tailLen = tailLen;

    this.tailMesh = new THREE.Mesh(tgeo, materials.tail);
    this.mesh.add(this.tailMesh);
    this.tailMesh.position.set(0, bodyCenterY, bodyBackZ + config.tailOffsetZ);
  }

  // ความสูงผิวคลื่นตามตำแหน่ง (ใช้กับ eyes)
  _getW(t, x, y) {
    const d = Math.abs(x);
    return Math.sin(t + d * 1.8 - y * 0.5) * 0.35 * (d <= 0.4 ? d * 0.1 : (d - 0.4) * 1.2) * config.flapStrength;
  }

  update(delta, others, dt, frame) {
    this.animTime += delta * 0.003 * config.flapSpeed * config.timeScale;
    const t = this.animTime;

    // ---- separation (reuse temp vectors — ไม่ alloc ใหม่) ----
    _v1.set(0, 0, 0);
    let cnt = 0;
    for (const other of others) {
      if (other === this) continue;
      const d = this.group.position.distanceTo(other.group.position);
      const minD = (this.radius + other.radius) + 15;
      if (d < minD) {
        _v2.subVectors(this.group.position, other.group.position)
            .normalize()
            .divideScalar(Math.max(0.1, d));
        _v1.add(_v2);
        cnt++;
      }
    }
    if (cnt > 0) {
      _v1.divideScalar(cnt);
      this.targetDirection.add(_v1.multiplyScalar(0.05)).normalize();
    }

    // ---- wander (แก้บั๊ก: direction ต้องตาม targetDirection จริง) ----
    if (t > this.changeTargetTime) {
      const angle = Math.atan2(this.direction.x, this.direction.z) + (Math.random() - 0.5) * Math.PI * 0.5;
      this.targetDirection.set(Math.sin(angle), (Math.random() - 0.5) * 0.2, Math.cos(angle)).normalize();
      this.direction.copy(this.targetDirection);
      this.changeTargetTime = t + 10 + Math.random() * 20;
    }

    // ---- bounds: ใช้ config.bounds จุดเดียว (เดิมขัดแย้ง 80 vs 110) ----
    const len = this.group.position.length();
    if (len > config.bounds * 0.9) {
      _v2.copy(this.group.position).negate().normalize();
      this.targetDirection.lerp(_v2, 0.08).normalize();
    }
    if (len > config.bounds) {
      this.group.position.multiplyScalar((config.bounds * 0.98) / len);
    }

    // ---- steering + roll (scale ด้วย dt → frame-rate independent) ----
    const lastY = this.group.rotation.y;
    _dummy.position.copy(this.group.position);
    _v2.copy(this.group.position).add(this.targetDirection);
    _dummy.lookAt(_v2);
    this.group.quaternion.rotateTowards(_dummy.quaternion, config.turnSpeed * dt);

    let turnDiff = this.group.rotation.y - lastY;
    if (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
    if (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, -turnDiff * 30, 0.05);
    this.mesh.rotation.y = this.currentRoll;
    this.group.translateZ(this.moveSpeed * dt);

    // ---- body flap ----
    const posAttr = this.mesh.geometry.attributes.position;
    const init = this.initialPositions;
    for (let i = 0; i < posAttr.count; i++) {
      const x = init[i * 3], y = init[i * 3 + 1], pz = init[i * 3 + 2];
      const d = Math.abs(x);
      const flapAmp = (d <= 0.4 ? d * 0.1 : (d - 0.4) * 1.2);
      const wave = Math.sin(t + d * 1.8 - y * 0.5) * 0.35 * flapAmp * config.flapStrength;
      posAttr.setZ(i, pz + wave);
    }
    posAttr.needsUpdate = true;

    // ---- eyes ตามผิวคลื่น ----
    const sZ = (config.bodyDepth / 2) + this.eyeZPos;
    this.eyeL.position.set(-config.eyeX, -config.eyeY, sZ + config.eyeHover + this._getW(t, -config.eyeX, -config.eyeY));
    this.eyeR.position.set(config.eyeX, -config.eyeY, sZ + config.eyeHover + this._getW(t, config.eyeX, -config.eyeY));

    // ---- tail: คลื่นนุ่ม ไม่เป็นปล้อง ----
    if (this.tailMesh && this.tailInitPos) {
      const attr = this.tailMesh.geometry.attributes.position;
      const tinit = this.tailInitPos;
      for (let vi = 0; vi < attr.count; vi++) {
        const bx = tinit[vi * 3], by = tinit[vi * 3 + 1];
        const vt = Math.max(0, (by - 1.8) / this.tailLen);
        const amp = vt * vt * (3 - 2 * vt);                       // smoothstep — โคนหางนุ่ม
        const wave = Math.sin(t * (1 + config.flapSpeed * 2.2) - vt * 3.0)  // ความถี่ 6→3
                   * 0.45 * amp * config.flapStrength * config.timeScale;   // แอมป์ 0.55→0.45
        attr.setX(vi, bx + wave);
      }
      attr.needsUpdate = true;
      // normals สลับทุก 3 เฟรม (stagger ต่อตัว) — แสงตามการบิดโดยไม่หนักเกิน
      if ((frame + this.frameOffset) % 3 === 0) {
        this.tailMesh.geometry.computeVertexNormals();
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    // materials เป็น shared — ไม่ dispose ที่นี่
  }
}
