import { describe, test, expect } from '@jest/globals';

import { gc, list, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation of a pointer in the end of memory', async () => {
        let [, t0] = cell(0x10000 - 16);
        let [, t1] = cell(16);

        t1 = null!;

        await gc();

        expect(list()).toEqual([
            { free: 0, addr: 0x0000, size: 0xfff0 },
            { free: 1, addr: 0xfff0, size: 0x0010 },
        ]);

        void [t0, t1];
    });
});
