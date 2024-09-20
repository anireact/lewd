import { describe, test, expect } from '@jest/globals';

import { gc, list, cell } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation updates the list', async () => {
        let [, t0] = cell(16);
        let [, t1] = cell(32);
        let [, t2] = cell(16);
        let [, t3] = cell(48);
        let [, t4] = cell(32);
        let [, t5] = cell(16);
        let [, t6] = cell(16);
        let [, t7] = cell(16);

        // [  p0  ][      p1      ][  p2  ][          p3          ][      p4      ][  p5  ][  p6  ][  p7  ][ free ]
        // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx........

        t1 = null!;
        t3 = null!;
        t5 = null!;

        await gc();

        // [  p0  ][     free     ][  p2  ][         free         ][      p4      ][ free ][  p6  ][  p7  ][ free ]
        // xxxxxxxx................xxxxxxxx........................xxxxxxxxxxxxxxxx........xxxxxxxxxxxxxxxx........

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0010 }, // p0
            { free: 1, addr: 0x10, size: 0x0020 },
            { free: 0, addr: 0x30, size: 0x0010 }, // p2
            { free: 1, addr: 0x40, size: 0x0030 },
            { free: 0, addr: 0x70, size: 0x0020 }, // p4
            { free: 1, addr: 0x90, size: 0x0010 },
            { free: 0, addr: 0xa0, size: 0x0010 }, // p6
            { free: 0, addr: 0xb0, size: 0x0010 }, // p7
            { free: 1, addr: 0xc0, size: 0xff40 },
        ]);

        void [t0, t1, t2, t3, t4, t5, t6, t7];
    });
});
