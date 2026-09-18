"use client";

import React, { Suspense, Component, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage, Float } from "@react-three/drei";
import { Compass, Maximize2, Shield } from "lucide-react";

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode; fallback: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("3D Model Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

function Model() {
    const { scene } = useGLTF("/models/yamaha_logo.glb");
    return <primitive object={scene} />;
}

function FallbackComponent() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-6">
            <div className="p-3 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-cyan-400 mb-3 animate-pulse">
                <Compass className="w-8 h-8" />
            </div>
            <p className="text-sm font-mono font-bold text-white tracking-wider">3D EMBLEM VISUALIZER</p>
            <p className="text-xs font-mono text-gray-500 mt-1">Interactive 3D Stage Ready</p>
        </div>
    );
}

export default function LogoViewer() {
    const [modelExists, setModelExists] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        fetch("/models/yamaha_logo.glb", { method: "HEAD" })
            .then((res) => setModelExists(res.ok))
            .catch(() => setModelExists(false));
    }, []);

    return (
        <div className="w-full h-full min-h-[420px] relative cyber-card rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="cyber-corner-tl" />
            <div className="cyber-corner-br" />

            {/* Top HUD Telemetry Bar */}
            <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-cyan-500/20">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[10px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
                        STAGE // 3D_ACTIVE
                    </span>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-gray-400">
                    ROTATE 360°
                </div>
            </div>

            {/* 3D Canvas */}
            <div className="w-full h-full absolute inset-0">
                <ErrorBoundary fallback={<FallbackComponent />}>
                    <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 0, 8] }}>
                        <Suspense fallback={null}>
                            <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                                <Float
                                    speed={2}
                                    rotationIntensity={0.5}
                                    floatIntensity={0.5}
                                >
                                    {modelExists === true ? <Model /> : null}
                                </Float>
                            </Stage>
                        </Suspense>
                        <OrbitControls
                            autoRotate
                            autoRotateSpeed={1.2}
                            enableZoom={false}
                            maxPolarAngle={Math.PI / 2}
                            minPolarAngle={Math.PI / 2}
                        />
                    </Canvas>
                </ErrorBoundary>
            </div>

            {/* Fallback Graphic if model file is not placed yet */}
            {modelExists === false && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="relative flex flex-col items-center justify-center p-8 text-center">
                        {/* Futuristic Radar/Emblem Placeholder */}
                        <div className="relative w-36 h-36 rounded-full border border-cyan-500/20 flex items-center justify-center mb-4">
                            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/40 animate-[spin_30s_linear_infinite]" />
                            <div className="absolute inset-6 rounded-full border border-cyan-500/30" />
                            <div className="w-16 h-16 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.3)]">
                                <span className="font-mono text-xl font-bold text-white tracking-widest">MT</span>
                            </div>
                        </div>
                        <p className="text-xs font-mono text-cyan-400 tracking-wider font-semibold uppercase">
                            YAMAHA MT-15 V2
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 mt-1">
                            Awaiting 3D GLB Asset at /models/yamaha_logo.glb
                        </p>
                    </div>
                </div>
            )}

            {/* Bottom HUD Specification Bar */}
            <div className="relative z-20 mt-auto p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-mono font-bold text-white tracking-wide">
                                YAMAHA <span className="text-cyan-400">MT-15</span>
                            </h2>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                2.0
                            </span>
                        </div>
                        <p className="text-xs font-mono text-cyan-400/90 font-medium tracking-widest uppercase mt-0.5 glow-cyan">
                            The Dark Side of Japan
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                        <span className="px-2 py-1 rounded bg-black/40 border border-white/5">
                            155cc VVA LC4V
                        </span>
                        <span className="px-2 py-1 rounded bg-black/40 border border-white/5">
                            DELTABOX FRAME
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
