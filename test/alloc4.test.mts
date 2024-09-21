import { describe, test, expect } from '@jest/globals';

import { alloc } from '@anireact/lewd';

import { gc, list, cell } from './util.mjs';

describe('Allocation', () => {
    test('alloc(_, token) updates the list', async () => {
        // Setup:

        let [, t0] = cell(16);
        let [, t1] = cell(48);
        let [, t2] = cell(16);
        let [, t3] = cell(16);
        let [, t4] = cell(16);

        // [  p0  ][          p1          ][  p2  ][  p3  ][  p4  ][ free ]
        // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++........

        t1 = null!;
        t3 = null!;

        await gc();

        // Actual allocation:

        // [  p0  ][         free         ][  p2  ][ free ][  p4  ][ free ]
        // ++++++++........................++++++++........++++++++........

        let t5 = Symbol();
        alloc(32, t5);

        // [  p0  ][      p5      ][ free ][  p2  ][ free ][  p4  ][ free ]
        // ++++++++++++++++++++++++........++++++++........++++++++........

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0010 },
            { free: 0, addr: 0x10, size: 0x0020 },
            { free: 1, addr: 0x30, size: 0x0010 },
            { free: 0, addr: 0x40, size: 0x0010 },
            { free: 1, addr: 0x50, size: 0x0010 },
            { free: 0, addr: 0x60, size: 0x0010 },
            { free: 1, addr: 0x70, size: 0xff90 },
        ]);

        void [t0, t1, t2, t3, t4, t5];
    });
});
