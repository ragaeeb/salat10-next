import type { Metadata } from 'next';
import { solar3DMetadata } from '@/config/seo';
import { SolarSkyClient } from './client';

export const metadata: Metadata = solar3DMetadata;

export default function SolarSkyPage() {
    return <SolarSkyClient />;
}
