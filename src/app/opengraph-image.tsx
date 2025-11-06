// ============================================================================
// src/app/opengraph-image.tsx - Dynamic OG image for home page
// ============================================================================
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Salat10 - Islamic Prayer Times';
export const size = { height: 630, width: 1200 };
export const contentType = 'image/png';

/**
 * Generate Open Graph image dynamically
 * This creates a beautiful card that shows when sharing on social media
 */
export default async function Image() {
    return new ImageResponse(
        <div
            style={{
                alignItems: 'center',
                backgroundColor: '#0f172a',
                backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'center',
                width: '100%',
            }}
        >
            {/* Main content */}
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '80px',
                }}
            >
                {/* Title */}
                <div
                    style={{
                        background: 'linear-gradient(to bottom right, #ffffff, #94a3b8)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        fontSize: 80,
                        fontWeight: 'bold',
                        marginBottom: 20,
                    }}
                >
                    Salat10
                </div>

                {/* Subtitle */}
                <div style={{ color: '#cbd5e1', fontSize: 32, marginBottom: 40, textAlign: 'center' }}>
                    Accurate Islamic Prayer Times
                </div>

                {/* Feature badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
                    {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                        <div
                            key={prayer}
                            style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '2px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: 12,
                                color: '#93c5fd',
                                fontSize: 24,
                                fontWeight: 600,
                                padding: '12px 24px',
                            }}
                        >
                            {prayer}
                        </div>
                    ))}
                </div>

                {/* Bottom text */}
                <div style={{ color: '#64748b', fontSize: 20, marginTop: 60 }}>
                    Beautiful visualizations • Accurate calculations • Free & open source
                </div>
            </div>
        </div>,
        { ...size },
    );
}
