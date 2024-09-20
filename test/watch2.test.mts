import { describe, test, expect } from '@jest/globals';

import { alloc, watch } from '@anireact/lewd';

describe('Resize', () => {
    test('Multiple handlers for a single token', () => {
        let m = 0;
        let n = 0;

        watch(() => m++, global);
        watch(() => n++, global);

        alloc(0x20000);

        expect(m).toBe(1);
        expect(n).toBe(1);
    });
});
