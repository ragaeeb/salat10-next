import { describe, expect, it, spyOn } from 'bun:test';
import { render } from '@testing-library/react';
import type { ExplanationStep } from '@/lib/explanation/types';
import { MultiStepLoader } from './multi-step-loader';

describe('MultiStepLoader', () => {
    it('renders duplicate detail text without duplicate sibling keys', () => {
        const consoleError = spyOn(console, 'error').mockImplementation(() => {});
        const step: ExplanationStep = {
            details: ['The same detail', 'The same detail'],
            id: 'duplicate-details',
            summary: 'A step with duplicate details',
            title: 'Duplicate details',
        };

        try {
            const { getAllByText } = render(<MultiStepLoader open steps={[step]} />);

            expect(getAllByText('The same detail')).toHaveLength(2);
            expect(consoleError.mock.calls.some(([message]) => String(message).includes('same key'))).toBe(false);
        } finally {
            consoleError.mockRestore();
        }
    });
});
