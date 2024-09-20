import { describe, test, expect } from '@jest/globals';

import { total, used, usedRun, free, headFree, tailFree, largestFree } from '@anireact/lewd';
import { alloc, reset } from '#self/impl';

import { gc } from './util.mjs';

describe('Stats', () => {
    test('Stats are updated on deallocation in the end', async () => {
        reset();

        let key = Symbol();

        alloc(16, global);
        alloc(240, global);
        alloc(0xff00, key);

        key = null!;

        await gc();

        expect(total()).toBe(0x10000);
        expect(used()).toBe(0x100);
        expect(usedRun()).toBe(0x100);
        expect(free()).toBe(0xff00);
        expect(headFree()).toBe(0);
        expect(tailFree()).toBe(0xff00);
        expect(largestFree()).toBe(0xff00);

        void key;
    });
});
