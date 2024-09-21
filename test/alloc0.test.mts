import { describe, test, expect, beforeEach } from '@jest/globals';

import { bool, alloc } from '@anireact/lewd';
import { reset } from '#self/impl';
import { list, cell } from './util.mjs';

beforeEach(reset);

describe('Allocation', () => {
    test('alloc(_) doesn’t update the list', () => {
        let [, t0] = cell(16);
        let [, t1] = cell(48);
        let [, t2] = cell(16);
        let [, t3] = cell(16);
        let [, t4] = cell(16);

        alloc(32);

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0010 },
            { free: 0, addr: 0x10, size: 0x0030 },
            { free: 0, addr: 0x40, size: 0x0010 },
            { free: 0, addr: 0x50, size: 0x0010 },
            { free: 0, addr: 0x60, size: 0x0010 },
            { free: 1, addr: 0x70, size: 0xff90 },
        ]);

        void [t0, t1, t2, t3, t4];
    });

    test('alloc(..) aligns the allocations', () => {
        let [, t0] = cell(17);

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0020 },
            { free: 1, addr: 0x20, size: 0xffe0 },
        ]);

        void t0;
    });

    test('alloc(_, token) allocates multiple pointers for a single token', () => {
        alloc(16, global);
        alloc(16, global);

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0010 },
            { free: 0, addr: 0x10, size: 0x0010 },
            { free: 1, addr: 0x20, size: 0xffe0 },
        ]);
    });

    test('alloc(0, ..) throws an error', () => {
        let err: bool;

        try {
            alloc(0);
            err = 0;
        } catch {
            err = 1;
        }

        expect(err).toBe(1);
    });
});
