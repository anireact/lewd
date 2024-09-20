import { describe, test, expect } from '@jest/globals';

import { total, used, usedRun, free, headFree, tailFree, largestFree } from '@anireact/lewd';
import { alloc, reset } from '#self/impl';

import { gc } from './util.mjs';

describe('Stats', () => {
    test('Stats are updated on multiple deallocations with largest in the middle', async () => {
        reset();

        let key = Symbol();

        alloc(16, key);
        alloc(112, global);
        alloc(0xff00, key);
        alloc(112, global);
        alloc(16, key);

        key = null!;

        await gc();

        expect(total()).toBe(0x10000);
        expect(used()).toBe(0x00e0);
        expect(usedRun()).toBe(0xffe0);
        expect(free()).toBe(0xff20);
        expect(headFree()).toBe(0x0010);
        expect(tailFree()).toBe(0x0010);
        expect(largestFree()).toBe(0xff00);

        void key;
    });
});
