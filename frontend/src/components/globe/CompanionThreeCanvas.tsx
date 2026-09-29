import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CompanionStyle } from '../../context/NoriContext';

interface CompanionThreeCanvasProps {
  style: CompanionStyle;
  size?: number;
  interactive?: boolean;
  audioLevel?: number;
  className?: string;
}

export const CompanionThreeCanvas: React.FC<CompanionThreeCanvasProps> = ({
  style,
  size = 320,
  interactive = true,
  audioLevel = 0,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous canvases
    container.innerHTML = '';

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.4, 5.4);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Dynamic Color Configuration
    const configMap: Record<CompanionStyle, { primary: number; secondary: number; accent: number }> = {
      orb: { primary: 0x22d3ee, secondary: 0xa855f7, accent: 0xfb923c },
      nova: { primary: 0xff6b35, secondary: 0xf59e0b, accent: 0xfbbf24 },   // Cyber Prism (Amber/Gold)
      kuro: { primary: 0xa855f7, secondary: 0xec4899, accent: 0x06b6d4 },   // Hyper Cube (Neon Violet/Magenta)
      lumi: { primary: 0x00f0ff, secondary: 0x3b82f6, accent: 0xd946ef },   // Plasma Wisp (Cyan/Electric Blue)
      rover: { primary: 0x38bdf8, secondary: 0x6366f1, accent: 0x00f0ff },  // Nexus Bot (Aero Drone)
      sprout: { primary: 0x10b981, secondary: 0x34d399, accent: 0xa7f3d0 }  // Bio Lotus (Emerald Harmony)
    };
    const palette = configMap[style] || configMap.nova;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimPointLight = new THREE.PointLight(palette.primary, 3.5, 8);
    rimPointLight.position.set(0, 0, 2.5);
    scene.add(rimPointLight);

    // 5. Stage Platform & Contact Shadow
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Subtle dark metallic base ring
    const baseGeo = new THREE.CylinderGeometry(1.8, 1.95, 0.12, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x080b14,
      roughness: 0.35,
      metalness: 0.8
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.6;
    stageGroup.add(baseMesh);

    // Glowing Neon Edge Ring
    const neonRingGeo = new THREE.TorusGeometry(1.82, 0.035, 16, 64);
    const neonRingMat = new THREE.MeshStandardMaterial({
      color: palette.primary,
      emissive: palette.primary,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    const neonRing = new THREE.Mesh(neonRingGeo, neonRingMat);
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = -1.53;
    stageGroup.add(neonRing);

    // Radial Gradient Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.52;
    stageGroup.add(shadowMesh);

    // 6. Master Companion Pet Object Group
    const petGroup = new THREE.Group();
    petGroup.position.y = 0.05;
    scene.add(petGroup);

    // Specific Procedural 3D Pet Architectures
    let updatePet: (time: number, audio: number) => void = () => {};

    if (style === 'nova') {
      // ==========================================
      // MODEL 1: CYBER PRISM (Quantum Crystal Core)
      // ==========================================
      const gemGeo = new THREE.OctahedronGeometry(1.05, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        emissive: palette.secondary,
        emissiveIntensity: 0.5,
        roughness: 0.15,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88,
        flatShading: true
      });
      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      petGroup.add(gemMesh);

      // Inner intense glowing beacon
      const coreGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      petGroup.add(coreMesh);

      // Counter-rotating wireframe icosahedron cage
      const cageGeo = new THREE.IcosahedronGeometry(1.4, 0);
      const cageMat = new THREE.MeshBasicMaterial({
        color: palette.accent,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      const cageMesh = new THREE.Mesh(cageGeo, cageMat);
      petGroup.add(cageMesh);

      // Orbital gimbal rings
      const ring1Geo = new THREE.TorusGeometry(1.7, 0.02, 16, 64);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        emissive: palette.primary,
        emissiveIntensity: 2.0
      });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 4;
      petGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(1.9, 0.018, 16, 64);
      const ring2Mat = new THREE.MeshStandardMaterial({
        color: palette.secondary,
        emissive: palette.secondary,
        emissiveIntensity: 1.8
      });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.y = Math.PI / 3;
      ring2.rotation.x = -Math.PI / 6;
      petGroup.add(ring2);

      // Floating diamond satellites
      const satGroup = new THREE.Group();
      const satCount = 4;
      const sats: THREE.Mesh[] = [];
      for (let i = 0; i < satCount; i++) {
        const satGeo = new THREE.OctahedronGeometry(0.12, 0);
        const satMat = new THREE.MeshStandardMaterial({
          color: palette.accent,
          emissive: palette.accent,
          emissiveIntensity: 1.5,
          flatShading: true
        });
        const sat = new THREE.Mesh(satGeo, satMat);
        satGroup.add(sat);
        sats.push(sat);
      }
      petGroup.add(satGroup);

      updatePet = (time: number, audio: number) => {
        gemMesh.rotation.y = time * 0.7;
        gemMesh.rotation.x = Math.sin(time * 0.5) * 0.2;
        cageMesh.rotation.y = -time * 0.9;
        cageMesh.rotation.z = Math.cos(time * 0.6) * 0.3;

        ring1.rotation.z = time * 0.8;
        ring2.rotation.z = -time * 0.6;

        const pulse = 1 + Math.sin(time * 3) * 0.08 + audio * 0.35;
        gemMesh.scale.set(pulse, pulse, pulse);
        coreMesh.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1);

        sats.forEach((sat, idx) => {
          const angle = time * 1.2 + (idx * Math.PI * 2) / satCount;
          const r = 1.8 + Math.sin(time * 2 + idx) * 0.15;
          sat.position.set(Math.cos(angle) * r, Math.sin(time * 1.5 + idx) * 0.35, Math.sin(angle) * r);
          sat.rotation.x = time * 2;
          sat.rotation.y = time * 2;
        });
      };
    } else if (style === 'kuro') {
      // ==========================================
      // MODEL 2: HYPER CUBE (Tesseract Matrix)
      // ==========================================
      // Inner sleek obsidian cube
      const innerCubeGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
      const innerCubeMat = new THREE.MeshStandardMaterial({
        color: 0x0a0c16,
        roughness: 0.15,
        metalness: 0.9
      });
      const innerCube = new THREE.Mesh(innerCubeGeo, innerCubeMat);
      petGroup.add(innerCube);

      // Glowing inner wireframe
      const coreWireGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
      const coreWireMat = new THREE.MeshBasicMaterial({
        color: palette.secondary,
        wireframe: true
      });
      const coreWire = new THREE.Mesh(coreWireGeo, coreWireMat);
      petGroup.add(coreWire);

      // Outer cyber tesseract cage
      const outerCageGeo = new THREE.BoxGeometry(1.45, 1.45, 1.45);
      const outerCageMat = new THREE.MeshBasicMaterial({
        color: palette.primary,
        wireframe: true,
        transparent: true,
        opacity: 0.7
      });
      const outerCage = new THREE.Mesh(outerCageGeo, outerCageMat);
      petGroup.add(outerCage);

      // 8 Glowing corner beacon spheres at vertices
      const cornerGroup = new THREE.Group();
      const corners: THREE.Mesh[] = [];
      const offsets = [-0.725, 0.725];
      for (const x of offsets) {
        for (const y of offsets) {
          for (const z of offsets) {
            const bGeo = new THREE.SphereGeometry(0.07, 12, 12);
            const bMat = new THREE.MeshStandardMaterial({
              color: palette.secondary,
              emissive: palette.secondary,
              emissiveIntensity: 2.5
            });
            const beacon = new THREE.Mesh(bGeo, bMat);
            beacon.position.set(x, y, z);
            cornerGroup.add(beacon);
            corners.push(beacon);
          }
        }
      }
      outerCage.add(cornerGroup);

      // Matrix Dust particles
      const pCount = 60;
      const pPositions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 2.2;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        color: palette.accent,
        size: 0.045,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const matrixParticles = new THREE.Points(pGeo, pMat);
      petGroup.add(matrixParticles);

      updatePet = (time: number, audio: number) => {
        innerCube.rotation.x = time * 0.5;
        innerCube.rotation.y = time * 0.6;

        coreWire.rotation.x = -time * 0.8;
        coreWire.rotation.y = -time * 0.7;

        outerCage.rotation.x = -time * 0.4;
        outerCage.rotation.y = time * 0.5;
        outerCage.rotation.z = Math.sin(time * 0.3) * 0.3;

        matrixParticles.rotation.y = time * 0.2;

        const pulse = 1 + Math.sin(time * 2.5) * 0.05 + audio * 0.3;
        innerCube.scale.set(pulse, pulse, pulse);
        outerCage.scale.set(pulse, pulse, pulse);
      };
    } else if (style === 'lumi') {
      // ==========================================
      // MODEL 3: PLASMA WISP (Cosmic Nebula Vortex)
      // ==========================================
      // Radiant Star Singularity Core
      const coreGeo = new THREE.SphereGeometry(0.42, 32, 32);
      const coreMat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        emissive: palette.primary,
        emissiveIntensity: 3.0,
        roughness: 0.1
      });
      const starCore = new THREE.Mesh(coreGeo, coreMat);
      petGroup.add(starCore);

      // Swirling Logarithmic Dual-Spiral Galaxy Particle System
      const particleCount = 420;
      const positions = new Float32Array(particleCount * 3);
      const initialTheta = new Float32Array(particleCount);
      const armIds = new Float32Array(particleCount);
      const radii = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const arm = i % 2;
        armIds[i] = arm;
        const r = 0.5 + Math.random() * 1.5;
        radii[i] = r;
        const theta = arm * Math.PI + r * 3.5 + (Math.random() - 0.5) * 0.4;
        initialTheta[i] = theta;

        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4 * (1 - r / 2.0);
        positions[i * 3 + 2] = Math.sin(theta) * r;
      }

      const spiralGeo = new THREE.BufferGeometry();
      spiralGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const spiralMat = new THREE.PointsMaterial({
        color: palette.primary,
        size: 0.055,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const spiralSystem = new THREE.Points(spiralGeo, spiralMat);
      petGroup.add(spiralSystem);

      // Planetary Ethereal Rings
      const ring1Geo = new THREE.TorusGeometry(1.4, 0.02, 16, 64);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 2.2
      });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 3;
      ring1.rotation.y = Math.PI / 6;
      petGroup.add(ring1);

      // 3 Wandering Spirit Fireflies
      const spiritGroup = new THREE.Group();
      const spirits: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const sGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const sMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const spirit = new THREE.Mesh(sGeo, sMat);
        spiritGroup.add(spirit);
        spirits.push(spirit);
      }
      petGroup.add(spiritGroup);

      updatePet = (time: number, audio: number) => {
        starCore.rotation.y = time * 0.8;
        const coreScale = 1 + Math.sin(time * 3) * 0.08 + audio * 0.4;
        starCore.scale.set(coreScale, coreScale, coreScale);

        ring1.rotation.z = time * 0.7;
        ring1.rotation.x = Math.PI / 3 + Math.sin(time * 0.5) * 0.15;

        // Swirl particles
        const posAttr = spiralGeo.getAttribute('position') as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        const speed = 1.0 + audio * 2.0;

        for (let i = 0; i < particleCount; i++) {
          const r = radii[i];
          const curTheta = initialTheta[i] + time * (1.2 / Math.sqrt(r)) * speed;
          posArr[i * 3] = Math.cos(curTheta) * r;
          posArr[i * 3 + 1] = Math.sin(time * 2 + r * 4) * 0.12;
          posArr[i * 3 + 2] = Math.sin(curTheta) * r;
        }
        posAttr.needsUpdate = true;

        // Animate wandering spirits
        spirits.forEach((s, idx) => {
          const t = time * 1.5 + idx * 2.1;
          s.position.set(
            Math.sin(t) * 1.35,
            Math.cos(t * 1.3) * 0.6,
            Math.cos(t * 0.8) * 1.35
          );
        });
      };
    } else if (style === 'rover') {
      // ==========================================
      // MODEL 4: NEXUS BOT (Aero AI Drone)
      // ==========================================
      // Main Aerodynamic Head/Chassis
      const headGeo = new THREE.SphereGeometry(0.85, 32, 32);
      headGeo.scale(1, 0.9, 0.95);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x121727,
        roughness: 0.2,
        metalness: 0.85
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      petGroup.add(headMesh);

      // Curved Dark Visor Faceplate
      const visorGeo = new THREE.SphereGeometry(0.86, 32, 16, 0, Math.PI, 0, Math.PI / 2.2);
      visorGeo.scale(0.85, 0.65, 0.92);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x04060a,
        roughness: 0.05,
        metalness: 0.95
      });
      const visorMesh = new THREE.Mesh(visorGeo, visorMat);
      visorMesh.position.set(0, 0.05, 0.18);
      headMesh.add(visorMesh);

      // Glowing Cyan Digital LED Eye Ring
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, 0.08, 0.88);
      headMesh.add(eyeGroup);

      const eyeRingGeo = new THREE.TorusGeometry(0.2, 0.035, 16, 32);
      const eyeRingMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 3.0
      });
      const eyeRing = new THREE.Mesh(eyeRingGeo, eyeRingMat);
      eyeGroup.add(eyeRing);

      const pupilGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = 0.02;
      eyeGroup.add(pupil);

      // Floating Levitation Thruster Pods (Left & Right)
      const createThruster = (isLeft: boolean) => {
        const podGroup = new THREE.Group();
        podGroup.position.set(isLeft ? -1.35 : 1.35, -0.2, 0);

        const podGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.45, 24);
        const podMat = new THREE.MeshStandardMaterial({
          color: 0x161c2e,
          roughness: 0.25,
          metalness: 0.8
        });
        const pod = new THREE.Mesh(podGeo, podMat);
        podGroup.add(pod);

        // Blue Ion Exhaust Ring
        const jetGeo = new THREE.TorusGeometry(0.19, 0.03, 16, 32);
        const jetMat = new THREE.MeshStandardMaterial({
          color: palette.accent,
          emissive: palette.accent,
          emissiveIntensity: 2.8
        });
        const jet = new THREE.Mesh(jetGeo, jetMat);
        jet.rotation.x = Math.PI / 2;
        jet.position.y = -0.23;
        podGroup.add(jet);

        return podGroup;
      };

      const leftPod = createThruster(true);
      const rightPod = createThruster(false);
      petGroup.add(leftPod);
      petGroup.add(rightPod);

      // Top Holographic Halo Antenna
      const haloGeo = new THREE.TorusGeometry(0.55, 0.018, 16, 48);
      const haloMat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        emissive: palette.primary,
        emissiveIntensity: 2.2
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.95;
      petGroup.add(halo);

      let blinkTime = 0;

      updatePet = (time: number, audio: number) => {
        // Floating head tilt and glance
        headMesh.position.y = Math.sin(time * 2) * 0.06;
        headMesh.rotation.y = Math.sin(time * 0.8) * 0.25;
        headMesh.rotation.x = Math.cos(time * 1.1) * 0.1;

        // Pods independent harmonic hover
        leftPod.position.y = -0.2 + Math.sin(time * 2.2 + 0.3) * 0.08;
        rightPod.position.y = -0.2 + Math.sin(time * 2.2 - 0.3) * 0.08;
        leftPod.rotation.z = Math.sin(time * 1.5) * 0.05;
        rightPod.rotation.z = -Math.sin(time * 1.5) * 0.05;

        halo.rotation.z = time * 0.8;
        halo.position.y = 0.95 + Math.sin(time * 2) * 0.06;

        // Expressive digital eye blink & audio react
        blinkTime += 0.02;
        const isBlinking = Math.sin(blinkTime * 0.8) > 0.97;
        const eyeScaleY = isBlinking ? 0.08 : 1 + audio * 0.5;
        eyeGroup.scale.set(1 + audio * 0.3, eyeScaleY, 1);
      };
    } else if (style === 'sprout') {
      // ==========================================
      // MODEL 5: BIO LOTUS (Sacred Harmony Bloom)
      // ==========================================
      // Central Glowing Seed Core
      const seedGeo = new THREE.SphereGeometry(0.38, 24, 24);
      const seedMat = new THREE.MeshStandardMaterial({
        color: palette.primary,
        emissive: palette.primary,
        emissiveIntensity: 2.6,
        roughness: 0.2
      });
      const seedMesh = new THREE.Mesh(seedGeo, seedMat);
      petGroup.add(seedMesh);

      // Inner & Outer Blooming Petals
      const petalGroup = new THREE.Group();
      petGroup.add(petalGroup);

      const petals: { mesh: THREE.Mesh; baseAngle: number; layer: number }[] = [];

      // Inner Layer: 6 Petals
      for (let i = 0; i < 6; i++) {
        const pAngle = (i * Math.PI * 2) / 6;
        const pGeo = new THREE.ConeGeometry(0.28, 0.9, 16);
        pGeo.translate(0, 0.45, 0);
        const pMat = new THREE.MeshStandardMaterial({
          color: palette.primary,
          emissive: palette.secondary,
          emissiveIntensity: 0.6,
          roughness: 0.2,
          transparent: true,
          opacity: 0.88,
          flatShading: true
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        petalGroup.add(pMesh);
        petals.push({ mesh: pMesh, baseAngle: pAngle, layer: 1 });
      }

      // Outer Layer: 8 Larger Petals
      for (let i = 0; i < 8; i++) {
        const pAngle = (i * Math.PI * 2) / 8 + Math.PI / 8;
        const pGeo = new THREE.ConeGeometry(0.36, 1.25, 16);
        pGeo.translate(0, 0.62, 0);
        const pMat = new THREE.MeshStandardMaterial({
          color: palette.secondary,
          emissive: palette.primary,
          emissiveIntensity: 0.4,
          roughness: 0.3,
          transparent: true,
          opacity: 0.75,
          flatShading: true
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        petalGroup.add(pMesh);
        petals.push({ mesh: pMesh, baseAngle: pAngle, layer: 2 });
      }

      // Orbital Harmonic Vine Ring
      const vineGeo = new THREE.TorusGeometry(1.5, 0.02, 16, 64);
      const vineMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 1.8
      });
      const vineRing = new THREE.Mesh(vineGeo, vineMat);
      vineRing.rotation.x = Math.PI / 3;
      petGroup.add(vineRing);

      // Rising Bio-Luminescent Spores
      const sporeCount = 50;
      const sporePositions = new Float32Array(sporeCount * 3);
      for (let i = 0; i < sporeCount; i++) {
        sporePositions[i * 3] = (Math.random() - 0.5) * 1.8;
        sporePositions[i * 3 + 1] = -1.0 + Math.random() * 2.2;
        sporePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
      }
      const sporeGeo = new THREE.BufferGeometry();
      sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
      const sporeMat = new THREE.PointsMaterial({
        color: palette.accent,
        size: 0.045,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const sporeSystem = new THREE.Points(sporeGeo, sporeMat);
      petGroup.add(sporeSystem);

      updatePet = (time: number, audio: number) => {
        petalGroup.rotation.y = time * 0.4;
        vineRing.rotation.z = -time * 0.5;

        // Breathing bloom expansion
        const bloomCycle = Math.sin(time * 1.8);
        const bloomAngle = 0.55 + bloomCycle * 0.12 + audio * 0.35;

        petals.forEach((p) => {
          const tilt = p.layer === 1 ? bloomAngle : bloomAngle * 1.35;
          p.mesh.position.set(0, -0.2, 0);
          p.mesh.rotation.set(0, 0, 0);
          p.mesh.rotation.y = p.baseAngle;
          p.mesh.rotation.z = -tilt;
        });

        // Drift spores upward
        const sAttr = sporeGeo.getAttribute('position') as THREE.BufferAttribute;
        const sArr = sAttr.array as Float32Array;
        for (let i = 0; i < sporeCount; i++) {
          sArr[i * 3 + 1] += 0.008;
          if (sArr[i * 3 + 1] > 1.4) {
            sArr[i * 3 + 1] = -1.0;
          }
        }
        sAttr.needsUpdate = true;

        const seedPulse = 1 + Math.sin(time * 2.5) * 0.07 + audio * 0.35;
        seedMesh.scale.set(seedPulse, seedPulse, seedPulse);
      };
    }

    // 7. Interactive 3D Drag & Hover Orbit System
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotY += deltaX * 0.015;
        targetRotX += deltaY * 0.015;
        targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Subtle hover tilt towards cursor
        const rect = container.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotY = normX * 0.5;
        targetRotX = normY * 0.35;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseLeave = () => {
      isDragging = false;
      targetRotX = 0;
      targetRotY = 0;
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!interactive || !isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      targetRotY += deltaX * 0.015;
      targetRotX += deltaY * 0.015;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth camera / group rotation damping
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      scene.rotation.y = currentRotY;
      scene.rotation.x = currentRotX;

      // Gentle floating bob
      petGroup.position.y = 0.05 + Math.sin(time * 1.8) * 0.08;

      // Pet-specific procedural logic
      updatePet(time, audioLevel || 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [style, size, interactive, audioLevel]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex items-center justify-center cursor-grab active:cursor-grabbing ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};
