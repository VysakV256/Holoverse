import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const defaultFragmentShader = `
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  // A cool default dark ethereal background
  vec3 color = vec3(0.0);
  float t = uTime * 0.2;
  
  for(int i = 0; i < 3; i++) {
    uv.x += sin(t + uv.y * 5.0) * 0.1;
    uv.y += cos(t + uv.x * 5.0) * 0.1;
    color[i] = abs(sin(uv.x * 10.0) * cos(uv.y * 10.0));
  }
  
  // Mute colors, keep it dark and sci-fi
  color *= 0.15;
  color.b += 0.05;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function BackgroundShader({ fragmentShaderStr }) {
  const materialRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const parsedFragmentShader = useMemo(() => {
    if (!fragmentShaderStr) return defaultFragmentShader;
    
    // Some basic validation/transformation if needed.
    // The LLM is expected to return a function `vec3 <streamName>(vec2 uv)`
    // We need to inject that into our main() shader wrapper.
    const wrapper = `
      uniform float uTime;
      varying vec2 vUv;
      
      // Inject LLM logic
      \${fragmentShaderStr}
      
      void main() {
        // Try to guess the function name, usually logicStream, qualiaStream, spiritStream
        // Or if the LLM just returned a void main, we'll have to handle it.
        // For simplicity, let's assume the LLM provides a full fragment shader with main()
        // OR the wrapper approach. 
        // For Holoverse, we will enforce the LLM to just provide the content of void main()
        // or a standalone function.
        
        // Let's assume the LLM returns a function named "generateBackground(vec2 uv, float time)"
        // or just injects it directly. We'll refine the prompt in llm.js.
      }
    `;

    // For now, if the LLM returns a standard shader:
    return fragmentShaderStr.includes("void main") ? fragmentShaderStr : defaultFragmentShader;
  }, [fragmentShaderStr]);

  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[15, 10]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={parsedFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}
