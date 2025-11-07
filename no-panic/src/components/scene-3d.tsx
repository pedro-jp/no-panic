'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function Model({
  scrollDepth,
  color,
  model,
  initialZ = -100, // posição inicial padrão
  initialY,
  x,
  y,
  z,
}: {
  scrollDepth: number;
  color: string;
  model: string;
  initialZ?: number;
  initialY?: number;
  x: number;
  y: number;
  z: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(model);

  // Aplica material customizado
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.material = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.1,
        metalness: 0.4,
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
      meshRef.current.position.x = x;
      meshRef.current.rotation.y += y;
      meshRef.current.position.z = z;
    }
  });

  return (
    <group ref={meshRef} scale={[1, 1, 1]}>
      <primitive object={scene.clone()} />
    </group>
  );
}

export function Scene3D({ section }: { section: number }) {
  const [scroll, setScroll] = useState(0);
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [modelPosition, setModelPosition] = useState({
    x: 400,
    y: 0.001,
    z: -250,
  });

  // useEffect(() => {
  //   switch (section) {
  //     case 4:
  //       setModelPosition((prev) => ({ x: 500, y: prev.y, z: -250 }));
  //       break;

  //     default:
  //       setModelPosition({ x: 400, y: 0.001, z: -250 });

  //       break;
  //   }
  // }, [section]);

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
    <>
      <Canvas
        style={{ position: 'absolute', height: '100%' }}
        camera={{ position: [-255, 66, 196], fov: 70 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <CameraController section={section} />
        <CameraDebugger onUpdate={setCameraPos} />{' '}
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.5}
          color='white'
        />
        <Environment
          files='https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr'
          background={false}
        />
        {/* Primeiro cérebro (normal) */}
        <Model
          scrollDepth={scroll}
          color='#ff69b4'
          model='/3d/brain.glb'
          initialZ={0}
          initialY={0}
          x={modelPosition.x}
          y={modelPosition.y}
          z={modelPosition.z}
        />
        <Model
          scrollDepth={scroll}
          color='#ff69b4'
          model='/3d/brain2.glb'
          initialZ={0}
          initialY={0}
          x={modelPosition.x - 100}
          y={modelPosition.y}
          z={modelPosition.z - 400}
        />
        {/* Segundo mais ao fundo */}
        {/* <Model
          scrollDepth={scroll}
          color='transparent'
          model='/3d/brain2.glb'
          initialZ={-50}
        /> */}
        {/* <Model
        scrollDepth={scroll}
        color='red'
        model='/3d/brain.glb'
        initialZ={-270}
        initialY={-200}
      /> */}
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
      <div
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '8px',
          zIndex: 9999,
        }}
      >
        <div>x: {cameraPos[0].toFixed(2)}</div>
        <div>y: {cameraPos[1].toFixed(2)}</div>
        <div>z: {cameraPos[2].toFixed(2)}</div>
      </div>
    </>
  );
}

function CameraController({ section }: { section: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 5, 20)); // posição alvo da câmera

  useEffect(() => {
    switch (section) {
      case 1:
        target.current.set(-255, 66, 196);
        break;
      case 2:
        target.current.set(-259.66, 133.3, 150.35);
        break;
      case 3:
        target.current.set(-0.17, 0.1, 0.28);
        break;
      case 4:
        target.current.set(-0.09, 0.14, 0.3);
        break;
    }
  }, [section]);

  // Interpola suavemente a posição da câmera a cada frame
  useFrame(() => {
    camera.position.lerp(target.current, 0.05); // 0.05 = suavidade (0.1 é rápido, 0.02 é bem lento)
    camera.lookAt(0, 0, 0); // garante que a câmera continue apontando pro centro
  });

  return null;
}

function CameraDebugger({
  onUpdate,
}: {
  onUpdate: (pos: [number, number, number]) => void;
}) {
  const { camera } = useThree();

  useFrame(() => {
    onUpdate([camera.position.x, camera.position.y, camera.position.z]);
  });

  return null;
}

useGLTF.preload('/3d/brain.glb');
useGLTF.preload('/3d/brain2.glb');
