import { describe, test, expect } from '@jest/globals';

import { alloc, trim, bind, i32 } from '@anireact/lewd';

describe('Memory binding', () => {
    test('bind() is triggered after the memory migration', () => {
        let capture1 = 0;
        let capture2 = 0;

        bind(
            () => null,
            () => {
                capture1 = i32[0x0000]!;
                capture2 = i32[0x1fff]!;
            },
        );

        alloc(0x10000, global);
        alloc(0x10000);

        i32[0x0000] = 2434;
        i32[0x1fff] = 1312;

        trim();

        expect(capture1).toBe(2434);
        expect(capture2).toBe(1312);

        expect(i32[0x0000]).toBe(2434);
        expect(i32[0x1fff]).toBe(1312);
    });
});
