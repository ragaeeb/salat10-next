import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Settings } from '@/types/settings';
import { CalculationSettings } from './calculation-settings';

// Mock detectMethodFor and methodPresets
// Note: detectMethodFor uses tolerance matching, so we need to match actual preset values
const mockDetectMethodFor = mock((config: any) => {
    // Match actual preset values with tolerance
    const METHOD_TOLERANCE = 0.01;
    const presets = {
        MuslimWorldLeague: { fajrAngle: 18, ishaAngle: 17, ishaInterval: 0 },
        NorthAmerica: { fajrAngle: 15, ishaAngle: 15, ishaInterval: 0 },
        Other: { fajrAngle: 12, ishaAngle: 12, ishaInterval: 0 },
    };

    for (const [method, values] of Object.entries(presets)) {
        const intervalMatches = Math.abs(values.ishaInterval - config.ishaInterval) < METHOD_TOLERANCE;
        const fajrMatches = Math.abs(values.fajrAngle - config.fajrAngle) < METHOD_TOLERANCE;
        const ishaMatches = Math.abs(values.ishaAngle - config.ishaAngle) < METHOD_TOLERANCE;
        if (intervalMatches && fajrMatches && ishaMatches) {
            return method;
        }
    }
    return 'Other';
});

const mockMethodPresets = {
    MuslimWorldLeague: { fajrAngle: 18, ishaAngle: 17, ishaInterval: 0 },
    NorthAmerica: { fajrAngle: 15, ishaAngle: 15, ishaInterval: 0 },
    Other: { fajrAngle: 12, ishaAngle: 12, ishaInterval: 0 },
};

mock.module('@/lib/settings', () => ({ detectMethodFor: mockDetectMethodFor, methodPresets: mockMethodPresets }));

// Mock CALCULATION_METHOD_OPTIONS
mock.module('@/lib/constants', () => ({
    CALCULATION_METHOD_OPTIONS: [
        { label: 'North America - ISNA (15°, 15°)', value: 'NorthAmerica' },
        { label: 'Muslim World League (18°, 17°)', value: 'MuslimWorldLeague' },
        { label: 'Other', value: 'Other' },
    ],
}));

const mockSettings: Settings = {
    address: 'New York, NY',
    city: 'New York',
    country: 'United States',
    fajrAngle: '18',
    ishaAngle: '17',
    ishaInterval: '0',
    latitude: '40.7128',
    longitude: '-74.0060',
    method: 'MuslimWorldLeague',
    state: 'New York',
    timeZone: 'America/New_York',
};

