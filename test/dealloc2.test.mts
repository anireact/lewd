import { describe, test, expect } from '@jest/globals';

import { gc, list, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation of the last pointer in the beginning of memory', async () => {
        let [, t0] = cell(16);
        t0 = null!;

        await gc();

        expect(list()).toEqual([{ free: 1, addr: 0, size: 0x10000 }]);

        void t0;
    });
});
