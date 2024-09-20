import { describe, test, expect, beforeEach } from '@jest/globals';

import { Zone, Free, add, del, unlink, measure, reset, head, last, root } from '#self/impl';

import { tree } from './util.mjs';

beforeEach(reset);

describe('Bookkeeping', () => {
    describe('Zone()', () => {
        test('Zone(..) initializes fields correctly', () => {
            let p: Zone = { f: 0, a: 0, p: null, n: null };
            let n: Zone = { f: 0, a: 0, p: null, n: null };

            expect(Zone(1, 2434, p, n)).toEqual({ f: 1, a: 2434, p, n });
            expect(Zone(1, 1312, p, n)).toEqual({ f: 1, a: 1312, p, n });
            expect(Zone(0, 2434, p, n)).toEqual({ f: 0, a: 2434, p, n });
            expect(Zone(0, 1312, p, n)).toEqual({ f: 0, a: 1312, p, n });
        });

        test('Zone(.., null, null) updates `head` and `last`', () => {
            let a = Zone(1, 0, null, null);
            expect(head).toBe(a);
            expect(last).toBe(a);
        });

        test('Zone(.., prev, null) updates `last`', () => {
            let a = Zone(1, 0, null, null);
            let b = Zone(1, 0, a, null);
            expect(head).toBe(a);
            expect(last).toBe(b);
        });

        test('Zone(.., null, next) updates `head`', () => {
            let a = Zone(1, 0, null, null);
            let b = Zone(1, 0, a, null);
            let c = Zone(1, 0, null, a);
            expect(head).toBe(c);
            expect(last).toBe(b);
        });

        test('Zone(.., prev, next) doesn’t update list ends', () => {
            let a = Zone(1, 0, null, null);
            let b = Zone(1, 0, a, null);
            let c = Zone(1, 0, null, a);
            let d = Zone(1, 0, a, b);
            expect(head).toBe(c);
            expect(last).toBe(b);
            void d;
        });

        test('Zone(.., prev, _) updates `prev.n`', () => {
            let a = Zone(1, 0, null, null);
            let b = Zone(1, 0, a, null);
            expect(a.n).toBe(b);

            let c = Zone(1, 0, a, b);
            expect(a.n).toBe(c);
        });

        test('Zone(.., _, next) updates `next.p`', () => {
            let a = Zone(1, 0, null, null);
            let b = Zone(1, 0, null, a);
            expect(a.p).toBe(b);

            let c = Zone(1, 0, a, b);
            expect(b.p).toBe(c);
        });
    });

    describe('Free()', () => {
        test('Free(..) initializes fields correctly', () => {
            let p: Zone = { f: 1, a: 0, p: null, n: null };
            let n: Zone = { f: 1, a: 0, p: null, n: null };
            expect(Free(2434, p, n)).toEqual({ f: 1, a: 2434, p, n });
            expect(Free(1312, p, n)).toEqual({ f: 1, a: 1312, p, n });
        });

        test('Free(_, null, null) updates `head` and `last`', () => {
            let a = Free(0, null, null);
            expect(head).toBe(a);
            expect(last).toBe(a);
        });

        test('Free(_, prev, null) updates `last`', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            expect(head).toBe(a);
            expect(last).toBe(b);
        });

        test('Free(_, null, next) updates `head`', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            let c = Free(0, null, a);
            expect(head).toBe(c);
            expect(last).toBe(b);
        });

        test('Free(_, prev, next) doesn’t update list ends', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            let c = Free(0, null, a);
            let d = Free(0, a, b);
            expect(head).toBe(c);
            expect(last).toBe(b);
            void d;
        });

        test('Free(_, prev, _) updates prev.n', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            expect(a.n).toBe(b);

            let c = Free(0, a, b);
            expect(a.n).toBe(c);
        });

        test('Free(_, _, next) updates next.p', () => {
            let a = Free(0, null, null);
            let b = Free(0, null, a);
            expect(a.p).toBe(b);

            let c = Free(0, a, b);
            expect(b.p).toBe(c);
        });

        test('Free(..) updates the search tree', () => {
            del(head);
            let a = Free(0, null, null);
            expect(root).toEqual({ z: a, h: 1, l: null, r: null });
        });
    });

    describe('unlink()', () => {
        test('unlink() updates `head` and resets `self.n.p`', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            unlink(a);
            expect(b.p).toBe(null);
            expect(head).toBe(b);
            expect(last).toBe(b);
        });

        test('unlink() updates `last` and resets `self.p.n`', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            unlink(b);
            expect(a.n).toBe(null);
            expect(head).toBe(a);
            expect(last).toBe(a);
        });

        test('unlink() links prev/next to each other', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            let c = Free(0, b, null);
            unlink(b);
            expect(a.n).toBe(c);
            expect(c.p).toBe(a);
        });
    });

    describe('measure()', () => {
        test('measure() works as expected', () => {
            let a = Free(0, null, null);
            let b = Free(0, a, null);
            let c = Free(1, b, null);
            let d = Free(2435, c, null);
            let e = Free(3747, d, null);

            expect(measure(a)).toBe(0);
            expect(measure(b)).toBe(1);
            expect(measure(c)).toBe(2434);
            expect(measure(d)).toBe(1312);
            expect(measure(e)).toBe(349);
        });
    });

    describe('add()', () => {
        test('add() orders the tree correctly', () => {
            del(head);

            for (let i = 6; i >= 0; i--) {
                add({ f: 1, a: 0x1000 - i, p: null, n: null });
            }

            expect(root?.l?.l?.l).toBe(null);
            expect(root?.l?.l?.r).toBe(null);
            expect(root?.l?.r?.l).toBe(null);
            expect(root?.l?.r?.r).toBe(null);
            expect(root?.r?.l?.l).toBe(null);
            expect(root?.r?.l?.r).toBe(null);
            expect(root?.r?.r?.l).toBe(null);
            expect(root?.r?.r?.r).toBe(null);

            expect(tree()).toMatchObject([
                { addr: 0x10000 - 0x00, size: 0x00 },
                { addr: 0x10000 - 0x10, size: 0x10 },
                { addr: 0x10000 - 0x20, size: 0x20 },
                { addr: 0x10000 - 0x30, size: 0x30 },
                { addr: 0x10000 - 0x40, size: 0x40 },
                { addr: 0x10000 - 0x50, size: 0x50 },
                { addr: 0x10000 - 0x60, size: 0x60 },
            ]);
        });

        test('add() in different order', () => {
            del(head);

            for (let i = 0; i < 7; i++) {
                add({ f: 1, a: 0x1000 - i, p: null, n: null });
            }

            expect(tree()).toMatchObject([
                { addr: 0x10000 - 0x00, size: 0x00 },
                { addr: 0x10000 - 0x10, size: 0x10 },
                { addr: 0x10000 - 0x20, size: 0x20 },
                { addr: 0x10000 - 0x30, size: 0x30 },
                { addr: 0x10000 - 0x40, size: 0x40 },
                { addr: 0x10000 - 0x50, size: 0x50 },
                { addr: 0x10000 - 0x60, size: 0x60 },
            ]);
        });
    });
});