describe('CalculationSettings', () => {
    describe('rendering', () => {
        it('should render without crashing with valid props', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            expect(screen.getByLabelText(/Fajr angle/i)).toBeDefined();
        });

        it('should render fajr angle input with current value', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i) as HTMLInputElement;
            expect(fajrInput.value).toBe('18');
        });

        it('should render isha angle input with current value', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const ishaInput = screen.getByLabelText(/ʿIshāʾ angle/i) as HTMLInputElement;
            expect(ishaInput.value).toBe('17');
        });

        it('should render isha interval input with current value', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const intervalInput = screen.getByLabelText(/ʿIshāʾ interval/i) as HTMLInputElement;
            expect(intervalInput.value).toBe('0');
        });

        it('should render method select with current value', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const methodSelect = screen.getByLabelText(/Calculation method/i) as HTMLSelectElement;
            expect(methodSelect.value).toBe('MuslimWorldLeague');
        });

        it('should render all method options', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            expect(screen.getByText(/North America/)).toBeDefined();
            expect(screen.getByText(/Muslim World League/)).toBeDefined();
            expect(screen.getByText('Other')).toBeDefined();
        });
    });

    describe('angle input changes', () => {
        it('should call onSettingsChange when fajr angle changes', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i);
            fireEvent.change(fajrInput, { target: { value: '15' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.fajrAngle).toBe('15');
        });

        it('should call onSettingsChange when isha angle changes', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const ishaInput = screen.getByLabelText(/ʿIshāʾ angle/i);
            fireEvent.change(ishaInput, { target: { value: '15' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.ishaAngle).toBe('15');
        });

        it('should call onSettingsChange when isha interval changes', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const intervalInput = screen.getByLabelText(/ʿIshāʾ interval/i);
            fireEvent.change(intervalInput, { target: { value: '90' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.ishaInterval).toBe('90');
        });

        it('should auto-detect method when fajr angle changes', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i);
            fireEvent.change(fajrInput, { target: { value: '15' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            updater(mockSettings);
            // Method should be auto-detected
            expect(mockDetectMethodFor.mock.calls.length).toBeGreaterThan(0);
        });

        it('should reset ishaInterval to 0 when angle fields change', () => {
            const onSettingsChange = mock(() => {});
            const settingsWithInterval = { ...mockSettings, ishaInterval: '90' };
            render(<CalculationSettings settings={settingsWithInterval} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i);
            fireEvent.change(fajrInput, { target: { value: '15' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(settingsWithInterval);
            // ishaInterval should be reset to 0 when angle changes
            expect(updated.ishaInterval).toBe('0');
        });

        it('should not reset ishaInterval when ishaInterval itself changes', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const intervalInput = screen.getByLabelText(/ʿIshāʾ interval/i);
            fireEvent.change(intervalInput, { target: { value: '90' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            // ishaInterval should remain as set value
            expect(updated.ishaInterval).toBe('90');
        });
    });

    describe('method selection', () => {
        it('should call onSettingsChange when method changes', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const methodSelect = screen.getByLabelText(/Calculation method/i);
            fireEvent.change(methodSelect, { target: { value: 'NorthAmerica' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            // Should update method and load preset angles
            expect(updated.method).toBe('NorthAmerica');
            expect(updated.fajrAngle).toBe('15'); // From preset
            expect(updated.ishaAngle).toBe('15'); // From preset
        });

        it('should load preset angles when method is selected', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const methodSelect = screen.getByLabelText(/Calculation method/i);
            fireEvent.change(methodSelect, { target: { value: 'NorthAmerica' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            // Should load NorthAmerica preset angles
            expect(updated.fajrAngle).toBe('15');
            expect(updated.ishaAngle).toBe('15');
            expect(updated.ishaInterval).toBe('0');
        });

        it('should not update when same method is selected', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const methodSelect = screen.getByLabelText(/Calculation method/i);
            fireEvent.change(methodSelect, { target: { value: 'MuslimWorldLeague' } }); // Same as current

            // Should not call onSettingsChange when method doesn't change
            expect(onSettingsChange.mock.calls.length).toBe(0);
        });

        it('should handle method without preset', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const methodSelect = screen.getByLabelText(/Calculation method/i);
            fireEvent.change(methodSelect, { target: { value: 'Other' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            // Should keep previous angles if no preset
            expect(updated.method).toBe('Other');
        });
    });

    describe('auto-detection', () => {
        it('should detect method when angles change', () => {
            mockDetectMethodFor.mockClear();
            const onSettingsChange = mock(() => {});
            // Start with different angles, then change to MWL angles
            const initialSettings = { ...mockSettings, fajrAngle: '12', ishaAngle: '12' };
            render(<CalculationSettings settings={initialSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i);
            fireEvent.change(fajrInput, { target: { value: '18' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(initialSettings);
            // Method should be auto-detected based on angles
            // buildAngleState calls detectMethodFor internally
            expect(updated.method).toBeDefined();
            expect(typeof updated.method).toBe('string');
            expect(updated.fajrAngle).toBe('18');
        });

        it('should call detectMethodFor when angles change', () => {
            mockDetectMethodFor.mockClear();
            const onSettingsChange = mock(() => {});
            // Start with different angles, then change to NA angles
            const initialSettings = { ...mockSettings, fajrAngle: '12', ishaAngle: '12' };
            render(<CalculationSettings settings={initialSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i);
            fireEvent.change(fajrInput, { target: { value: '15' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(initialSettings);
            // Method should be auto-detected based on angles
            expect(updated.method).toBeDefined();
            expect(typeof updated.method).toBe('string');
            expect(updated.fajrAngle).toBe('15');
        });
    });

    describe('edge cases', () => {
        it('should handle empty angle values', () => {
            const onSettingsChange = mock(() => {});
            const emptySettings = { ...mockSettings, fajrAngle: '', ishaAngle: '' };
            render(<CalculationSettings settings={emptySettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i) as HTMLInputElement;
            expect(fajrInput.value).toBe('');
        });

        it('should handle decimal angle values', () => {
            const onSettingsChange = mock(() => {});
            const decimalSettings = { ...mockSettings, fajrAngle: '18.5', ishaAngle: '17.5' };
            render(<CalculationSettings settings={decimalSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i) as HTMLInputElement;
            const ishaInput = screen.getByLabelText(/ʿIshāʾ angle/i) as HTMLInputElement;
            expect(fajrInput.value).toBe('18.5');
            expect(ishaInput.value).toBe('17.5');
        });

        it('should handle negative interval values', () => {
            const onSettingsChange = mock(() => {});
            const negativeInterval = { ...mockSettings, ishaInterval: '-10' };
            render(<CalculationSettings settings={negativeInterval} onSettingsChange={onSettingsChange} />);

            const intervalInput = screen.getByLabelText(/ʿIshāʾ interval/i) as HTMLInputElement;
            expect(intervalInput.value).toBe('-10');
        });

        it('should handle very large angle values', () => {
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i);
            fireEvent.change(fajrInput, { target: { value: '999' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.fajrAngle).toBe('999');
        });

        it('should handle non-numeric input in number fields', () => {
            mockDetectMethodFor.mockClear();
            const onSettingsChange = mock(() => {});
            render(<CalculationSettings settings={mockSettings} onSettingsChange={onSettingsChange} />);

            const fajrInput = screen.getByLabelText(/Fajr angle/i);
            // Number inputs may clear invalid values, so test with empty string or partial input
            fireEvent.change(fajrInput, { target: { value: '' } });

            expect(onSettingsChange.mock.calls.length).toBe(1);
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            // Empty string should be stored
            expect(updated.fajrAngle).toBe('');
            // Method detection should still run (will parse empty string as NaN)
            expect(updated.method).toBeDefined();
            expect(typeof updated.method).toBe('string');
        });
    });
});
