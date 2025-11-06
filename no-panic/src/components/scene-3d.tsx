'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Sphere,
  Box,
  Torus,
  MeshDistortMaterial,
  Environment,
} from '@react-three/drei';
import type * as THREE from 'three';

function FloatingShape({
  position,
  geometry,
  color,
  speed = 1,
}: {
  position: [number, number, number];
  geometry: 'sphere' | 'box' | 'torus';
  color: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
    }
  });

  const GeometryComponent = useMemo(() => {
    switch (geometry) {
      case 'sphere':
        return (
          <Sphere args={[1, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial
              color={color}
              speed={2}
              distort={0.3}
              radius={1}
            />
          </Sphere>
        );
      case 'box':
        return (
          <Box args={[1.5, 1.5, 1.5]} ref={meshRef}>
            <meshStandardMaterial
              color={color}
              metalness={0.5}
              roughness={0.2}
            />
          </Box>
        );
      case 'torus':
        return (
          <Torus args={[1, 0.4, 16, 100]} ref={meshRef}>
            <meshStandardMaterial
              color={color}
              metalness={0.7}
              roughness={0.3}
            />
          </Torus>
        );
    }
  }, [geometry, color]);

  return <group position={position}>{GeometryComponent}</group>;
}

export function Scene3D({ scrollProgress }: { scrollProgress: number }) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color='#6366f1' />

      <Environment preset='city' />

      <FloatingShape
        position={[-3, 2, 0]}
        geometry='sphere'
        color='#6366f1'
        speed={0.8}
      />
      <FloatingShape
        position={[3, -1, -2]}
        geometry='box'
        color='#8b5cf6'
        speed={1.2}
      />
      <FloatingShape
        position={[0, -2, -1]}
        geometry='torus'
        color='#a78bfa'
        speed={1}
      />
      <FloatingShape
        position={[-2, -3, -3]}
        geometry='sphere'
        color='#c084fc'
        speed={0.6}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
