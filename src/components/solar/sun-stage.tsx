import { Canvas } from '@react-three/fiber';
import { memo, useMemo } from 'react';
import { Color, Object3D, Vector3 } from 'three';
import { degreesToRadians } from '@/lib/explanation/math';
import type { SolarPosition } from '@/lib/solar-position';

const DEFAULT_DIRECTION = new Vector3(0.35, 0.75, 0.4).normalize();

const SUN_DISTANCE = 60;
const GNOMON_HEIGHT = 3.8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const wrapAzimuth = (azimuth: number) => {
    const normalized = ((azimuth % 360) + 360) % 360;
    return normalized;
};

type SceneParameters = {
    direction: Vector3;
    sunColor: string;
    ambientIntensity: number;
    sunIntensity: number;
    background: string;
    horizon: string;
    ground: string;
    highlight: string;
    isNight: boolean;
};

const computeSceneParameters = (position: SolarPosition | null): SceneParameters => {
    if (!position) {
        return {
            ambientIntensity: 0.35,
            background: '#020617',
            direction: DEFAULT_DIRECTION.clone(),
            ground: '#0f172a',
            highlight: '#0ea5e9',
            horizon: '#0b1120',
            isNight: true,
            sunIntensity: 0.15,
            sunColor: '#f59e0b',
        } satisfies SceneParameters;
    }

    const altitude = clamp(position.altitude, -18, 90);
    const azimuth = wrapAzimuth(position.azimuth);
    const altitudeRad = degreesToRadians(altitude);
    const azimuthRad = degreesToRadians(azimuth);
    const horizontalMagnitude = Math.cos(altitudeRad);

    const direction = new Vector3(
        Math.sin(azimuthRad) * horizontalMagnitude,
        Math.sin(altitudeRad),
        -Math.cos(azimuthRad) * horizontalMagnitude,
    ).normalize();

    const daylightFactor = (altitude + 18) / 108;
    const skyProgress = clamp((altitude + 6) / 72, 0, 1);
    const isNight = position.altitude < -6;

    const sunHue = isNight ? 32 : 45 - daylightFactor * 15;
    const sunLightness = isNight ? 62 : 55 + daylightFactor * 25;
    const sunColor = `hsl(${sunHue} 90% ${sunLightness}%)`;

    const backgroundHue = 215 - skyProgress * 60;
    const backgroundLightness = 12 + skyProgress * 30;
    const background = isNight ? '#020617' : `hsl(${backgroundHue} 80% ${backgroundLightness}%)`;

    const horizonHue = 28 + (1 - skyProgress) * 16;
    const horizonLightness = 45 + skyProgress * 12;
    const horizon = isNight ? '#0b1120' : `hsl(${horizonHue} 85% ${horizonLightness}%)`;

    const ground = isNight ? '#0f172a' : `hsl(${170 - daylightFactor * 45} 25% ${16 + daylightFactor * 10}%)`;
    const highlight = isNight ? '#38bdf8' : `hsl(${198 - skyProgress * 30} 70% ${60 + skyProgress * 20}%)`;
    const ambientIntensity = isNight ? 0.15 : 0.35 + daylightFactor * 0.35;
    const sunIntensity = isNight ? 0.1 : 1.3 + daylightFactor * 0.8;

    return {
        ambientIntensity,
        background,
        direction,
        ground,
        highlight,
        horizon,
        isNight,
        sunIntensity,
        sunColor,
    } satisfies SceneParameters;
};

type SunStageProps = {
    /** Current solar position */
    position: SolarPosition | null;
    /** Whether the current shadow length satisfies the madhab convention */
    isAsr: boolean;
    /** Shadow ratio (object height = 1). Null when sun is below horizon */
    shadowRatio: number | null;
    /** Target shadow ratio threshold based on madhab */
    shadowThreshold: number;
    /** Human readable madhab label */
    madhabLabel: string;
};

type SceneLightingProps = {
    direction: Vector3;
    color: string;
    ambientIntensity: number;
    sunIntensity: number;
    highlight: string;
    isNight: boolean;
};

