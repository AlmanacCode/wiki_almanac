/* eslint-disable react/no-unknown-property */
"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform sampler2D uTexture;
uniform float colorNum;
uniform float pixelSize;
uniform vec2 resolution;
uniform vec3 tintColor;
uniform vec3 bgColor;
varying vec2 vUv;

const float bayerMatrix8x8[64] = float[64](
  0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
  32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
  8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
  40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
  2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
  34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
  10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
  42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
);

float ditherLuminance(vec2 fragCoord, float lum) {
  vec2 scaledCoord = floor(fragCoord / pixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
  float step = 1.0 / (colorNum - 1.0);
  lum += threshold * step;
  float bias = 0.2;
  lum = clamp(lum - bias, 0.0, 1.0);
  return floor(lum * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
  vec2 pixelUv = pixelSize / resolution;
  vec2 snappedUv = pixelUv * floor(vUv / pixelUv);
  vec4 color = texture2D(uTexture, snappedUv);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float dithered = ditherLuminance(gl_FragCoord.xy, lum);
  gl_FragColor = vec4(mix(bgColor, tintColor, dithered), 1.0);
}
`;

function VideoPlane({
  src,
  colorNum,
  pixelSize,
  tintColor,
  bgColor,
}: {
  src: string;
  colorNum: number;
  pixelSize: number;
  tintColor: [number, number, number];
  bgColor: [number, number, number];
}) {
  const { viewport, size } = useThree();
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.play();

    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = tex;
    setReady(true);

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      tex.dispose();
    };
  }, [src]);

  useFrame(() => {
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  });

  if (!ready || !textureRef.current) return null;

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTexture: { value: textureRef.current },
          colorNum: { value: colorNum },
          pixelSize: { value: pixelSize },
          resolution: { value: new THREE.Vector2(size.width, size.height) },
          tintColor: { value: new THREE.Vector3(...tintColor) },
          bgColor: { value: new THREE.Vector3(...bgColor) },
        }}
      />
    </mesh>
  );
}

export default function DitheredBackground({
  src,
  colorNum = 2,
  pixelSize = 3,
  tintColor = [0.7, 0.35, 0.13],
  bgColor = [0.99, 0.98, 0.98],
  className = "",
}: {
  src: string;
  colorNum?: number;
  pixelSize?: number;
  tintColor?: [number, number, number];
  bgColor?: [number, number, number];
  className?: string;
}) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 6] }}
      dpr={1}
      frameloop="always"
      gl={{ antialias: false, preserveDrawingBuffer: true }}
    >
      <VideoPlane
        src={src}
        colorNum={colorNum}
        pixelSize={pixelSize}
        tintColor={tintColor}
        bgColor={bgColor}
      />
    </Canvas>
  );
}
