import { describe, test, expect, jest } from '@jest/globals';

import { alloc, trim, watch } from '@anireact/lewd';

describe('Resize', () => {
    test('Resize handler is triggered on shrink', () => {
        alloc(0x20000);

        let f = jest.fn();
        watch(f, global);

        trim();

        expect(f.mock.calls.length).toBe(1);
    });
});
