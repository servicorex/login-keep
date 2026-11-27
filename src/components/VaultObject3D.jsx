import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import { Shield } from 'lucide-react';

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function SecurityVaultMesh({ reducedMotion }) {
  const outerRingRef = useRef();
  const innerRingRef = useRef();
  const coreRef = useRef();

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y += delta * 0.35;
      outerRingRef.current.rotation.x = Math.sin(t * 0.6) * 0.15;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.25;
      innerRingRef.current.rotation.x = Math.cos(t * 0.5) * 0.2;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.2;
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.6}
      rotationIntensity={reducedMotion ? 0 : 0.2}
      floatIntensity={reducedMotion ? 0 : 0.35}
    >
      <group scale={0.95}>
        {/* Outer brushed metallic ring */}
        <mesh ref={outerRingRef} castShadow receiveShadow>
          <torusGeometry args={[1.15, 0.14, 24, 64]} />
          <meshStandardMaterial
            color="#e4e4e7"
            metalness={0.85}
            roughness={0.22}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Inner white ceramic ring */}
        <mesh ref={innerRingRef} rotation={[Math.PI / 3, 0, 0]} castShadow>
          <torusGeometry args={[0.82, 0.08, 20, 48]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.15}
            roughness={0.3}
          />
        </mesh>

        {/* Translucent glass core */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.48, 1]} />
          <meshPhysicalMaterial
            color="#eef0ff"
            transmission={0.78}
            opacity={1}
            transparent
            roughness={0.1}
            ior={1.45}
            thickness={0.6}
          />
        </mesh>

        {/* Subtle electric indigo core light */}
        <pointLight color="#6258E8" intensity={2.4} distance={3.5} />
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#6258E8" transparent opacity={0.85} />
        </mesh>
      </group>
    </Float>
  );
}

function StaticVaultFallback({ sizeClass }) {
  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-2xl bg-gradient-to-br from-white to-[#F0EFFB] border border-[#E8E8E5] shadow-sm`}
      aria-hidden="true"
    >
      <div className="w-11 h-11 rounded-xl bg-[#6258E8]/10 border border-[#6258E8]/20 flex items-center justify-center text-[#6258E8]">
        <Shield className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function VaultObject3D({ size = 'sm', className = '' }) {
  const [canRender3D, setCanRender3D] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', onChange);

    const isMobile = window.innerWidth < 640;
    setCanRender3D(!isMobile && isWebGLAvailable());

    return () => motionQuery.removeEventListener('change', onChange);
  }, []);

  const sizeClass =
    size === 'md'
      ? 'w-32 h-32 sm:w-36 sm:h-36'
      : 'w-16 h-16 sm:w-20 sm:h-20';

  const fallback = <StaticVaultFallback sizeClass={sizeClass} />;

  if (!canRender3D) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={`${sizeClass} ${className}`} aria-hidden="true">
      <WebGLErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 3.6], fov: 40 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          >
            <ambientLight intensity={0.75} />
            <directionalLight position={[4, 6, 4]} intensity={1.1} color="#ffffff" />
            <directionalLight position={[-4, -3, 2]} intensity={0.4} color="#c7c3ff" />
            <SecurityVaultMesh reducedMotion={reducedMotion} />
            <ContactShadows
              position={[0, -1.35, 0]}
              opacity={0.22}
              scale={4}
              blur={2.4}
              far={2.5}
              color="#202124"
            />
            <Environment preset="studio" environmentIntensity={0.65} />
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>
    </div>
  );
}

