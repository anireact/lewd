import { describe, test, expect } from '@jest/globals';

import { alloc, trim, buffer } from '@anireact/lewd';

describe('Shrinking', () => {
    test('trim() copies the memory', () => {
        alloc(0x20000, global);
        alloc(0x10000);

        let i32 = new Int32Array(buffer);

        i32[0x0000] = 2434;
        i32[0x3fff] = 1312;

        trim();

        i32 = new Int32Array(buffer);

        expect(i32[0x0000]).toBe(2434);
        expect(i32[0x3fff]).toBe(1312);
    });
});
