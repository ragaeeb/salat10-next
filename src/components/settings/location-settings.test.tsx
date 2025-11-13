import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Settings } from '@/types/settings';
import { LocationSettings } from './location-settings';

// Mock toast
const mockToastSuccess = mock(() => {});
const mockToastError = mock(() => {});

mock.module('sonner', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

// Mock TimezoneCombobox
mock.module('@/components/timezone-combobox', () => ({
    TimezoneCombobox: ({
        value,
        onChange,
        ariaLabelledBy,
    }: {
        value: string;
        onChange: (zone: string) => void;
        ariaLabelledBy?: string;
    }) => (
        <select
            data-testid="timezone-combobox"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-labelledby={ariaLabelledBy}
        >
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
        </select>
    ),
}));

// Mock global fetch
const mockFetch = mock(() =>
    Promise.resolve({
        json: () =>
            Promise.resolve({
                city: 'New York',
                country: 'United States',
                label: 'New York, NY',
                latitude: 40.7128,
                longitude: -74.006,
                state: 'New York',
                timeZone: 'America/New_York',
            }),
        ok: true,
    }),
);

// Suppress console logs during tests
let consoleLogSpy: ReturnType<typeof spyOn>;
let consoleErrorSpy: ReturnType<typeof spyOn>;
let consoleWarnSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
    global.fetch = mockFetch as any;
    mockFetch.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    
    // Spy on console methods to suppress output
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {});

    // Mock navigator.geolocation
    Object.defineProperty(global, 'navigator', {
        configurable: true,
        value: {
            geolocation: {
                getCurrentPosition: mock((success: any, error: any) => {
                    // Default to success
                    success({ coords: { latitude: 43.6532, longitude: -79.3832 } });
                }),
            },
        },
        writable: true,
    });
});

afterEach(() => {
    mockFetch.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
});

const mockSettings: Settings = {
    address: 'New York, NY',
    city: 'New York',
    country: 'United States',
    fajrAngle: '18',
    ishaAngle: '17',
    ishaInterval: '0',
    latitude: '40.7128',
    longitude: '-74.0060',
    method: 'NorthAmerica',
    state: 'New York',
    timeZone: 'America/New_York',
    userId: '',
};

