import { describe, test, expect } from '@jest/globals';

import {
    totalAtoms,
    usedAtoms,
    runAtoms,
    freeAtoms,
    headAtoms,
    tailAtoms,
    largestAtoms,
    totalBytes,
    usedBytes,
    runBytes,
    freeBytes,
    headBytes,
    tailBytes,
    largestBytes,
} from '@anireact/lewd';
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

        expect(totalAtoms()).toBe(0x1000);
        expect(usedAtoms()).toBe(0x00e);
        expect(runAtoms()).toBe(0xffe);
        expect(freeAtoms()).toBe(0xff2);
        expect(headAtoms()).toBe(0x001);
        expect(tailAtoms()).toBe(0x001);
        expect(largestAtoms()).toBe(0xff0);

        expect(totalBytes()).toBe(0x10000);
        expect(usedBytes()).toBe(0x00e0);
        expect(runBytes()).toBe(0xffe0);
        expect(freeBytes()).toBe(0xff20);
        expect(headBytes()).toBe(0x0010);
        expect(tailBytes()).toBe(0x0010);
        expect(largestBytes()).toBe(0xff00);

        void key;
    });
});
