import { describe, test, expect } from '@jest/globals';

import { alloc } from '@anireact/lewd';

import { gc, cell } from './util.mjs';

describe('Allocation', () => {
    test('alloc(..) the lowest address wins even when all free zones are larger than request', async () => {
        // Setup:

        let [, t0] = cell(16);
        let [, t1] = cell(32);
        let [, t2] = cell(16);
        let [, t3] = cell(32);
        let [, t4] = cell(16);

        // [  p0  ][      p1      ][  p2  ][      p3      ][  p4  ][ free ]
        // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++........

        t1 = null!;
        t3 = null!;

        await gc();

        // Actual allocation:

        // [  p0  ][     free     ][  p2  ][     free     ][  p4  ][ free ]
        // ++++++++................++++++++................++++++++........
        //         ↑

        expect(alloc(16)).toBe(16);

        void [t0, t1, t2, t3, t4];
    });
});
