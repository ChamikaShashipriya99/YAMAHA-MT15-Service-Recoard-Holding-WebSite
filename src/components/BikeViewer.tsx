"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    OrbitControls,
    Stage,
    Float,
    PerspectiveCamera,
    useTexture,
    Html,
} from "@react-three/drei";
import * as THREE from "three";

// --- MT-15 Parts Components ---

const Wheel = ({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) => (
    <group position={position} rotation={rotation}>
        {/* Tire */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.21, 16]} />
            <meshStandardMaterial color="#e74c3c" metalness={0.8} roughness={0.2} /> {/* MT-15 sometimes has red/orange rims */}
        </mesh>
        {/* Spokes (simplified) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.22, 8]} />
            <meshStandardMaterial color="#333" />
        </mesh>
    </group>
);

const FrontForks = () => (
    <group position={[0.85, 0.6, 0]} rotation={[0, 0, -0.4]}>
        {/* Left Fork (Gold USD) */}
        <mesh position={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Right Fork (Gold USD) */}
        <mesh position={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        </mesh>
    </group>
);

const EngineBlock = () => (
    <group position={[0, 0.4, 0]}>
        <mesh>
            <boxGeometry args={[0.5, 0.5, 0.4]} />
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.7} />
        </mesh>
        <mesh position={[0.1, -0.1, 0.25]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4]} />
            <meshStandardMaterial color="#555" />
        </mesh>
    </group>
)

const Exhaust = () => (
    <group position={[-0.4, 0.3, 0.3]} rotation={[0, 0, 0.2]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.1, 0.8, 16]} />
            <meshStandardMaterial color="#silver" metalness={0.7} roughness={0.3} />
        </mesh>
    </group>
)

const BodyWork = () => (
    <group>
        {/* Tank (Sculpted) */}
        <mesh position={[0.3, 0.85, 0]}>
            <boxGeometry args={[0.7, 0.4, 0.5]} />
            <meshStandardMaterial color="#000000" metalness={0.6} roughness={0.4} /> {/* Tech Black */}
        </mesh>
        {/* Tank Shrouds (Cyan/Accent) */}
        <mesh position={[0.5, 0.8, 0.3]}>
            <boxGeometry args={[0.4, 0.3, 0.1]} />
            <meshStandardMaterial color="#00FFFF" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0.5, 0.8, -0.3]}>
            <boxGeometry args={[0.4, 0.3, 0.1]} />
            <meshStandardMaterial color="#00FFFF" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Seat */}
        <mesh position={[-0.3, 0.82, 0]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.7, 0.1, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>

        {/* Tail */}
        <mesh position={[-0.8, 0.9, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.2]} />
            <meshStandardMaterial color="#333" />
        </mesh>
    </group>
)

const HeadLight = () => (
    <group position={[1.15, 0.9, 0]} rotation={[0, 0, -0.2]}>
        <mesh>
            <boxGeometry args={[0.1, 0.25, 0.2]} />
            <meshStandardMaterial color="#222" />
        </mesh>
        {/* The "Eye" */}
        <mesh position={[0.06, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
    </group>
)

const HandleBars = () => (
    <group position={[0.9, 1.05, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.7]} />
            <meshStandardMaterial color="#silver" />
        </mesh>
        {/* Mirrors */}
        <mesh position={[0, 0.1, 0.3]}>
            <cylinderGeometry args={[0.01, 0.01, 0.2]} />
            <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0, 0.2, 0.3]}>
            <circleGeometry args={[0.08]} />
            <meshStandardMaterial color="black" side={THREE.DoubleSide} />
        </mesh>

        <mesh position={[0, 0.1, -0.3]}>
            <cylinderGeometry args={[0.01, 0.01, 0.2]} />
            <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0, 0.2, -0.3]}>
            <circleGeometry args={[0.08]} />
            <meshStandardMaterial color="black" side={THREE.DoubleSide} />
        </mesh>
    </group>
)

function MT15Model() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Subtle idle animation
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02
        }
    })

    return (
        <group ref={groupRef}>
            {/* Wheels */}
            <Wheel position={[0.9, 0.35, 0]} /> {/* Front */}
            <Wheel position={[-0.9, 0.35, 0]} /> {/* Rear */}

            {/* Frame & Engine */}
            <EngineBlock />
            <BodyWork />

            {/* Front End */}
            <FrontForks />
            <HeadLight />
            <HandleBars />

            {/* Exhaust */}
            <Exhaust />

            {/* Swingarm (connecting rear wheel) */}
            <mesh position={[-0.45, 0.35, 0.15]} rotation={[0, 0, 0]} >
                <boxGeometry args={[0.9, 0.05, 0.05]} />
                <meshStandardMaterial color="#silver" metalness={0.6} />
            </mesh>
            <mesh position={[-0.45, 0.35, -0.15]} rotation={[0, 0, 0]} >
                <boxGeometry args={[0.9, 0.05, 0.05]} />
                <meshStandardMaterial color="#silver" metalness={0.6} />
            </mesh>


        </group>
    );
}

export default function BikeViewer() {
    return (
        <div className="w-full h-[50vh] md:h-full min-h-[400px] relative rounded-3xl overflow-hidden glass border border-white/10 bg-black/40">
            <div className="absolute top-6 left-6 z-10 select-none pointer-events-none">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)] italic">
                    MT-15
                </h2>
                <p className="text-cyan-200/80 text-sm font-mono tracking-widest uppercase">Dark Warrior</p>
            </div>

            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[3, 2, 4]} fov={45} />
                <Suspense fallback={<Html center className="text-white">Loading...</Html>}>
                    <Stage environment="city" intensity={0.8} adjustCamera={false}>
                        <Float
                            speed={2}
                            rotationIntensity={0.2}
                            floatIntensity={0.5}
                            floatingRange={[-0.1, 0.1]}
                        >
                            <MT15Model />
                        </Float>
                    </Stage>
                    <OrbitControls
                        makeDefault
                        autoRotate
                        autoRotateSpeed={1.5}
                        enablePan={false}
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 1.8}
                        minDistance={3}
                        maxDistance={8}
                    />
                </Suspense>
            </Canvas>

            <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-2 pointer-events-none">
                <div className="flex gap-2">
                    <span className="px-2 py-1 bg-cyan-500/20 rounded text-[10px] text-cyan-300 font-mono border border-cyan-500/30">155 CC</span>
                    <span className="px-2 py-1 bg-cyan-500/20 rounded text-[10px] text-cyan-300 font-mono border border-cyan-500/30">VVA</span>
                </div>
                <p className="text-xs text-gray-500 font-mono">* Interactive 3D Model</p>
            </div>
        </div>
    );
}
