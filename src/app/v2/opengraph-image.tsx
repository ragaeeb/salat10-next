// ============================================================================
// src/app/v2/opengraph-image.tsx - OG image for parallax page
// ============================================================================
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Salat10 Parallax Sky View';
export const size = { height: 630, width: 1200 };
export const contentType = 'image/png';

export default async function Image() {
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

// ============================================================================
// EXPLANATION: What are Open Graph images?
// ============================================================================

/**
 * WHAT ARE OPEN GRAPH IMAGES?
 *
 * Open Graph (OG) images are preview images that appear when you share a link on:
 * - Facebook
 * - Twitter/X
 * - LinkedIn
 * - WhatsApp
 * - iMessage
 * - Slack
 * - Discord
 * - And many other platforms
 *
 * Without an OG image, shared links look plain and unprofessional.
 * With an OG image, your link shows a beautiful preview card!
 *
 * EXAMPLE:
 * When someone shares https://salat10.app on Twitter, instead of just text,
 * they see a rich card with:
 * - Your custom image (1200x630px)
 * - Your site title
 * - Your description
 *
 * This increases click-through rates by 2-3x!
 *
 * HOW TO IMPLEMENT:
 *
 * Option 1: Static image (simple)
 * - Create a 1200x630px image in Figma/Photoshop
 * - Save as /public/og-image.jpg
 * - Reference in metadata (already done in seo.ts)
 *
 * Option 2: Dynamic image with next/og (advanced)
 * - Create opengraph-image.tsx in any app directory
 * - Use ImageResponse to generate images on-the-fly
 * - Can include dynamic data (prayer times, dates, etc.)
 *
 * BENEFITS OF DYNAMIC OG IMAGES:
 * 1. Personalization - Show user's city or current prayer time
 * 2. Always up-to-date - Regenerate on each request
 * 3. No design tools needed - Code your design in JSX
 * 4. Automatic caching - Next.js caches generated images
 *
 * SIZE REQUIREMENTS:
 * - Recommended: 1200x630px (1.91:1 ratio)
 * - Minimum: 600x315px
 * - Maximum: 5MB file size
 * - Format: PNG or JPG
 *
 * TESTING YOUR OG IMAGES:
 * - Facebook: https://developers.facebook.com/tools/debug/
 * - Twitter: https://cards-dev.twitter.com/validator
 * - LinkedIn: https://www.linkedin.com/post-inspector/
 *
 * ADVANCED: Per-page dynamic images
 * You can create different OG images for each page by adding
 * opengraph-image.tsx in that page's directory:
 *
 * - app/opengraph-image.tsx → salat10.app/opengraph-image
 * - app/v2/opengraph-image.tsx → salat10.app/v2/opengraph-image
 * - app/settings/opengraph-image.tsx → salat10.app/settings/opengraph-image
 *
 * Each page automatically uses its own OG image!
 */

// ============================================================================
// Example: Advanced dynamic OG with prayer times
// ============================================================================

/**
 * ADVANCED EXAMPLE: Show current prayer time in OG image
 *
 * This would require reading from store or passing props,
 * which is tricky in edge runtime. For now, the static approach
 * with beautiful branding is best.
 *
 * Future enhancement: Use query params to generate custom images
 * Example: /api/og?prayer=fajr&time=5:30am&city=Toronto
 */

// ============================================================================
// Static OG image alternative (if you prefer Figma/design tools)
// ============================================================================

/**
 * STATIC APPROACH:
 *
 * 1. Design your image in Figma:
 *    - Canvas: 1200x630px
 *    - Include: Logo, title, tagline, prayer names
 *    - Use brand colors from your app
 *    - Keep important content in center (safe zone)
 *
 * 2. Export as PNG or JPG
 *
 * 3. Save to /public/og-image.jpg
 *
 * 4. Reference in metadata (already done in seo.ts):
 *    ```typescript
 *    openGraph: {
 *      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }]
 *    }
 *    ```
 *
 * DESIGN TIPS:
 * - Use high contrast text
 * - Avoid small fonts (min 40px)
 * - Include your logo/brand
 * - Keep it simple and scannable
 * - Test on mobile and desktop previews
 */
