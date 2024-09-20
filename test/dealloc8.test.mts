import { describe, test, expect } from '@jest/globals';

import { gc, list, tree, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation then alloc(_, _)', async () => {
        let [p0, t0] = cell(16);
        let [p1, t1] = cell(16);
        let [p2, t2] = cell(48);
        let [p3, t3] = cell(16);
        let [p4, t4] = cell(32);
        let [p5, t5] = cell(16);
        let [p6, t6] = cell(32);
        let [p7, t7] = cell(16);
        let [p8, t8] = cell(16);
        let [p9, t9] = cell(16);
        let [pa, ta] = cell(16);
        let [pb, tb] = cell(16);

        t2 = null!;
        t6 = null!;
        ta = null!;
        t4 = null!;
        t0 = null!;
        t8 = null!;

        await gc();

        [p2, t2] = cell(48);
        [p4, t4] = cell(32);
        [p0, t0] = cell(16);
        [p8, t8] = cell(16);
        [p6, t6] = cell(32);
        [pa, ta] = cell(16);

        let [tc, pc] = cell(0x10000 - 256);

        expect(tree()).toEqual([]);

        expect(list()).toEqual([
            { free: 0, addr: 0x0000, size: 0x0010 }, // p0
            { free: 0, addr: 0x0010, size: 0x0010 }, // p1
            { free: 0, addr: 0x0020, size: 0x0030 }, // p2
            { free: 0, addr: 0x0050, size: 0x0010 }, // p3
            { free: 0, addr: 0x0060, size: 0x0020 }, // p4
            { free: 0, addr: 0x0080, size: 0x0010 }, // p5
            { free: 0, addr: 0x0090, size: 0x0020 }, // p6
            { free: 0, addr: 0x00b0, size: 0x0010 }, // p7
            { free: 0, addr: 0x00c0, size: 0x0010 }, // p8
            { free: 0, addr: 0x00d0, size: 0x0010 }, // p9
            { free: 0, addr: 0x00e0, size: 0x0010 }, // pa
            { free: 0, addr: 0x00f0, size: 0x0010 }, // pb
            { free: 0, addr: 0x0100, size: 0xff00 }, // pc
        ]);

        void [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, pa, pb, pc];
        void [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9, ta, tb, tc];
    });
});
