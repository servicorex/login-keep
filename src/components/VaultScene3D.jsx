import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import VaultFallback from './VaultFallback';

/**
 * Checks whether the browser supports WebGL cleanly.
 */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * ErrorBoundary around the R3F Canvas so any GPU/WebGL runtime failure degrades gracefully.
 */
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <VaultFallback compact={this.props.compact} />;
    }
    return this.props.children;
  }
}

/**
 * Glowing purple keyhole geometry at the center of the vault.
 */
function GlowingKeyhole({ reducedMotion }) {
  const keyholeRef = useRef();
  const glowRef = useRef();

  const keyholeShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Upper circular part of keyhole
    const r = 0.22;
    shape.absarc(0, 0.14, r, Math.PI * 0.72, Math.PI * 2.28, false);
    // Lower tapered slot
    shape.lineTo(0.14, -0.34);
    shape.lineTo(-0.14, -0.34);
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    }),
    []
  );

  useFrame(({ clock }) => {
    if (reducedMotion || !glowRef.current) return;
    const t = clock.getElapsedTime();
    glowRef.current.intensity = 2.4 + Math.sin(t * 2.2) * 0.6;
  });

  return (
    <group ref={keyholeRef} position={[0, 0, 0.36]}>
      {/* Dark recessed backing plate */}
      <mesh position={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.58, 0.58, 0.08, 32]} />
        <meshStandardMaterial color="#070710" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Keyhole inner emissive core */}
      <mesh position={[0, 0.02, -0.02]}>
        <extrudeGeometry args={[keyholeShape, extrudeSettings]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#9333ea"
          emissiveIntensity={2.8}
          metalness={0.3}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* Keyhole rim */}
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[0.58, 0.035, 16, 48]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#7c3aed"
          emissiveIntensity={1.2}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      <pointLight ref={glowRef} position={[0, 0, 0.5]} color="#a855f7" intensity={2.6} distance={4.5} decay={2} />
    </group>
  );
}

/**
 * Floating translucent glass credential card orbiting the vault.
 */
