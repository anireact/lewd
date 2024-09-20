import { describe, test, expect, jest } from '@jest/globals';

import { alloc, watch } from '@anireact/lewd';

describe('Resize', () => {
    test('Resize handler is triggered on grow', () => {
        let f = jest.fn();
        watch(f, global);

        alloc(0x20000);

        expect(f.mock.calls.length).toBe(1);
    });
});
