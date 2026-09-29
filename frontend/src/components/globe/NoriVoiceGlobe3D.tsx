import React, { useEffect, useRef } from 'react';
import { NoriState } from '../../types';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: string;
  size: number;
  speed: number;
  phase: number;
}

interface NoriVoiceGlobe3DProps {
  state?: NoriState;
  size?: number;
  interactive?: boolean;
  isCollaborating?: boolean;
  peerCount?: number;
  audioLevel?: number;
  onClick?: () => void;
  className?: string;
}

export const NoriVoiceGlobe3D: React.FC<NoriVoiceGlobe3DProps> = ({
  state = 'idle',
  size = 320,
  interactive = true,
  isCollaborating = false,
  peerCount = 3,
  audioLevel = 0,
  onClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const radius = size * 0.38;
    const totalParticles = 2200;
    const particles: Particle[] = [];

    // Palette inspired by Image 3: Cyan, Electric Indigo, Deep Purple, Vivid Magenta, Amber Core
    const colorPalette = [
      '#22d3ee', // Cyan
      '#38bdf8', // Light blue
      '#6366f1', // Indigo
      '#818cf8', // Soft purple
      '#a855f7', // Violet
      '#c084fc', // Lilac
      '#ec4899', // Pink magenta
      '#f43f5e', // Rose
      '#fb923c', // Amber
      '#f97316'  // Orange
    ];

    // Initialize Fibonacci sphere distribution
    for (let i = 0; i < totalParticles; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / totalParticles);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);

      // Color assigned based on latitude for iridescent gradient (amber bottom, magenta mid, cyan/blue top)
      let colorIdx = Math.floor(((y + 1) / 2) * (colorPalette.length - 1));
      colorIdx = Math.max(0, Math.min(colorPalette.length - 1, colorIdx));

      particles.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseX: x * radius,
        baseY: y * radius,
        baseZ: z * radius,
        color: colorPalette[colorIdx],
        size: Math.random() * 1.8 + 0.8,
        speed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2
      });
    }

    let rotX = 0.2;
    let rotY = 0;
    let rotZ = 0;
    let time = 0;

    // Optional peer orb nodes for collaboration mode
    const peerOrbs = [
      { color: '#22d3ee', angle: 0, radiusOffset: 0.85, name: 'Vision' },
      { color: '#fb923c', angle: (Math.PI * 2) / 3, radiusOffset: 0.85, name: 'Hardware' },
      { color: '#c084fc', angle: (Math.PI * 4) / 3, radiusOffset: 0.85, name: 'Audio' }
    ];

    const render = () => {
      // Gentle, serene time progression
      const isSleeping = state === 'sleeping' || state === 'idle';
      const timeStep = isSleeping ? 0.012 : state === 'thinking' ? 0.04 : 0.022;
      time += timeStep;
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;

      // Dynamic voice audio resonance (silky smooth harmonic flow)
      const voiceResonance = Math.max(audioLevel || 0, state === 'listening' ? 0.35 : 0);
      let speedMultiplier = 1.0;
      let waveAmplitudeRatio = 0.06;
      let glowColor = 'rgba(99, 102, 241, 0.22)';

      if (isSleeping) {
        speedMultiplier = 0.6;
        waveAmplitudeRatio = 0.035 + Math.sin(time * 0.8) * 0.015; // Peaceful deep breathing
        glowColor = 'rgba(250, 84, 56, 0.18)';
      } else if (state === 'listening') {
        speedMultiplier = 1.4 + voiceResonance * 1.2;
        waveAmplitudeRatio = 0.08 + voiceResonance * 0.08;
        glowColor = 'rgba(34, 211, 238, 0.45)';
      } else if (state === 'thinking') {
        speedMultiplier = 2.2;
        waveAmplitudeRatio = 0.10;
        glowColor = 'rgba(192, 132, 252, 0.45)';
      } else if (state === 'speaking') {
        speedMultiplier = 1.3 + Math.sin(time * 4) * 0.3;
        waveAmplitudeRatio = 0.07 + Math.sin(time * 4) * 0.04;
        glowColor = 'rgba(250, 84, 56, 0.4)';
      } else if (state === 'paused') {
        speedMultiplier = 0.3;
        waveAmplitudeRatio = 0.02;
        glowColor = 'rgba(244, 63, 94, 0.12)';
      }

      rotY += 0.005 * speedMultiplier;
      rotX += 0.002 * speedMultiplier;

      // Soft ambient back-glow
      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.2,
        centerX,
        centerY,
        radius * 1.4
      );
      radialGlow.addColorStop(0, glowColor);
      radialGlow.addColorStop(0.7, 'rgba(0,0,0,0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, size, size);

      // Render Multi-Peer collaborating orbs if in collaborative mode
      if (isCollaborating) {
        peerOrbs.forEach((peer) => {
          const orbitAngle = time * 0.6 + peer.angle;
          const orbDist = radius * 1.15;
          const pX = centerX + Math.cos(orbitAngle) * orbDist;
          const pY = centerY + Math.sin(orbitAngle * 0.7) * (orbDist * 0.45);

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(pX, pY);
          ctx.strokeStyle = `${peer.color}33`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(pX, pY, 6, 0, Math.PI * 2);
          ctx.fillStyle = peer.color;
          ctx.shadowColor = peer.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Sort particles by depth Z for realistic 3D perspective
      const projectedParticles: {
        x2d: number;
        y2d: number;
        z2d: number;
        size: number;
        alpha: number;
        color: string;
      }[] = [];

      const waveAmplitude = radius * waveAmplitudeRatio;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const nx = p.baseX / radius;
        const ny = p.baseY / radius;
        const nz = p.baseZ / radius;

        // Smooth low-frequency spherical harmonics (no pinching or violent tearing)
        const wave =
          Math.sin(time * 1.5 + nx * 1.8 + ny * 1.8) *
          Math.cos(time * 1.2 + nz * 1.8) *
          waveAmplitude;

        const currentRadius = radius + wave;
        const px = nx * currentRadius;
        const py = ny * currentRadius;
        const pz = nz * currentRadius;

        // 3D Y-axis rotation
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        let x1 = px * cosY + pz * sinY;
        let y1 = py;
        let z1 = -px * sinY + pz * cosY;

        // 3D X-axis rotation
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;

        // Perspective projection
        const fov = 400;
        const scale = fov / (fov + z2);
        const x2d = centerX + x2 * scale;
        const y2d = centerY + y2 * scale;

        // Alpha based on depth Z
        const alpha = Math.max(0.2, Math.min(0.95, (z2 + radius * 1.2) / (radius * 2.4)));

        projectedParticles.push({
          x2d,
          y2d,
          z2d: z2,
          size: Math.max(0.6, p.size * scale),
          alpha,
          color: p.color
        });
      }

      // Sort back-to-front
      projectedParticles.sort((a, b) => a.z2d - b.z2d);

      // Draw particles with glowing points of light
      for (let i = 0; i < projectedParticles.length; i++) {
        const p = projectedParticles[i];
        ctx.beginPath();
        ctx.arc(p.x2d, p.y2d, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [size, state, isCollaborating, audioLevel]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};
