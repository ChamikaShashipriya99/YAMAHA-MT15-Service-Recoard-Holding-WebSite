"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Float } from "@react-three/drei";

function PlaceholderBike() {
    return (
        <mesh>
            <boxGeometry args={[2, 1, 4]} />
            <meshStandardMaterial color="#00FFFF" transparent opacity={0.8} roughness={0.1} metalness={0.8} />
        </mesh>
    );
}

export default function BikeViewer() {
    return (
        <div className="w-full h-[50vh] md:h-full min-h-[400px] relative rounded-3xl overflow-hidden glass">
            <div className="absolute top-4 left-4 z-10">
                <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
                    Yamaha MT-15
                </h2>
                <p className="text-cyan-400 text-sm">Interactive 3D View</p>
            </div>

            <Canvas shadows camera={{ position: [4, 2, 5], fov: 50 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                            <PlaceholderBike />
                            {/* 
                  TODO: Replace <PlaceholderBike /> with:
                  <primitive object={gltf.scene} /> 
                  after loading the model with useGLTF hook.
               */}
                        </Float>
                    </Stage>
                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                </Suspense>
            </Canvas>

            <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-400 max-w-xs">
                * Drag to rotate. Scroll to zoom.
            </div>
        </div>
    );
}
