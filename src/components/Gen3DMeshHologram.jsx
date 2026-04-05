import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const holographicMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color('#0ff') },
    uGlowColor: { value: new THREE.Color('#b026ff') }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uGlowColor;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Fresnel Rim glow effect base on 3D normals
      vec3 viewDirection = normalize(-vPosition);
      float fresnel = dot(viewDirection, vNormal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 2.0);
      
      // Holistic Scanline Glitch
      float scanline = sin(vPosition.y * 50.0 - uTime * 5.0) * 0.1;
      float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
      
      vec3 color = mix(uBaseColor, uGlowColor, fresnel + pulse * 0.3);
      color += scanline;
      color += fresnel * 2.0; // intense edges
      
      gl_FragColor = vec4(color, 0.7 + fresnel * 0.3);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

export function Gen3DMeshHologram({ modelUrl }) {
  const meshRef = useRef();
  
  // NOTE: This requires the Python script to have finished generating the .obj or .glb
  // We will assume it outputs standard .obj which we can load, or useGLTF if we converted it.
  // For the sake of this prototype, if it fails, it will suspend.
  
  // If we assume the python script exports .obj, we should use useLoader(OBJLoader)
  // For simplicity and React-Three-Fiber best practices, let's just make it a cool rotating wireframe
  // fallback if the model isn't ready, or load the TripoSR object if it is.
  let scene;
  try {
    const gltf = useGLTF(modelUrl);
    scene = gltf.scene;
    
    // Apply our holographic shader to all meshes in the AI generated object
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = holographicMaterial;
      }
    });
  } catch (e) {
    // Graceful absolute fallback if Python hasn't finished yet
    scene = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 2),
      holographicMaterial
    );
  }

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      
      // Update shader uniforms
      scene.traverse((child) => {
        if (child.isMesh && child.material.uniforms) {
          child.material.uniforms.uTime.value = state.clock.getElapsedTime();
        }
      });
    }
  });

  return (
    <group ref={meshRef} position={[0, -1, 0]}>
      {/* 
         TripoSR outputs can be oddly scaled. 
         We scale it up so it matches the portal size 
      */}
      <primitive object={scene} scale={[3, 3, 3]} />
    </group>
  );
}

// Preload the expected model paths so Suspense doesn't hang forever
useGLTF.preload('/assets/base_mesh.glb');
