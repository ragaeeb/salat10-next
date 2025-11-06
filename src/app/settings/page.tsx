import { settingsMetadata } from '@/config/seo';
import { SettingsClient } from './client';

export const metadata = settingsMetadata;

export default function SettingsPage() {
    return <SettingsClient />;
}
