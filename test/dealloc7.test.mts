import { describe, test, expect } from '@jest/globals';

import { gc, list, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation of a large whole-memory pointer', async () => {
        let [, t0] = cell(0x20000);

        t0 = null!;

        await gc();

        expect(list()).toEqual([{ free: 1, addr: 0, size: 0x20000 }]);

        void t0;
    });
});
