import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uImage;
  uniform sampler2D uDepth;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uAccentColor;
  uniform float uPresence;

  varying vec2 vUv;
  varying vec3 vPosition;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float depth = texture2D(uDepth, vUv).r;
    vec2 parallax = uMouse * (0.025 + depth * 0.05);
    vec2 uv = vUv + parallax;

    vec4 image = texture2D(uImage, uv);
    float noise = hash(vUv * 50.0 + uTime * 0.4);
    float shimmer = 0.5 + 0.5 * sin(uTime * 3.0 + vUv.y * 16.0 + depth * 5.0);
    float scanline = sin(vUv.y * 420.0 - uTime * 18.0) * 0.03;
    float pulse = 0.75 + 0.25 * sin(uTime * 1.7);

    float rim = smoothstep(0.18, 0.92, depth) - smoothstep(0.62, 1.0, depth);
    float aura = smoothstep(0.25, 1.0, depth) * (0.55 + 0.45 * shimmer);

    vec3 baseColor = image.rgb;
    vec3 holoColor = baseColor;
    holoColor = mix(holoColor, uPrimaryColor, 0.14 + rim * 0.12);
    holoColor += uSecondaryColor * (rim * 0.26 + aura * 0.08) * uPresence;
    holoColor += uAccentColor * 0.08;
    holoColor += vec3(scanline);
    holoColor += uPrimaryColor * noise * 0.035 * pulse * uPresence;
    holoColor += uAccentColor * aura * 0.2;

    float alpha = image.a;
    if (length(baseColor.rgb) < 0.05) {
      alpha = 0.0;
    } else {
      alpha = 0.88 + depth * 0.12;
    }

    gl_FragColor = vec4(holoColor, alpha);
  }
`;

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const int = Number.parseInt(value, 16);
  return new THREE.Vector3(
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  );
}

export function SingleImageHologram({
  imageUrl,
  depthUrl,
  primaryColor = '#13e5ff',
  secondaryColor = '#f3c43c',
  accentColor = '#17274d',
  presence = 1,
}) {
  const materialRef = useRef(null);
  const [imageTexture, depthTexture] = useTexture([imageUrl, depthUrl]);

  const uniforms = useMemo(
    () => ({
      uImage: { value: imageTexture },
      uDepth: { value: depthTexture },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPrimaryColor: { value: hexToRgb(primaryColor) },
      uSecondaryColor: { value: hexToRgb(secondaryColor) },
      uAccentColor: { value: hexToRgb(accentColor) },
      uPresence: { value: presence },
    }),
    [accentColor, depthTexture, imageTexture, presence, primaryColor, secondaryColor],
  );

  useFrame((state) => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.x += (((state.mouse.x * Math.PI) / 6) - materialRef.current.uniforms.uMouse.value.x) * 0.08;
    materialRef.current.uniforms.uMouse.value.y += (((state.mouse.y * Math.PI) / 6) - materialRef.current.uniforms.uMouse.value.y) * 0.08;
  });

  return (
    <mesh>
      <planeGeometry args={[4, 5, 96, 96]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
