import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render } from '@testing-library/react';
import type { Timeline } from '@/types/timeline';
import { CelestialDevScrubber } from './celestial-dev-scrubber';

const mockTimeline: Timeline = {
    asr: 0.6,
    dhuhr: 0.4,
    end: 1,
    fajr: 0,
    isha: 0.85,
    lastThird: 0.95,
    maghrib: 0.75,
    midNight: 0.9,
    sunrise: 0.15,
};

describe('CelestialDevScrubber', () => {
    it('should render the toggle button initially', () => {
        const { getByLabelText } = render(
            <CelestialDevScrubber
                isForegroundVisible={true}
                isSimulating={false}
                lunarCycle={0.5}
                onResetToLive={() => {}}
                onSetForegroundVisible={() => {}}
                onSetLunarCycle={() => {}}
                onSetSimulatedProgress={() => {}}
                progress={0.45}
                simulatedLunarCycle={null}
                timeline={mockTimeline}
            />,
        );

        expect(getByLabelText('Open Dev Scrubber')).toBeDefined();
    });

    it('should open the scrubber panel when clicked', () => {
        const { getByLabelText } = render(
            <CelestialDevScrubber
                isForegroundVisible={true}
                isSimulating={false}
                lunarCycle={0.5}
                onResetToLive={() => {}}
                onSetForegroundVisible={() => {}}
                onSetLunarCycle={() => {}}
                onSetSimulatedProgress={() => {}}
                progress={0.45}
                simulatedLunarCycle={null}
                timeline={mockTimeline}
            />,
        );

        fireEvent.click(getByLabelText('Open Dev Scrubber'));

        expect(getByLabelText('Time of Day Mode')).toBeDefined();
        expect(getByLabelText('Lunar Phase Mode')).toBeDefined();
        expect(getByLabelText('Time trajectory slider')).toBeDefined();

        fireEvent.click(getByLabelText('Lunar Phase Mode'));
        expect(getByLabelText('Lunar phase slider')).toBeDefined();
    });

    it('should trigger onSetForegroundVisible when toggle button is clicked', () => {
        const onSetForegroundVisible = mock(() => {});

        const { getByLabelText } = render(
            <CelestialDevScrubber
                isForegroundVisible={true}
                isSimulating={false}
                lunarCycle={0.5}
                onResetToLive={() => {}}
                onSetForegroundVisible={onSetForegroundVisible}
                onSetLunarCycle={() => {}}
                onSetSimulatedProgress={() => {}}
                progress={0.45}
                simulatedLunarCycle={null}
                timeline={mockTimeline}
            />,
        );

        fireEvent.click(getByLabelText('Open Dev Scrubber'));

        const toggleBtn = getByLabelText('Hide Cards');
        fireEvent.click(toggleBtn);
        expect(onSetForegroundVisible).toHaveBeenCalledWith(false);
    });

    it('should trigger onResetToLive when reset button is clicked', () => {
        const onResetToLive = mock(() => {});

        const { getByLabelText } = render(
            <CelestialDevScrubber
                isForegroundVisible={true}
                isSimulating={true}
                lunarCycle={0.5}
                onResetToLive={onResetToLive}
                onSetForegroundVisible={() => {}}
                onSetLunarCycle={() => {}}
                onSetSimulatedProgress={() => {}}
                progress={0.75}
                simulatedLunarCycle={null}
                timeline={mockTimeline}
            />,
        );

        fireEvent.click(getByLabelText('Open Dev Scrubber'));

        const resetBtn = getByLabelText('Reset to Live Clock');
        fireEvent.click(resetBtn);
        expect(onResetToLive).toHaveBeenCalled();
    });
});
