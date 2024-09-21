import { describe, test, expect, beforeEach } from '@jest/globals';

import {
    alloc,
    trim,
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
import { reset } from '#self/impl';

beforeEach(reset);

describe('Stats', () => {
    test('Stats have expected initial values', () => {
        expect(totalAtoms()).toBe(0x1000);
        expect(usedAtoms()).toBe(0);
        expect(runAtoms()).toBe(0);
        expect(freeAtoms()).toBe(0x1000);
        expect(headAtoms()).toBe(0x1000);
        expect(tailAtoms()).toBe(0x1000);
        expect(largestAtoms()).toBe(0x1000);

        expect(totalBytes()).toBe(0x10000);
        expect(usedBytes()).toBe(0);
        expect(runBytes()).toBe(0);
        expect(freeBytes()).toBe(0x10000);
        expect(headBytes()).toBe(0x10000);
        expect(tailBytes()).toBe(0x10000);
        expect(largestBytes()).toBe(0x10000);
    });

    test('Stats are updated on alloc(_, token)', () => {
        alloc(16, global);
        alloc(240, global);

        expect(totalAtoms()).toBe(0x1000);
        expect(usedAtoms()).toBe(0x10);
        expect(runAtoms()).toBe(0x10);
        expect(freeAtoms()).toBe(0xff0);
        expect(headAtoms()).toBe(0);
        expect(tailAtoms()).toBe(0xff0);
        expect(largestAtoms()).toBe(0xff0);

        expect(totalBytes()).toBe(0x10000);
        expect(usedBytes()).toBe(0x100);
        expect(runBytes()).toBe(0x100);
        expect(freeBytes()).toBe(0xff00);
        expect(headBytes()).toBe(0);
        expect(tailBytes()).toBe(0xff00);
        expect(largestBytes()).toBe(0xff00);
    });

    test('Stats are not updated on alloc(_)', () => {
        alloc(16);
        alloc(240);

        expect(totalAtoms()).toBe(0x1000);
        expect(usedAtoms()).toBe(0);
        expect(runAtoms()).toBe(0);
        expect(freeAtoms()).toBe(0x1000);
        expect(headAtoms()).toBe(0x1000);
        expect(tailAtoms()).toBe(0x1000);
        expect(largestAtoms()).toBe(0x1000);

        expect(totalBytes()).toBe(0x10000);
        expect(usedBytes()).toBe(0);
        expect(runBytes()).toBe(0);
        expect(freeBytes()).toBe(0x10000);
        expect(headBytes()).toBe(0x10000);
        expect(tailBytes()).toBe(0x10000);
        expect(largestBytes()).toBe(0x10000);
    });

    test('Stats are updated on grow', () => {
        alloc(0x20000);

        expect(totalAtoms()).toBe(0x2000);
        expect(usedAtoms()).toBe(0);
        expect(runAtoms()).toBe(0);
        expect(freeAtoms()).toBe(0x2000);
        expect(headAtoms()).toBe(0x2000);
        expect(tailAtoms()).toBe(0x2000);
        expect(largestAtoms()).toBe(0x2000);

        expect(totalBytes()).toBe(0x20000);
        expect(usedBytes()).toBe(0);
        expect(runBytes()).toBe(0);
        expect(freeBytes()).toBe(0x20000);
        expect(headBytes()).toBe(0x20000);
        expect(tailBytes()).toBe(0x20000);
        expect(largestBytes()).toBe(0x20000);
    });

    test('Stats are updated on trim()', () => {
        alloc(0x20000);
        trim();

        expect(totalAtoms()).toBe(0x1000);
        expect(usedAtoms()).toBe(0);
        expect(runAtoms()).toBe(0);
        expect(freeAtoms()).toBe(0x1000);
        expect(headAtoms()).toBe(0x1000);
        expect(tailAtoms()).toBe(0x1000);
        expect(largestAtoms()).toBe(0x1000);

        expect(totalBytes()).toBe(0x10000);
        expect(usedBytes()).toBe(0);
        expect(runBytes()).toBe(0);
        expect(freeBytes()).toBe(0x10000);
        expect(headBytes()).toBe(0x10000);
        expect(tailBytes()).toBe(0x10000);
        expect(largestBytes()).toBe(0x10000);
    });
});
