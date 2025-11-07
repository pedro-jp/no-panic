'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function Model({
  scrollDepth,
  color,
  model,
  initialZ = -100, // posição inicial padrão
  initialY,
}: {
  scrollDepth: number;
  color: string;
  model: string;
  initialZ?: number;
  initialY?: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(model);

  // Aplica material customizado
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.material = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.1,
        metalness: 0.3,
        reflectivity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        // emissive: new THREE.Color(color),
        // emissiveIntensity: 0.3,
      });
    }
  });

  // Anima a rotação e a profundidade com base no scroll
  useFrame(() => {
    if (meshRef.current) {
      //   meshRef.current.rotation.y += 0.002;
      meshRef.current.position.z = initialZ + scrollDepth * 150;
    }
  });

  return (
    <group ref={meshRef} scale={[0.1, 0.1, 0.1]}>
      <primitive object={scene.clone()} />
    </group>
  );
}

export function Scene3D() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const progress =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setScroll(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, height: '100%' }}
      camera={{ position: [0, 5, 25], fov: 50 }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 10, 10]} intensity={2.5} color='white' />

      {/* <Environment
        files='https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr'
        background={false}
      />*/}

      {/* Primeiro cérebro (normal) */}
      <Model
        scrollDepth={scroll}
        color='#ff69b4'
        model='/3d/brain.glb'
        initialZ={-100}
        initialY={0}
      />

      {/* Segundo mais ao fundo */}
      <Model
        scrollDepth={scroll}
        color='transparent'
        model='/3d/brain2.glb'
        initialZ={-270}
      />

      {/* <Model
        scrollDepth={scroll}
        color='red'
        model='/3d/brain.glb'
        initialZ={-270}
        initialY={-200}
      /> */}

      <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} />
    </Canvas>
  );
}

useGLTF.preload('/3d/brain.glb');
useGLTF.preload('/3d/brain2.glb');
