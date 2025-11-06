import { memo } from 'react';

export const RadialGradientOverlay = memo(() => (
    <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)]" />
));
RadialGradientOverlay.displayName = 'RadialGradientOverlay';
