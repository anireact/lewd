import { describe, test, expect } from '@jest/globals';

import { gc, tree, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation updates the tree', async () => {
        let [, t0] = cell(16);
        let [, t1] = cell(16);
        let [, t2] = cell(48);
        let [, t3] = cell(16);
        let [, t4] = cell(32);
        let [, t5] = cell(16);
        let [, t6] = cell(32);
        let [, t7] = cell(16);
        let [, t8] = cell(16);
        let [, t9] = cell(16);

        // [  p0  ][  p1  ][          p2          ][  p3  ][      p4      ][  p5  ][      p6      ][  p7  ][  p8  ][  p9  ][ free ]
        // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx........

        t2 = null!;
        t6 = null!;
        t4 = null!;
        t0 = null!;
        t8 = null!;

        await gc();

        // [ free ][  p1  ][         free         ][  p3  ][     free     ][  p5  ][     free     ][  p7  ][ free ][  p9  ][ free ]
        // ........xxxxxxxx........................xxxxxxxx................xxxxxxxx................xxxxxxxx........xxxxxxxx........

        expect(tree()).toEqual([
            { free: 1, addr: 0x00, size: 0x0010 },
            { free: 1, addr: 0xc0, size: 0x0010 },
            { free: 1, addr: 0x60, size: 0x0020 },
            { free: 1, addr: 0x90, size: 0x0020 },
            { free: 1, addr: 0x20, size: 0x0030 },
            { free: 1, addr: 0xe0, size: 0xff20 },
        ]);

        void [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9];
    });
});
