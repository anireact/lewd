import { describe, test, expect } from '@jest/globals';

import { gc, list, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation of a pointer in the beginning of memory', async () => {
        let [, t0] = cell(16);
        let [, t1] = cell(0x10000 - 16);

        t0 = null!;

        await gc();

        expect(list()).toEqual([
            { free: 1, addr: 0x00, size: 0x0010 },
            { free: 0, addr: 0x10, size: 0xfff0 },
        ]);

        void [t0, t1];
    });
});
