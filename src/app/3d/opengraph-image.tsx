import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Salat10 3D Solar View';
export const size = { height: 630, width: 1200 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        <div
            style={{
                alignItems: 'center',
                background:
                    'linear-gradient(180deg, #020617 0%, #0f172a 40%, #2563eb 70%, #facc15 100%)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'center',
                width: '100%',
            }}
        >
            <div
                style={{
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    padding: '72px 96px',
                }}
            >
                <div style={{ color: '#facc15', fontSize: 64, fontWeight: 600 }}>☀️ 3D Solar Prayer View</div>
                <div style={{ color: '#e2e8f0', fontSize: 32, textAlign: 'center', maxWidth: 720 }}>
                    Track the sun&apos;s altitude, azimuth, and Asr shadow thresholds in real-time.
                </div>
                <div style={{ color: '#cbd5f5', fontSize: 28, textAlign: 'center' }}>
                    Visual guidance for both Shāfiʿī (1×) and Ḥanafī (2×) conventions
                </div>
            </div>
        </div>,
        { ...size },
    );
}
