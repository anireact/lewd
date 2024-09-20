import { describe, test, expect } from '@jest/globals';

import { gc, list, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation of the last pointer in the middle of memory', async () => {
        let [, t0] = cell(16);
        let [, t1] = cell(16);
        let [, t2] = cell(0x10000 - 32);

        t0 = null!;
        t2 = null!;

        await gc();

        t1 = null!;

        await gc();

        expect(list()).toEqual([{ free: 1, addr: 0, size: 0x10000 }]);

        void [t0, t1, t2];
    });
});
