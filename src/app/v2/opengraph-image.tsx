import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Salat10 Parallax Sky View';
export const size = { height: 630, width: 1200 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        <div
            style={{
                alignItems: 'center',
                background: 'linear-gradient(to bottom, #1e3a8a, #7c3aed, #f59e0b, #f97316)',
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
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '80px',
                }}
            >
                <div
                    style={{
                        color: '#ffffff',
                        fontSize: 70,
                        fontWeight: 'bold',
                        marginBottom: 20,
                        textAlign: 'center',
                    }}
                >
                    🌅 Parallax Sky View
                </div>
                <div style={{ color: '#e2e8f0', fontSize: 32, marginBottom: 30, textAlign: 'center' }}>
                    Watch the sun and moon move through a dynamic sky
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 24, textAlign: 'center' }}>
                    An immersive way to experience prayer times
                </div>
            </div>
        </div>,
        { ...size },
    );
}