const SceneLighting = ({ direction, color, ambientIntensity, sunIntensity, highlight, isNight }: SceneLightingProps) => {
    const target = useMemo(() => new Object3D(), []);

    const lightPosition = useMemo(() => direction.clone().multiplyScalar(SUN_DISTANCE), [direction]);
    const sunColor = new Color(color);

    const lightIntensity = isNight ? sunIntensity * 0.5 : sunIntensity;

    return (
        <>
            <primitive object={target} position={[0, 0, 0]} />
            <hemisphereLight args={[highlight, '#0f172a', 0.6]} />
            <ambientLight color={highlight} intensity={ambientIntensity} />
            <directionalLight
                castShadow
                color={sunColor}
                intensity={lightIntensity}
                position={lightPosition.toArray() as [number, number, number]}
                shadow-bias={-0.0005}
                shadow-camera-far={150}
                shadow-camera-left={-30}
                shadow-camera-near={1}
                shadow-camera-bottom={-30}
                shadow-camera-right={30}
                shadow-camera-top={30}
                shadow-mapSize-height={2048}
                shadow-mapSize-width={2048}
                target={target}
            />
        </>
    );
};

type SolarGroundProps = {
    ground: string;
    horizon: string;
};

const SolarGround = ({ ground, horizon }: SolarGroundProps) => {
    return (
        <group>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[140, 140]} />
                <meshStandardMaterial color={ground} roughness={0.9} metalness={0} />
            </mesh>
            <mesh position={[0, 15, -40]} rotation={[0, 0, 0]}>
                <planeGeometry args={[140, 50]} />
                <meshBasicMaterial color={horizon} />
            </mesh>
        </group>
    );
};

type GnomonProps = {
    isAsr: boolean;
    shadowRatio: number | null;
    highlight: string;
    sunDirection: Vector3;
};

const Gnomon = ({ isAsr, shadowRatio, highlight, sunDirection }: GnomonProps) => {
    const ratio = shadowRatio ? clamp(shadowRatio, 0, 12) : 0;
    const indicatorScale = 1 + (isAsr ? 0.25 : 0);
    const glow = isAsr ? highlight : '#f8fafc';

    const groundDirection = useMemo(() => {
        if (!shadowRatio || shadowRatio <= 0) {
            return null;
        }
        const horizontal = new Vector3(-sunDirection.x, 0, -sunDirection.z);
        if (horizontal.lengthSq() === 0) {
            return null;
        }
        return horizontal.normalize();
    }, [shadowRatio, sunDirection.x, sunDirection.z]);

    const shadowLength = ratio * GNOMON_HEIGHT;
    const clampedLength = clamp(shadowLength, 0, GNOMON_HEIGHT * 12);
    const shadowOffset = groundDirection ? groundDirection.clone().multiplyScalar(clampedLength / 2) : null;
    const rotationY = groundDirection ? Math.atan2(groundDirection.x, groundDirection.z) : 0;

    return (
        <group>
            <mesh
                castShadow
                position={[0, 1.2, 0]}
                scale={[indicatorScale, indicatorScale, indicatorScale]}
            >
                <cylinderGeometry args={[0.18, 0.25, 2.4, 24]} />
                <meshStandardMaterial
                    color={glow}
                    emissive={isAsr ? highlight : '#0f172a'}
                    emissiveIntensity={isAsr ? 0.45 : 0}
                    metalness={0.1}
                    roughness={0.4}
                />
            </mesh>
            <mesh castShadow position={[0, 2.5, 0]}>
                <coneGeometry args={[0.3, 1.4, 24]} />
                <meshStandardMaterial
                    color={glow}
                    emissive={isAsr ? highlight : '#0f172a'}
                    emissiveIntensity={isAsr ? 0.45 : 0}
                    metalness={0.05}
                    roughness={0.35}
                />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 1]}>
                <ringGeometry args={[1.25, 1.32, 64]} />
                <meshBasicMaterial color="#ffffff" opacity={0.25} transparent />
            </mesh>
            <mesh
                position={[0, 0.01, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[ratio * 0.22, ratio * 0.22, ratio * 0.22]}
            >
                <circleGeometry args={[1, 64]} />
                <meshBasicMaterial color={highlight} opacity={0.18} transparent />
            </mesh>
            {groundDirection && shadowOffset ? (
                <mesh
                    position={[shadowOffset.x, 0.025, shadowOffset.z]}
                    rotation={[0, rotationY, 0]}
                >
                    <boxGeometry args={[0.4, 0.05, clampedLength]} />
                    <meshStandardMaterial color="#0f172a" opacity={0.45} roughness={0.8} transparent />
                </mesh>
            ) : null}
        </group>
    );
};