describe('LocationSettings', () => {
    describe('rendering', () => {
        it('should render without crashing with valid props', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            expect(screen.getByPlaceholderText('City, country')).toBeDefined();
        });

        it('should render address input with current value', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const addressInput = screen.getByPlaceholderText('City, country') as HTMLInputElement;
            expect(addressInput.value).toBe('New York, NY');
        });

        it('should render latitude and longitude inputs', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const latInput = screen.getByPlaceholderText('45.3506') as HTMLInputElement;
            const lonInput = screen.getByPlaceholderText('-75.7930') as HTMLInputElement;
            expect(latInput.value).toBe('40.7128');
            expect(lonInput.value).toBe('-74.0060');
        });

        it('should render timezone combobox', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const timezoneSelect = screen.getByTestId('timezone-combobox') as HTMLSelectElement;
            expect(timezoneSelect.value).toBe('America/New_York');
        });

        it('should render geocoding button', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            expect(screen.getByText('Auto-fill coordinates')).toBeDefined();
        });

        it('should render browser location button', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            expect(screen.getByText('Use my current location')).toBeDefined();
        });
    });

    describe('input field changes', () => {
        it('should call onFieldChange when address input changes', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const addressInput = screen.getByPlaceholderText('City, country');
            fireEvent.change(addressInput, { target: { value: 'Toronto, ON' } });

            expect(onFieldChange.mock.calls.length).toBe(1);
            expect(onFieldChange.mock.calls[0]![0]).toBe('address');
            expect(onFieldChange.mock.calls[0]![1]).toBe('Toronto, ON');
        });

        it('should call onFieldChange when latitude input changes', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const latInput = screen.getByPlaceholderText('45.3506');
            fireEvent.change(latInput, { target: { value: '43.6532' } });

            expect(onFieldChange.mock.calls.length).toBe(1);
            expect(onFieldChange.mock.calls[0]![0]).toBe('latitude');
            expect(onFieldChange.mock.calls[0]![1]).toBe('43.6532');
        });

        it('should call onFieldChange when longitude input changes', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const lonInput = screen.getByPlaceholderText('-75.7930');
            fireEvent.change(lonInput, { target: { value: '-79.3832' } });

            expect(onFieldChange.mock.calls.length).toBe(1);
            expect(onFieldChange.mock.calls[0]![0]).toBe('longitude');
            expect(onFieldChange.mock.calls[0]![1]).toBe('-79.3832');
        });

        it('should call onFieldChange when timezone changes', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const timezoneSelect = screen.getByTestId('timezone-combobox');
            fireEvent.change(timezoneSelect, { target: { value: 'America/Los_Angeles' } });

            expect(onFieldChange.mock.calls.length).toBe(1);
            expect(onFieldChange.mock.calls[0]![0]).toBe('timeZone');
            expect(onFieldChange.mock.calls[0]![1]).toBe('America/Los_Angeles');
        });
    });

    describe('geocoding functionality', () => {
        it('should call geocoding API when button is clicked', async () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(mockFetch.mock.calls.length).toBe(1);
            });

            const fetchCall = mockFetch.mock.calls[0]![0] as string;
            expect(fetchCall).toContain('/api/geocode');
            expect(fetchCall).toContain('address=');
        });

        it('should update settings with geocoding results', async () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(onSettingsChange.mock.calls.length).toBe(1);
            });

            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.latitude).toBe('40.7128');
            expect(updated.longitude).toBe('-74.0060');
            expect(updated.address).toBe('New York, NY');
            expect(updated.timeZone).toBe('America/New_York');
        });

        it('should update location metadata when available', async () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(onSettingsChange.mock.calls.length).toBe(1);
            });

            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.city).toBe('New York');
            expect(updated.state).toBe('New York');
            expect(updated.country).toBe('United States');
        });

        it('should show success toast on successful geocoding', async () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(mockToastSuccess.mock.calls.length).toBe(1);
            });

            expect(mockToastSuccess.mock.calls[0]![0]).toContain('Found coordinates');
        });

        it('should show error toast when address is empty', async () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            const emptySettings = { ...mockSettings, address: '' };
            render(
                <LocationSettings
                    settings={emptySettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(mockToastError.mock.calls.length).toBe(1);
            });

            expect(mockToastError.mock.calls[0]![0]).toContain('Please enter an address');
        });

        it('should show error toast on geocoding API failure', async () => {
            mockFetch.mockResolvedValueOnce({
                json: () => Promise.resolve({ error: 'Geocoding failed' }),
                ok: false,
            } as Response);

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(mockToastError.mock.calls.length).toBe(1);
            });

            expect(mockToastError.mock.calls[0]![0]).toContain('Unable to look up');
        });

        it('should show loading state during geocoding', async () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            // Button should show loading state
            await waitFor(() => {
                expect(screen.getByText('Looking up…')).toBeDefined();
            });
        });

        it('should handle invalid coordinates from API', async () => {
            mockFetch.mockResolvedValueOnce({
                json: () => Promise.resolve({ latitude: 'invalid', longitude: 'invalid' }),
                ok: true,
            } as Response);

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(mockToastError.mock.calls.length).toBe(1);
            });
        });
    });

    describe('browser geolocation', () => {
        it('should request browser location when button is clicked', () => {
            const mockGetCurrentPosition = mock((success: any) => {
                success({ coords: { latitude: 43.6532, longitude: -79.3832 } });
            });

            Object.defineProperty(global, 'navigator', {
                configurable: true,
                value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
                writable: true,
            });

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const locationButton = screen.getByText('Use my current location');
            fireEvent.click(locationButton);

            expect(mockGetCurrentPosition.mock.calls.length).toBe(1);
        });

        it('should update settings with browser location', async () => {
            const mockGetCurrentPosition = mock((success: any) => {
                success({ coords: { latitude: 43.6532, longitude: -79.3832 } });
            });

            Object.defineProperty(global, 'navigator', {
                configurable: true,
                value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
                writable: true,
            });

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const locationButton = screen.getByText('Use my current location');
            fireEvent.click(locationButton);

            await waitFor(() => {
                expect(onSettingsChange.mock.calls.length).toBe(1);
            });

            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.latitude).toBe('43.6532');
            expect(updated.longitude).toBe('-79.3832');
        });

        it('should show error when geolocation is not supported', () => {
            Object.defineProperty(global, 'navigator', { configurable: true, value: {}, writable: true });

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const locationButton = screen.getByText('Use my current location');
            fireEvent.click(locationButton);

            expect(mockToastError.mock.calls.length).toBe(1);
            expect(mockToastError.mock.calls[0]![0]).toContain('not supported');
        });

        it('should handle permission denied error', async () => {
            const mockGetCurrentPosition = mock((success: any, error: any) => {
                const geolocationError = {
                    code: 1, // PERMISSION_DENIED
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                };
                error(geolocationError);
            });

            Object.defineProperty(global, 'navigator', {
                configurable: true,
                value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
                writable: true,
            });

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const locationButton = screen.getByText('Use my current location');
            fireEvent.click(locationButton);

            await waitFor(() => {
                expect(mockToastError.mock.calls.length).toBe(1);
            });

            expect(mockToastError.mock.calls[0]![0]).toContain('denied');
        });

        it('should handle position unavailable error', async () => {
            const mockGetCurrentPosition = mock((success: any, error: any) => {
                const geolocationError = {
                    code: 2, // POSITION_UNAVAILABLE
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                };
                error(geolocationError);
            });

            Object.defineProperty(global, 'navigator', {
                configurable: true,
                value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
                writable: true,
            });

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const locationButton = screen.getByText('Use my current location');
            fireEvent.click(locationButton);

            await waitFor(() => {
                expect(mockToastError.mock.calls.length).toBe(1);
            });

            expect(mockToastError.mock.calls[0]![0]).toContain('unavailable');
        });

        it('should handle timeout error', async () => {
            const mockGetCurrentPosition = mock((success: any, error: any) => {
                const geolocationError = {
                    code: 3, // TIMEOUT
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                };
                error(geolocationError);
            });

            Object.defineProperty(global, 'navigator', {
                configurable: true,
                value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
                writable: true,
            });

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const locationButton = screen.getByText('Use my current location');
            fireEvent.click(locationButton);

            await waitFor(() => {
                expect(mockToastError.mock.calls.length).toBe(1);
            });

            expect(mockToastError.mock.calls[0]![0]).toContain('Timed out');
        });

        it('should show loading state during geolocation', async () => {
            const mockGetCurrentPosition = mock((success: any) => {
                setTimeout(() => {
                    success({ coords: { latitude: 43.6532, longitude: -79.3832 } });
                }, 100);
            });

            Object.defineProperty(global, 'navigator', {
                configurable: true,
                value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
                writable: true,
            });

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const locationButton = screen.getByText('Use my current location');
            fireEvent.click(locationButton);

            // Button should show loading state
            await waitFor(() => {
                expect(screen.getByText('Getting location…')).toBeDefined();
            });
        });
    });

    describe('edge cases', () => {
        it('should handle empty address', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            const emptySettings = { ...mockSettings, address: '' };
            render(
                <LocationSettings
                    settings={emptySettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const addressInput = screen.getByPlaceholderText('City, country') as HTMLInputElement;
            expect(addressInput.value).toBe('');
        });

        it('should handle empty coordinates', () => {
            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            const emptyCoords = { ...mockSettings, latitude: '', longitude: '' };
            render(
                <LocationSettings
                    settings={emptyCoords}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const latInput = screen.getByPlaceholderText('45.3506') as HTMLInputElement;
            const lonInput = screen.getByPlaceholderText('-75.7930') as HTMLInputElement;
            expect(latInput.value).toBe('');
            expect(lonInput.value).toBe('');
        });

        it('should handle geocoding with missing timeZone in response', async () => {
            mockFetch.mockResolvedValueOnce({
                json: () =>
                    Promise.resolve({
                        label: 'New York, NY',
                        latitude: 40.7128,
                        longitude: -74.006,
                        // No timeZone field
                    }),
                ok: true,
            } as Response);

            const onSettingsChange = mock(() => {});
            const onFieldChange = mock(() => {});
            render(
                <LocationSettings
                    settings={mockSettings}
                    onSettingsChange={onSettingsChange}
                    onFieldChange={onFieldChange}
                />,
            );

            const geocodeButton = screen.getByText('Auto-fill coordinates');
            fireEvent.click(geocodeButton);

            await waitFor(() => {
                expect(onSettingsChange.mock.calls.length).toBe(1);
            });

            // Should use browser timezone as fallback
            const updater = onSettingsChange.mock.calls[0]![0] as (prev: Settings) => Settings;
            const updated = updater(mockSettings);
            expect(updated.timeZone).toBeDefined();
        });
    });
});
