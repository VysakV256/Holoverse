import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  uniform sampler2D uDepth;
  uniform float uTime;
  varying vec2 vUv;
  varying float vDepth;
  
  void main() {
    vUv = uv;
    
    // Read the depth map (0.0 to 1.0)
    // We sample texture in Vertex shader for TRUE 3D displacement
    vec4 depthColor = texture2D(uDepth, vUv);
    float depth = depthColor.r;
    vDepth = depth;
    
    // Displace the Z coordinate
    // The higher the depth value, the further "out" it pushes towards the camera
    vec3 newPosition = position;
    
    // Multiplier for how drastic the 3D effect is
    float depthMultiplier = 1.2; 
    
    // Ease out the edges so the plane doesn't look like a floating box
    // Smoothstep creates a mask where the center is 1.0 and edges fall off to 0.0
    float edgeMaskX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    float edgeMaskY = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    float mask = edgeMaskX * edgeMaskY;
    
    // Apply displacement
    newPosition.z += depth * depthMultiplier * mask;

    // Optional: Add a slight organic breathing/floating animation to the vertices
    newPosition.z += sin(uTime * 2.0 + newPosition.x * 5.0) * 0.02 * depth;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uImage0;
  uniform sampler2D uImage1;
  uniform sampler2D uImage2;
  uniform float uTime;
  
  varying vec2 vUv;
  varying float vDepth; // Receive the depth value from Vertex Shader
  
  // Hash function for holographic noise and glitching
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    // 1. Shimmering Morphing Guises Logic (Same as 2.5d approach but utilizing true 3D surface)
    float cycle = fract(uTime * 0.15); 
    float noise = hash(vUv * 10.0 + uTime);
    float glow = sin(uTime * 3.0 + vUv.y * 10.0) * 0.5 + 0.5;
    
    vec4 c0 = texture2D(uImage0, vUv);
    vec4 c1 = texture2D(uImage1, vUv);
    vec4 c2 = texture2D(uImage2, vUv);
    
    vec4 baseColor;
    
    // Blend logic: mostly stay on 1 image, occasionally "glitch" into another
    float mixFactor1 = smoothstep(0.2, 0.4, cycle) - smoothstep(0.5, 0.7, cycle);
    float mixFactor2 = smoothstep(0.6, 0.8, cycle) - smoothstep(0.9, 1.0, cycle);
    
    float shimmerMask = step(0.8, noise + glow * 0.5);
    
    baseColor = c0;
    if (mixFactor1 > 0.0) {
      baseColor = mix(c0, c1, mixFactor1 + (shimmerMask * 0.2));
    } else if (mixFactor2 > 0.0) {
      baseColor = mix(c0, c2, mixFactor2 + (shimmerMask * 0.2));
    }
    
    // 2. Holographic Effects mapping to the true 3D surface
    float scanline = sin(vUv.y * 150.0 - uTime * 10.0) * 0.05;
    
    // Chromatic aberration (glitchy offset based on vDepth)
    float r = texture2D(uImage0, vUv + vec2(0.01 * vDepth, 0.0)).r;
    float b = texture2D(uImage0, vUv - vec2(0.01 * vDepth, 0.0)).b;
    vec3 holoColor = mix(baseColor.rgb, vec3(r, baseColor.g, b), 0.4);
    
    // 3. Rim Lighting dependent on 3D depth gradients
    // If vDepth is steep (changing rapidly), we highlight it
    // Approximating lighting by using the depth map directly
    float edgeLight = pow(vDepth, 2.0); // Make the closest parts glow strongly
    holoColor += vec3(0.1, 0.8, 0.9) * edgeLight * (sin(uTime * 5.0) * 0.5 + 0.5) * 0.3;
    
    holoColor += scanline;
    
    // Transparency Masking (don't render the flat background)
    float alpha = baseColor.a;
    if (length(baseColor.rgb) < 0.1) {
      alpha = 0.0;
    } else {
      alpha = 0.9 + vDepth * 0.1 + (shimmerMask * 0.1); 
    }
    
    gl_FragColor = vec4(holoColor, alpha);
  }
`;

export function ModelDisplacementHologram({ imageUrls, depthUrl }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
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
      uTime: { value: 0 },
    }),
    [tex0, tex1, tex2, depthTex]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
    
    // Slowly orbit the camera back and forth (100 degrees total) to show off the TRUE 3D effect!
    // Using a sine wave on the angle prevents the camera from going behind the mesh
    const radius = 6;
    const angle = Math.sin(state.clock.elapsedTime * 0.3) * (Math.PI / 3.6); // oscillates between -50 and +50 degrees
    state.camera.position.x = Math.sin(angle) * radius;
    state.camera.position.z = Math.cos(angle) * radius;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <mesh ref={meshRef}>
      {/* 
        High subdivision is CRITICAL for true 3D Vertex Displacement. 
        Instead of a flat plane of 4 vertices, this creates 256x256 segments. 
        The vertex shader physically pushes these segments forwards based on the depth map.
      */}
      <planeGeometry args={[4, 5, 256, 256]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide} // render both sides since camera orbits
        wireframe={false} // Toggle to true to see the underlying 3D mesh being pushed
      />
    </mesh>
  );
}