type SolarBodyProps = {
    direction: Vector3;
    color: string;
    isNight: boolean;
};

const SolarBody = ({ direction, color, isNight }: SolarBodyProps) => {
    const sunPosition = useMemo(() => direction.clone().multiplyScalar(SUN_DISTANCE), [direction]);
    const glowColor = new Color(color);

    return (
        <group position={sunPosition.toArray() as [number, number, number]}>
            <mesh>
                <sphereGeometry args={[2.8, 48, 48]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <mesh scale={[1, 1, 1]}>
                <sphereGeometry args={[4.5, 32, 32]} />
                <meshBasicMaterial
                    color={glowColor}
                    opacity={isNight ? 0.4 : 0.65}
                    toneMapped={false}
                    transparent
                />
            </mesh>
        </group>
    );
};

/**
 * Immersive 3D scene showing the sun, realistic lighting, and the gnomon shadow used for Asr calculations.
 */
export const SunStage = memo(
    ({ position, isAsr, shadowRatio, shadowThreshold, madhabLabel }: SunStageProps) => {
        const scene = useMemo(() => computeSceneParameters(position), [position]);

        const statusLabel = isAsr ? 'Within Asr shadow length' : 'Before Asr shadow length';
        const altitudeLabel = position ? `${position.altitude.toFixed(1)}°` : '—';
        const azimuthLabel = position ? `${wrapAzimuth(position.azimuth).toFixed(0)}°` : '—';
        const shadowLabel = shadowRatio ? `${shadowRatio.toFixed(2)}×` : '—';

        return (
            <div className="relative mx-auto w-full max-w-5xl">
                <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
                    <Canvas
                        camera={{ position: [10, 6, 12], fov: 45 }}
                        dpr={[1, 2]}
                        shadows
                    >
                        <color attach="background" args={[scene.background]} />
                        <fog attach="fog" args={[scene.background, 45, 130]} />
                        <SceneLighting
                            ambientIntensity={scene.ambientIntensity}
                            color={scene.sunColor}
                            direction={scene.direction}
                            highlight={scene.highlight}
                            isNight={scene.isNight}
                            sunIntensity={scene.sunIntensity}
                        />
                        <SolarGround ground={scene.ground} horizon={scene.horizon} />
                        <Gnomon
                            highlight={scene.highlight}
                            isAsr={isAsr}
                            shadowRatio={shadowRatio}
                            sunDirection={scene.direction}
                        />
                        <SolarBody color={scene.sunColor} direction={scene.direction} isNight={scene.isNight} />
                    </Canvas>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />

                    <div className="pointer-events-none absolute top-6 left-6 rounded-2xl bg-black/35 px-5 py-3 text-sm text-slate-100 backdrop-blur">
                        <div className="font-semibold uppercase tracking-wide text-slate-200">Sun Position</div>
                        <div className="mt-1 flex gap-6 text-xs text-slate-200/80">
                            <div>
                                <div className="font-medium text-slate-100">Altitude</div>
                                <div>{altitudeLabel}</div>
                            </div>
                            <div>
                                <div className="font-medium text-slate-100">Azimuth</div>
                                <div>{azimuthLabel}</div>
                            </div>
                            <div>
                                <div className="font-medium text-slate-100">Shadow</div>
                                <div>{shadowLabel}</div>
                            </div>
                        </div>
                    </div>

                    <div className="pointer-events-none absolute bottom-6 left-6 rounded-2xl bg-black/35 px-5 py-3 text-xs text-slate-200 backdrop-blur">
                        <div className="font-semibold text-slate-100">{statusLabel}</div>
                        <div className="mt-1 text-slate-200/80">
                            {`Current ratio ${shadowLabel} · Threshold ${shadowThreshold.toFixed(2)}× (${madhabLabel})`}
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

SunStage.displayName = 'SunStage';
