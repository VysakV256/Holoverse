import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uImage0;
  uniform sampler2D uImage1;
  uniform sampler2D uImage2;
  uniform sampler2D uDepth;
  uniform vec2 uMouse;
  uniform float uTime;
  
  varying vec2 vUv;
  
  // Hash function for noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float depth = texture2D(uDepth, vUv).r;
    
    // 1. Calculate Parallax displacement (make it more responsive)
    vec2 parallaxOffset = uMouse * depth * 0.08;
    vec2 displacedUv = vUv + parallaxOffset;
    
    // 2. Morphing Guises Logic (Smoother transitions with cubic easing)
    float cycle = fract(uTime * 0.1); // slower overall cycle 0 -> 1
    
    // Smooth Noise for organic shimmering
    float noise = hash(displacedUv * 15.0 + uTime * 2.0);
    float glow = sin(uTime * 4.0 + displacedUv.y * 12.0) * 0.5 + 0.5;
    
    vec4 c0 = texture2D(uImage0, displacedUv);
    vec4 c1 = texture2D(uImage1, displacedUv);
    vec4 c2 = texture2D(uImage2, displacedUv);
    
    vec4 baseColor;
    
    // Blend logic: Extended overlapping pulses for buttery smooth morphs
    float mixFactor1 = smoothstep(0.15, 0.45, cycle) - smoothstep(0.45, 0.65, cycle);
    float mixFactor2 = smoothstep(0.55, 0.85, cycle) - smoothstep(0.85, 1.0, cycle);
    
    // Ethereal Shimmering only on the edges of the character (using depth)
    float shimmerMask = step(0.85, noise + glow * 0.5) * depth;
    
    baseColor = c0;
    if (mixFactor1 > 0.0) {
      baseColor = mix(c0, c1, mixFactor1 + (shimmerMask * 0.4));
    } else if (mixFactor2 > 0.0) {
      baseColor = mix(c0, c2, mixFactor2 + (shimmerMask * 0.4));
    }
    
    // 3. Holistic Hologram Effects
    
    // Premium CRT Scanline Overlay
    float scanline = sin(vUv.y * 400.0 - uTime * 20.0) * 0.04;
    float scanlineGlow = sin(vUv.y * 50.0 + uTime * 2.0) * 0.05;
    
    // Premium Chromatic Aberration (offsets scale directly with mouse movement parallax to feel 3D)
    float aberrationAmount = 0.005 + (length(uMouse) * 0.015) * depth;
    float r = texture2D(uImage0, displacedUv + vec2(aberrationAmount, 0.0)).r;
    float b = texture2D(uImage0, displacedUv - vec2(aberrationAmount, 0.0)).b;
    
    // Mix the base color with the chromatic aberration dynamically
    vec3 holoColor = mix(baseColor.rgb, vec3(r, baseColor.g, b), 0.5);
    
    // Dynamic Holographic Core Glow (pushes the center/bright parts to neon blues/purples)
    float coreLight = pow(depth, 1.5) * 0.3;
    holoColor += vec3(0.0, 0.7, 1.0) * coreLight * (sin(uTime * 3.0) * 0.5 + 0.5);
    
    // Edge Rim Lighting (highlights the silhouette)
    float rim = smoothstep(0.1, 0.4, depth) - smoothstep(0.4, 0.8, depth);
    holoColor += vec3(0.7, 0.2, 1.0) * rim * 0.4;
    
    // Blend in scanlines
    holoColor += scanline + scanlineGlow;
    
    // Alpha discard for completely black background with smooth falloff
    float alpha = baseColor.a;
    if (length(baseColor.rgb) < 0.05) {
      alpha = 0.0;
    } else {
      alpha = 0.85 + depth * 0.15 + (shimmerMask * 0.2); 
    }
    
    gl_FragColor = vec4(holoColor, alpha);
  }
`;

export function Hologram({ imageUrls, depthUrl }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  // imageUrls is an array of 3 image paths
  const [tex0, tex1, tex2, depthTex] = useTexture([
    imageUrls[0], 
    imageUrls[1], 
    imageUrls[2], 
    depthUrl
  ]);

  const uniforms = useMemo(
    () => ({
      uImage0: { value: tex0 },
      uImage1: { value: tex1 },
      uImage2: { value: tex2 },
      uDepth: { value: depthTex },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
    }),
    [tex0, tex1, tex2, depthTex]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      const targetX = (state.mouse.x * Math.PI) / 4;
      const targetY = (state.mouse.y * Math.PI) / 4;
      
      materialRef.current.uniforms.uMouse.value.x += (targetX - materialRef.current.uniforms.uMouse.value.x) * 0.1;
      materialRef.current.uniforms.uMouse.value.y += (targetY - materialRef.current.uniforms.uMouse.value.y) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[4, 5, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
}
