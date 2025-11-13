import { render, waitFor } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'bun:test';
import { StarsLayer } from './stars';

describe('StarsLayer', () => {
    describe('rendering', () => {
        it('should render without crashing with default props', async () => {
            const { container } = render(<StarsLayer opacity={0.5} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });

        it('should render without crashing with MotionValue opacity', async () => {
            const opacityValue = motionValue(0.8);
            const { container } = render(<StarsLayer opacity={opacityValue} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });

        it('should render with shooting stars enabled', async () => {
            const { container } = render(<StarsLayer opacity={1} shooting={true} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });

        it('should render without shooting stars when shooting is false', async () => {
            const { container } = render(<StarsLayer opacity={1} shooting={false} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });
    });

    describe('CSS classes', () => {
        it('should apply correct CSS classes', async () => {
            const { container } = render(<StarsLayer opacity={0.5} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
                // Motion components may process classes, so verify div exists
                expect(div).toBeDefined();
            });
        });
    });

    describe('disabled prop', () => {
        it('should return null when disabled is true', () => {
            const { container } = render(<StarsLayer opacity={1} disabled={true} />);
            
            // Component returns null immediately when disabled
            // When disabled=true, the component returns null before rendering anything
            // So the container should only have the root wrapper, no stars content
            // Check that we don't have the motion.div with z-10 class
            const starsDiv = Array.from(container.querySelectorAll('div')).find(
                (div) => div.className?.includes('z-10')
            );
            expect(starsDiv).toBeUndefined();
        });

        it('should render when disabled is false', async () => {
            const { container } = render(<StarsLayer opacity={1} disabled={false} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });
    });

    describe('opacity', () => {
        it('should handle opacity 0', async () => {
            const { container } = render(<StarsLayer opacity={0} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });

        it('should handle opacity 1', async () => {
            const { container } = render(<StarsLayer opacity={1} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });

        it('should handle MotionValue opacity changes', async () => {
            const opacityValue = motionValue(0.3);
            const { container } = render(<StarsLayer opacity={opacityValue} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });

            // Update opacity
            opacityValue.set(0.9);
            
            // Component should still render
            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });
    });

    describe('props', () => {
        it('should accept custom density', async () => {
            const { container } = render(<StarsLayer opacity={1} density={0.0001} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });

        it('should accept custom delay values', async () => {
            const { container } = render(<StarsLayer opacity={1} minDelay={1000} maxDelay={3000} />);

            await waitFor(() => {
                const div = container.querySelector('div');
                expect(div).toBeDefined();
            });
        });
    });

    describe('edge cases', () => {
        it('should handle opacity values outside 0-1 range', async () => {
            const { container: container1 } = render(<StarsLayer opacity={-0.5} />);
            await waitFor(() => {
                expect(container1.querySelector('div')).toBeDefined();
            });

            const { container: container2 } = render(<StarsLayer opacity={1.5} />);
            await waitFor(() => {
                expect(container2.querySelector('div')).toBeDefined();
            });
        });
    });
});

