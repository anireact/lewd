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
    test('Stats are updated on deallocation in the beginning', async () => {
        reset();

        let key = Symbol();

        alloc(16, key);
        alloc(240, global);

        key = null!;

        await gc();

        expect(totalAtoms()).toBe(0x1000);
        expect(usedAtoms()).toBe(0x00f);
        expect(runAtoms()).toBe(0x00f);
        expect(freeAtoms()).toBe(0xff1);
        expect(headAtoms()).toBe(0x001);
        expect(tailAtoms()).toBe(0xff0);
        expect(largestAtoms()).toBe(0xff0);

        expect(totalBytes()).toBe(0x10000);
        expect(usedBytes()).toBe(0x00f0);
        expect(runBytes()).toBe(0x00f0);
        expect(freeBytes()).toBe(0xff10);
        expect(headBytes()).toBe(0x0010);
        expect(tailBytes()).toBe(0xff00);
        expect(largestBytes()).toBe(0xff00);

        void key;
    });
});
