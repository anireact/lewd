import { describe, test, expect } from '@jest/globals';

import { list, cell } from './util.mjs';

describe('Allocation', () => {
    test('alloc(..) aligns the allocations', () => {
        let [, t0] = cell(17);

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0020 },
            { free: 1, addr: 0x20, size: 0xffe0 },
        ]);

        void t0;
    });
});
