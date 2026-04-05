import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Splat } from '@react-three/drei';

export function SplatHologram({ splatUrl, position = [0, 0, 0], scale = 2 }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle holographic rotation
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 
        The <Splat /> component natively parses .ply files and 
        renders them incredibly fast using Gaussian Splatting!
        Gaussian Splats look fluffy and emissive inherently, 
        making them perfect holograms.
      */}
      <Splat src={splatUrl} scale={scale} alphaTest={0.1} />
    </group>
  );
}
