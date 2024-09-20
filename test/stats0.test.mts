import { describe, test, expect } from '@jest/globals';

import { alloc, trim, total, used, usedRun, free, headFree, tailFree, largestFree } from '@anireact/lewd';
import { reset } from '#self/impl';

describe('Stats', () => {
    test('Stats have expected initial values', () => {
        reset();

        expect(total()).toBe(0x10000);
        expect(used()).toBe(0);
        expect(usedRun()).toBe(0);
        expect(free()).toBe(0x10000);
        expect(headFree()).toBe(0x10000);
        expect(tailFree()).toBe(0x10000);
        expect(largestFree()).toBe(0x10000);
    });

    test('Stats are updated on alloc(_, token)', () => {
        reset();

        alloc(16, global);
        alloc(240, global);

        expect(total()).toBe(0x10000);
        expect(used()).toBe(0x100);
        expect(usedRun()).toBe(0x100);
        expect(free()).toBe(0xff00);
        expect(headFree()).toBe(0);
        expect(tailFree()).toBe(0xff00);
        expect(largestFree()).toBe(0xff00);
    });

    test('Stats are not updated on alloc(_)', () => {
        reset();

        alloc(16);
        alloc(240);

        expect(total()).toBe(0x10000);
        expect(used()).toBe(0);
        expect(usedRun()).toBe(0);
        expect(free()).toBe(0x10000);
        expect(headFree()).toBe(0x10000);
        expect(tailFree()).toBe(0x10000);
        expect(largestFree()).toBe(0x10000);
    });

    test('Stats are updated on grow', () => {
        reset();

        alloc(0x20000);

        expect(total()).toBe(0x20000);
        expect(used()).toBe(0);
        expect(usedRun()).toBe(0);
        expect(free()).toBe(0x20000);
        expect(headFree()).toBe(0x20000);
        expect(tailFree()).toBe(0x20000);
        expect(largestFree()).toBe(0x20000);
    });

    test('Stats are updated on trim()', () => {
        reset();

        alloc(0x20000);
        trim();

        expect(total()).toBe(0x10000);
        expect(used()).toBe(0);
        expect(usedRun()).toBe(0);
        expect(free()).toBe(0x10000);
        expect(headFree()).toBe(0x10000);
        expect(tailFree()).toBe(0x10000);
        expect(largestFree()).toBe(0x10000);
    });
});
