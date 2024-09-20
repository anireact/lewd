import { describe, test, expect } from '@jest/globals';

import { alloc } from '@anireact/lewd';

import { list, cell } from './util.mjs';

describe('Allocation', () => {
    test('alloc(_) doesn’t update the list', () => {
        let [, t0] = cell(16);
        let [, t1] = cell(48);
        let [, t2] = cell(16);
        let [, t3] = cell(16);
        let [, t4] = cell(16);

        alloc(32);

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0010 },
            { free: 0, addr: 0x10, size: 0x0030 },
            { free: 0, addr: 0x40, size: 0x0010 },
            { free: 0, addr: 0x50, size: 0x0010 },
            { free: 0, addr: 0x60, size: 0x0010 },
            { free: 1, addr: 0x70, size: 0xff90 },
        ]);

        void [t0, t1, t2, t3, t4];
    });
});
