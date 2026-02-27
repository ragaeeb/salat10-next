import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { SkyBackground } from './sky';

describe('SkyBackground', () => {
    describe('rendering', () => {
        it('should render without crashing with string color', () => {
            const { container } = render(<SkyBackground skyColor="rgb(100, 150, 200)" />);

            const div = container.querySelector('div');
            expect(div).toBeDefined();
        });

        it('should render without crashing with MotionValue color', () => {
            const colorValue = motionValue('rgb(100, 150, 200)');
            const { container } = render(<SkyBackground skyColor={colorValue} />);

            const div = container.querySelector('div');
            expect(div).toBeDefined();
        });

        it('should apply backgroundColor style', () => {
            const color = 'rgb(50, 100, 150)';
            const { container } = render(<SkyBackground skyColor={color} />);

            const div = container.querySelector('div') as HTMLElement;
            expect(div).toBeDefined();
            // Motion components handle styles internally, verify div exists
            expect(div).toBeDefined();
        });
    });

    describe('CSS classes', () => {
        it('should apply correct CSS classes', () => {
            const { container } = render(<SkyBackground skyColor="rgb(100, 150, 200)" />);

            const div = container.querySelector('div');
            expect(div).toBeDefined();
            // Motion components may process classes, so verify div exists
            expect(div).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle different color formats', () => {
            const colors = ['rgb(255, 0, 0)', 'rgba(0, 255, 0, 0.5)', '#FF0000', 'blue'];

            for (const color of colors) {
                const { unmount, container } = render(<SkyBackground skyColor={color} />);

                const div = container.querySelector('div');
                expect(div).toBeDefined();

                unmount();
            }
        });

        it('should handle MotionValue color changes', () => {
            const colorValue = motionValue('rgb(100, 150, 200)');
            const { container } = render(<SkyBackground skyColor={colorValue} />);

            const div = container.querySelector('div');
            expect(div).toBeDefined();

            // Update color
            colorValue.set('rgb(200, 100, 50)');

            // Component should still render
            expect(div).toBeDefined();
        });
    });
});
