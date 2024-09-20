import { describe, test, expect } from '@jest/globals';

import { total, used, usedRun, free, headFree, tailFree, largestFree } from '@anireact/lewd';
import { alloc, reset } from '#self/impl';

import { gc } from './util.mjs';

describe('Stats', () => {
    test('Stats are updated on deallocation in the beginning', async () => {
        reset();

        let key = Symbol();

        alloc(16, key);
        alloc(240, global);

        key = null!;

        await gc();

        expect(total()).toBe(0x10000);
        expect(used()).toBe(0x00f0);
        expect(usedRun()).toBe(0x00f0);
        expect(free()).toBe(0xff10);
        expect(headFree()).toBe(0x0010);
        expect(tailFree()).toBe(0xff00);
        expect(largestFree()).toBe(0xff00);

        void key;
    });
});
