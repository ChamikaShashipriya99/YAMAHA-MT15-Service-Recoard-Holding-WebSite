"use client";

import React, { Suspense, Component, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage, Float, Text3D, Center } from "@react-three/drei";

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode; fallback: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
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
    // Ensure you have the model file at public/models/yamaha_logo.glb
    const { scene } = useGLTF("/models/yamaha_logo.glb");
    return <primitive object={scene} />;
}

function FallbackComponent() {
    return (
        <div className="flex items-center justify-center h-full w-full text-center p-6">
            <div>
                <p className="text-red-400 font-bold text-lg mb-2">Model Not Found</p>
                <p className="text-gray-400 text-sm">
                    Please add <code>yamaha_logo.glb</code> to <code>public/models/</code>
                </p>
            </div>
        </div>
    )
}

export default function LogoViewer() {
    const [modelExists, setModelExists] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        // Check if the model file exists before trying to load it
        // This prevents the "Runtime Error" overlay in Next.js
        fetch("/models/yamaha_logo.glb", { method: "HEAD" })
            .then((res) => setModelExists(res.ok))
            .catch(() => setModelExists(false));
    }, []);

    return (
        <div className="w-full h-full min-h-[400px] relative glass rounded-3xl overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black -z-10" />

            {/* Error Boundary is still good for other 3D errors */}
            <ErrorBoundary fallback={<FallbackComponent />}>
                {/* 3D Canvas */}
                <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 0, 8] }}>
                    <Suspense fallback={null}>
                        <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                            <Float
                                speed={2} // Animation speed
                                rotationIntensity={0.5} // xyz rotation intensity
                                floatIntensity={0.5} // Up/down float intensity
                            >
                                {modelExists === true ? <Model /> : null}
                            </Float>
                        </Stage>
                    </Suspense>
                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={1.5}
                        enableZoom={false}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 2}
                    />
                </Canvas>
            </ErrorBoundary>

            {/* Show fallback UI HTML overlay if model is missing (so it's readable) */}
            {modelExists === false && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md p-6 rounded-2xl border border-red-500/30 text-center pointer-events-auto">
                        <p className="text-red-400 font-bold text-lg mb-2">Model Not Found</p>
                        <p className="text-gray-300 text-sm mb-4">
                            Please download a 3D model and save it to:
                        </p>
                        <code className="block bg-black/50 p-3 rounded-lg text-xs font-mono text-cyan-400 mb-4 break-all">
                            public/models/yamaha_logo.glb
                        </code>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay Text */}
            <div className="absolute bottom-6 left-6 pointer-events-none">
                <h2 className="text-2xl font-bold text-white mb-1">Yamaha MT-15</h2>
                <p className="text-cyan-400 text-sm font-medium tracking-wider">DARK SIDE OF JAPAN</p>
            </div>
        </div>
    );
}


