import { describe, test, expect } from '@jest/globals';

import { alloc, trim, i32 } from '@anireact/lewd';

describe('Shrinking', () => {
    test('trim() copies the memory', () => {
        alloc(0x20000, global);
        alloc(0x10000);

        i32[0x0000] = 2434;
        i32[0x3fff] = 1312;

        trim();

        expect(i32[0x0000]).toBe(2434);
        expect(i32[0x3fff]).toBe(1312);
    });
});
