import { Canvas, useThree } from '@react-three/fiber';
import { addMinutes, startOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { memo, useEffect, useMemo } from 'react';
import { AdditiveBlending, CanvasTexture, Color, Object3D, SRGBColorSpace, SpriteMaterial, Vector3 } from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import type { FormattedTiming } from '@/lib/calculator';
import { degreesToRadians } from '@/lib/explanation/math';
import { getSolarPosition, type SolarPosition } from '@/lib/solar-position';

const DEFAULT_DIRECTION = new Vector3(0.35, 0.75, 0.4).normalize();

const SKY_RADIUS = 450_000;
const SUN_DISTANCE = 60;
const GNOMON_HEIGHT = 3.8;
const SUN_PATH_RESOLUTION_MINUTES = 10;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const wrapAzimuth = (azimuth: number) => {
    const normalized = ((azimuth % 360) + 360) % 360;
    return normalized;
};

const directionFromSolarPosition = (position: SolarPosition): Vector3 => {
    const altitude = clamp(position.altitude, -18, 90);
    const azimuth = wrapAzimuth(position.azimuth);
    const altitudeRad = degreesToRadians(altitude);
    const azimuthRad = degreesToRadians(azimuth);
    const horizontalMagnitude = Math.cos(altitudeRad);

    return new Vector3(
        Math.sin(azimuthRad) * horizontalMagnitude,
        Math.sin(altitudeRad),
        Math.cos(azimuthRad) * horizontalMagnitude,
    ).normalize();
};

const getSunWorldPosition = (direction: Vector3) => direction.clone().multiplyScalar(SUN_DISTANCE);

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

type SunPathPoint = {
    date: Date;
    altitude: number;
    direction: Vector3;
    isAboveHorizon: boolean;
};

type PrayerMarker = {
    event: string;
    label: string;
    date: Date;
    position: Vector3;
    altitude: number;
    isPast: boolean;
    timeLabel: string;
    isFard: boolean;
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

    const direction = directionFromSolarPosition(position);
    const altitude = clamp(position.altitude, -18, 90);
    const azimuth = wrapAzimuth(position.azimuth);

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

const buildSunPath = (
    coordinates: { latitude: number; longitude: number } | null,
    timeZone: string,
): SunPathPoint[] => {
    if (!coordinates || !Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
        return [];
    }

    const now = new Date();
    const zonedNow = utcToZonedTime(now, timeZone);
    const localStart = startOfDay(zonedNow);
    const points: SunPathPoint[] = [];

    for (let minutes = 0; minutes <= 24 * 60; minutes += SUN_PATH_RESOLUTION_MINUTES) {
        const localSample = addMinutes(localStart, minutes);
        const utcSample = zonedTimeToUtc(localSample, timeZone);
        const samplePosition = getSolarPosition({
            coordinates,
            date: utcSample,
        });
        const direction = directionFromSolarPosition(samplePosition);
        points.push({
            altitude: samplePosition.altitude,
            date: utcSample,
            direction,
            isAboveHorizon: samplePosition.altitude > 0,
        });
    }

    return points;
};

const buildPrayerMarkers = (
    timings: FormattedTiming[],
    coordinates: { latitude: number; longitude: number } | null,
): PrayerMarker[] => {
    if (!coordinates || !Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
        return [];
    }

    const now = Date.now();

    return timings
        .filter((timing) => timing.isFard || timing.event === 'sunrise')
        .map((timing) => {
            const solar = getSolarPosition({ coordinates, date: timing.value });
            const direction = directionFromSolarPosition(solar);
            return {
                altitude: solar.altitude,
                date: timing.value,
                event: timing.event,
                isFard: timing.isFard,
                isPast: timing.value.getTime() <= now,
                label: timing.label,
                position: getSunWorldPosition(direction),
                timeLabel: timing.time,
            } satisfies PrayerMarker;
        })
        .filter((marker) => marker.altitude > -15);
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
    /** Observer coordinates used for solar calculations */
    coordinates: { latitude: number; longitude: number } | null;
    /** Timings for the current day's prayers */
    prayerTimings: FormattedTiming[];
    /** IANA time zone for the selected location */
    timeZone: string;
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

type DynamicSkyProps = {
    direction: Vector3;
    altitude: number;
    isNight: boolean;
};

const DynamicSkyDome = ({ direction, altitude, isNight }: DynamicSkyProps) => {
    const sky = useMemo(() => {
        const instance = new Sky();
        instance.scale.setScalar(SKY_RADIUS);
        return instance;
    }, []);

    const { gl } = useThree();

    useEffect(() => {
        const uniforms = sky.material.uniforms;
        uniforms.turbidity.value = isNight ? 2.5 : 10 + (Math.max(altitude, 0) / 90) * 10;
        uniforms.rayleigh.value = isNight ? 0.3 : 1.6;
        uniforms.mieCoefficient.value = isNight ? 0.005 : 0.015;
        uniforms.mieDirectionalG.value = 0.8;
        uniforms.sunPosition.value.copy(direction.clone().multiplyScalar(SKY_RADIUS));

        const daylight = clamp((altitude + 6) / 96, 0, 1);
        gl.toneMappingExposure = 0.35 + daylight * 1.6;
    }, [altitude, direction, gl, isNight, sky]);

    return <primitive object={sky} />;
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

type SunPathProps = {
    path: SunPathPoint[];
    highlight: string;
};

const SunPath = ({ path, highlight }: SunPathProps) => {
    const positions = useMemo(() => {
        if (path.length === 0) {
            return null;
        }
        const array = new Float32Array(path.length * 3);
        path.forEach((point, index) => {
            const world = getSunWorldPosition(point.direction);
            world.toArray(array, index * 3);
        });
        return array;
    }, [path]);

    if (!positions) {
        return null;
    }

    return (
        <line>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color={highlight} opacity={0.25} transparent />
        </line>
    );
};

type PrayerMarkersProps = {
    markers: PrayerMarker[];
    highlight: string;
};

const PrayerMarkers = ({ markers, highlight }: PrayerMarkersProps) => {
    if (markers.length === 0) {
        return null;
    }

    return (
        <group>
            {markers.map((marker) => {
                const color = marker.isPast ? '#cbd5f5' : highlight;
                const sphereScale = marker.isPast ? 0.75 : 1;

                const x = marker.position.x;
                const y = marker.position.y;
                const z = marker.position.z;

                return (
                    <group key={marker.event} position={[x, y, z]}>
                        <mesh>
                            <sphereGeometry args={[0.55 * sphereScale, 24, 24]} />
                            <meshBasicMaterial color={color} toneMapped={false} />
                        </mesh>
                        <mesh position={[0, -y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.4, 0.55, 48]} />
                            <meshBasicMaterial color={color} opacity={0.35} transparent />
                        </mesh>
                    </group>
                );
            })}
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
                <sphereGeometry args={[4.8, 32, 32]} />
                <meshBasicMaterial
                    color={glowColor}
                    opacity={isNight ? 0.4 : 0.7}
                    toneMapped={false}
                    transparent
                />
            </mesh>
            <SunBillboard color={color} isNight={isNight} />
        </group>
    );
};

type SunBillboardProps = {
    color: string;
    isNight: boolean;
};

const createSunTexture = () => {
    if (typeof document === 'undefined') {
        return null;
    }
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return null;
    }

    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.35, 'rgba(255, 244, 214, 0.96)');
    gradient.addColorStop(0.65, 'rgba(255, 212, 128, 0.55)');
    gradient.addColorStop(1, 'rgba(255, 180, 64, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
};

const SunBillboard = ({ color, isNight }: SunBillboardProps) => {
    const texture = useMemo(() => createSunTexture(), []);

    useEffect(() => {
        return () => {
            texture?.dispose();
        };
    }, [texture]);

    const material = useMemo(() => {
        if (!texture) {
            return null;
        }
        const spriteMaterial = new SpriteMaterial({
            blending: AdditiveBlending,
            depthWrite: false,
            map: texture,
            toneMapped: false,
            transparent: true,
        });
        spriteMaterial.color.set(color);
        spriteMaterial.opacity = isNight ? 0.55 : 0.9;
        return spriteMaterial;
    }, [color, isNight, texture]);

    useEffect(() => {
        return () => {
            material?.dispose();
        };
    }, [material]);

    if (!material) {
        return null;
    }

    const scale = isNight ? 11 : 14;

    return <sprite material={material} scale={[scale, scale, scale]} />;
};

/**
 * Immersive 3D scene showing the sun, realistic lighting, and the gnomon shadow used for Asr calculations.
 */
export const SunStage = memo(
    ({
        position,
        isAsr,
        shadowRatio,
        shadowThreshold,
        madhabLabel,
        coordinates,
        prayerTimings,
        timeZone,
    }: SunStageProps) => {
        const scene = useMemo(() => computeSceneParameters(position), [position]);
        const sunPath = useMemo(() => buildSunPath(coordinates, timeZone), [coordinates, timeZone]);
        const prayerMarkers = useMemo(() => buildPrayerMarkers(prayerTimings, coordinates), [coordinates, prayerTimings]);

        const statusLabel = isAsr ? 'Within Asr shadow length' : 'Before Asr shadow length';
        const altitudeLabel = position ? `${position.altitude.toFixed(1)}°` : '—';
        const azimuthLabel = position ? `${wrapAzimuth(position.azimuth).toFixed(0)}°` : '—';
        const shadowLabel = shadowRatio ? `${shadowRatio.toFixed(2)}×` : '—';
        const daylightSpan = prayerMarkers.filter((marker) => marker.isFard || marker.event === 'sunrise');

        return (
            <div className="relative mx-auto w-full max-w-5xl">
                <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
                    <Canvas camera={{ position: [10, 6, 12], fov: 45 }} dpr={[1, 2]} shadows>
                        <color attach="background" args={[scene.background]} />
                        <fog attach="fog" args={[scene.background, 45, 130]} />
                        <DynamicSkyDome altitude={position?.altitude ?? -90} direction={scene.direction} isNight={scene.isNight} />
                        <SceneLighting
                            ambientIntensity={scene.ambientIntensity}
                            color={scene.sunColor}
                            direction={scene.direction}
                            highlight={scene.highlight}
                            isNight={scene.isNight}
                            sunIntensity={scene.sunIntensity}
                        />
                        <SolarGround ground={scene.ground} horizon={scene.horizon} />
                        <SunPath highlight={scene.highlight} path={sunPath} />
                        <PrayerMarkers highlight={scene.highlight} markers={prayerMarkers} />
                        <Gnomon
                            highlight={scene.highlight}
                            isAsr={isAsr}
                            shadowRatio={shadowRatio}
                            sunDirection={scene.direction}
                        />
                        <SolarBody color={scene.sunColor} direction={scene.direction} isNight={scene.isNight} />
                    </Canvas>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15" />

                    <div className="pointer-events-none absolute top-6 left-6 rounded-2xl bg-black/35 px-5 py-3 text-sm text-slate-100 backdrop-blur">
                        <div className="font-semibold uppercase tracking-wide text-slate-200">Sun Position</div>
                        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-200/80">
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

                    <div className="pointer-events-none absolute bottom-6 left-6 rounded-2xl bg-black/35 px-5 py-3 text-sm text-slate-100 backdrop-blur">
                        <div className="font-semibold uppercase tracking-wide text-slate-200">Shadow length</div>
                        <div className="mt-1 text-xs text-slate-200/80">
                            <div className="font-medium text-slate-100">{statusLabel}</div>
                            <div className="mt-1 flex gap-4">
                                <span>
                                    Current <span className="text-slate-100">{shadowLabel}</span>
                                </span>
                                <span>
                                    Threshold <span className="text-slate-100">{shadowThreshold.toFixed(2)}×</span>
                                </span>
                            </div>
                            <div className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-slate-300/70">{madhabLabel}</div>
                        </div>
                    </div>

                    {daylightSpan.length > 0 ? (
                        <div className="pointer-events-none absolute right-6 top-6 max-w-xs rounded-2xl bg-black/35 px-5 py-3 text-xs text-slate-100 backdrop-blur">
                            <div className="font-semibold uppercase tracking-wide text-slate-200">Prayer alignments</div>
                            <ul className="mt-2 space-y-1 text-[0.75rem] text-slate-200/80">
                                {daylightSpan.map((marker) => (
                                    <li className="flex items-center justify-between gap-3" key={marker.event}>
                                        <span className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex h-2.5 w-2.5 rounded-full ${marker.isPast ? 'bg-slate-400/70' : 'bg-emerald-300/90'} ${marker.isFard ? 'shadow-[0_0_0_3px_rgba(16,185,129,0.25)]' : ''}`}
                                            />
                                            <span className="text-slate-100">{marker.label}</span>
                                        </span>
                                        <span className="tabular-nums text-slate-200/70">{marker.timeLabel}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <div className="pointer-events-none absolute bottom-6 right-6 rounded-2xl bg-black/35 px-5 py-3 text-xs text-slate-100 backdrop-blur">
                        <div className="font-semibold uppercase tracking-wide text-slate-200">Telemetry</div>
                        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.75rem] text-slate-200/80">
                            <span className="text-slate-400">Sun altitude</span>
                            <span className="text-right text-slate-100">{altitudeLabel}</span>
                            <span className="text-slate-400">Sun azimuth</span>
                            <span className="text-right text-slate-100">{azimuthLabel}</span>
                            <span className="text-slate-400">Shadow ratio</span>
                            <span className="text-right text-slate-100">{shadowLabel}</span>
                            <span className="text-slate-400">Asr threshold</span>
                            <span className="text-right text-slate-100">{shadowThreshold.toFixed(2)}×</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

SunStage.displayName = 'SunStage';