function CredentialCard({ position, rotation, accentColor = '#a855f7', speed = 1, phase = 0, reducedMotion }) {
  const cardRef = useRef();

  useFrame(({ clock }) => {
    if (reducedMotion || !cardRef.current) return;
    const t = clock.getElapsedTime() * speed + phase;
    cardRef.current.position.y = position[1] + Math.sin(t) * 0.14;
    cardRef.current.rotation.z = rotation[2] + Math.sin(t * 0.7) * 0.04;
  });

  return (
    <group ref={cardRef} position={position} rotation={rotation}>
      {/* Translucent glass body */}
      <mesh>
        <boxGeometry args={[1.45, 0.86, 0.04]} />
        <meshPhysicalMaterial
          color="#131126"
          transparent
          opacity={0.72}
          roughness={0.18}
          metalness={0.35}
          clearcoat={0.9}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Subtle glowing border frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.47, 0.88, 0.02]} />
        <meshBasicMaterial color={accentColor} wireframe transparent opacity={0.35} />
      </mesh>

      {/* Icon badge */}
      <mesh position={[-0.46, 0.16, 0.03]}>
        <boxGeometry args={[0.24, 0.24, 0.02]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.4}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Masked title bar */}
      <mesh position={[0.12, 0.2, 0.03]}>
        <boxGeometry args={[0.68, 0.07, 0.015]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#94a3b8" emissiveIntensity={0.3} />
      </mesh>

      {/* Masked subtitle bar */}
      <mesh position={[0.04, 0.08, 0.03]}>
        <boxGeometry args={[0.52, 0.045, 0.015]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Password dots row */}
      {[-0.48, -0.34, -0.2, -0.06, 0.08, 0.22, 0.36].map((dotX, idx) => (
        <mesh key={idx} position={[dotX, -0.18, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.015, 12]} />
          <meshStandardMaterial
            color="#c084fc"
            emissive="#a855f7"
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Central futuristic metallic vault with rotating circular mechanisms,
 * radial locking bolts, and orbital light trails.
 */
function VaultAssembly({ variant, reducedMotion }) {
  const rootRef = useRef();
  const outerRingRef = useRef();
  const middleRingRef = useRef();
  const innerGearRef = useRef();
  const gimbalRef = useRef();
  const { pointer } = useThree();
  const scrollProgress = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollProgress.current = Math.min(window.scrollY / maxScroll, 1);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const lockingPins = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      return {
        x: Math.cos(angle) * 1.18,
        y: Math.sin(angle) * 1.18,
        angle,
      };
    });
  }, []);

  useFrame(({ clock }, delta) => {
    if (!rootRef.current) return;
    const clampedDelta = Math.min(delta, 0.05);

    // Smooth mouse-based parallax + scroll-responsive movement
    const targetRotY = (variant === 'auth' ? 0.22 : -0.14) + pointer.x * 0.28 + scrollProgress.current * 0.35;
    const targetRotX = pointer.y * -0.18 + scrollProgress.current * 0.15;

    rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, targetRotY, 0.05);
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetRotX, 0.05);

    if (reducedMotion) return;

    const t = clock.getElapsedTime();
    if (outerRingRef.current) outerRingRef.current.rotation.z += clampedDelta * 0.16;
    if (middleRingRef.current) middleRingRef.current.rotation.z -= clampedDelta * 0.28;
    if (innerGearRef.current) innerGearRef.current.rotation.z += clampedDelta * 0.42;
    if (gimbalRef.current) {
      gimbalRef.current.rotation.x = Math.sin(t * 0.4) * 0.35 + 0.55;
      gimbalRef.current.rotation.y += clampedDelta * 0.22;
    }
  });

  const scale = variant === 'auth' ? 0.92 : 1.02;

  return (
    <group ref={rootRef} scale={scale}>
      <Float
        speed={reducedMotion ? 0 : 1.8}
        rotationIntensity={reducedMotion ? 0 : 0.15}
        floatIntensity={reducedMotion ? 0 : 0.35}
      >
        {/* Main Vault Body */}
        <group>
          {/* Heavy metallic vault chassis */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.48, 1.56, 0.58, 36]} />
            <meshStandardMaterial color="#10111d" metalness={0.88} roughness={0.28} />
          </mesh>

          {/* Front brushed steel face */}
          <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.38, 1.38, 0.08, 48]} />
            <meshStandardMaterial color="#18192b" metalness={0.82} roughness={0.22} />
          </mesh>

          {/* Outer rotating mechanical ring with locking notches */}
          <group ref={outerRingRef} position={[0, 0, 0.31]}>
            <mesh>
              <torusGeometry args={[1.34, 0.06, 16, 64]} />
              <meshStandardMaterial color="#272942" metalness={0.92} roughness={0.18} />
            </mesh>
            {lockingPins.map((pin, i) => (
              <mesh key={i} position={[pin.x, pin.y, 0.02]} rotation={[0, 0, pin.angle]}>
                <boxGeometry args={[0.14, 0.06, 0.06]} />
                <meshStandardMaterial
                  color={i % 3 === 0 ? '#8b5cf6' : '#3b82f6'}
                  emissive={i % 3 === 0 ? '#7c3aed' : '#2563eb'}
                  emissiveIntensity={i % 3 === 0 ? 1.1 : 0.6}
                  metalness={0.7}
                  roughness={0.25}
                />
              </mesh>
            ))}
          </group>

          {/* Middle counter-rotating precision ring */}
          <group ref={middleRingRef} position={[0, 0, 0.33]}>
            <mesh>
              <torusGeometry args={[0.96, 0.032, 16, 48]} />
              <meshStandardMaterial
                color="#6366f1"
                emissive="#4f46e5"
                emissiveIntensity={0.9}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
            {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((a, idx) => (
              <mesh key={idx} position={[Math.cos(a) * 0.96, Math.sin(a) * 0.96, 0.02]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.18, 0.05, 0.05]} />
                <meshStandardMaterial color="#c4b5fd" metalness={0.9} roughness={0.15} />
              </mesh>
            ))}
          </group>

          {/* Inner rotating dial */}
          <group ref={innerGearRef} position={[0, 0, 0.34]}>
            <mesh>
              <torusGeometry args={[0.74, 0.02, 12, 48]} />
              <meshStandardMaterial
                color="#a855f7"
                emissive="#9333ea"
                emissiveIntensity={1.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          </group>

          {/* Center Glowing Purple Keyhole */}
          <GlowingKeyhole reducedMotion={reducedMotion} />
        </group>

        {/* Orbital Gimbal Light Trail */}
        <group ref={gimbalRef}>
          <mesh>
            <torusGeometry args={[2.05, 0.012, 12, 96]} />
            <meshBasicMaterial color="#7c3aed" transparent opacity={0.45} />
          </mesh>
          <mesh position={[2.05, 0, 0]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial color="#c084fc" />
          </mesh>
          <mesh position={[-2.05, 0, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color="#60a5fa" />
          </mesh>
        </group>

        {/* Floating Translucent Credential Cards */}
        <CredentialCard
          position={[2.05, 0.85, 0.55]}
          rotation={[0.08, -0.35, -0.08]}
          accentColor="#a855f7"
          speed={1.1}
          phase={0}
          reducedMotion={reducedMotion}
        />
        <CredentialCard
          position={[-2.0, -0.75, 0.65]}
          rotation={[-0.06, 0.38, 0.06]}
          accentColor="#3b82f6"
          speed={0.95}
          phase={2.1}
          reducedMotion={reducedMotion}
        />
        <CredentialCard
          position={[1.75, -1.15, -0.35]}
          rotation={[0.12, -0.25, 0.05]}
          accentColor="#8b5cf6"
          speed={1.25}
          phase={4.2}
          reducedMotion={reducedMotion}
        />
      </Float>

      {/* Atmospheric Particle Field */}
      <Sparkles
        count={reducedMotion ? 20 : 55}
        scale={[6.5, 5.2, 4.5]}
        size={2.2}
        speed={reducedMotion ? 0 : 0.35}
        opacity={0.65}
        color="#c084fc"
      />
      <Sparkles
        count={reducedMotion ? 10 : 25}
        scale={[5.5, 4.5, 4]}
        size={1.8}
        speed={reducedMotion ? 0 : 0.25}
        opacity={0.45}
        color="#60a5fa"
      />
    </group>
  );
}

/**
 * Main interactive 3D Vault Scene component.
 * Automatically checks WebGL support, respects prefers-reduced-motion, and handles context loss.
 */
export default function VaultScene3D({ variant = 'hero', compact = false }) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const onChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  if (!webglSupported) {
    return <VaultFallback compact={compact} />;
  }

  return (
    <WebGLErrorBoundary compact={compact}>
      <div
        className={`relative w-full h-full ${
          compact ? 'min-h-[220px]' : 'min-h-[380px] sm:min-h-[500px] lg:min-h-[580px]'
        }`}
      >
        {/* Soft atmospheric backdrop glow behind the 3D canvas */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 sm:w-[420px] sm:h-[420px] rounded-full bg-purple-600/20 blur-[110px]" />
          <div className="absolute w-56 h-56 rounded-full bg-blue-600/15 blur-[90px] -translate-x-16 translate-y-12" />
        </div>

        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, variant === 'auth' ? 6.4 : 6.0], fov: 44 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setWebglSupported(false);
            });
          }}
        >
          {/* Cinematic Lighting */}
          <ambientLight intensity={0.45} />
          <directionalLight position={[5, 6, 5]} intensity={1.6} color="#e2e8f0" />
          <directionalLight position={[-5, -3, 3]} intensity={1.1} color="#3b82f6" />
          <pointLight position={[2.5, 2.5, 3.5]} intensity={2.2} color="#a855f7" distance={10} />
          <pointLight position={[-3, -2, -2]} intensity={1.4} color="#6366f1" distance={9} />

          <VaultAssembly variant={variant} reducedMotion={reducedMotion} />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}

