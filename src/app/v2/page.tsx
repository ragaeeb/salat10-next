import type { Metadata } from 'next';
import { parallaxMetadata } from '@/config/seo';
import { ParallaxClient } from './client';

export const metadata: Metadata = parallaxMetadata;

export default function ParallaxPage() {
    return <ParallaxClient />;
}
