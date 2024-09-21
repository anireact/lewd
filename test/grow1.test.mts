import { describe, test, expect } from '@jest/globals';

import { alloc, grow } from '@anireact/lewd';
import { gc, list, tree } from './util.mjs';

describe('Growing', () => {
    test('grow() updates the tree correctly', async () => {
        let key = Symbol();
        alloc(0x0020, key);
        alloc(0xffd0, global);

        expect(list()).toEqual([
            { free: 0, addr: 0x0000, size: 0x0020 },
            { free: 0, addr: 0x0020, size: 0xffd0 },
            { free: 1, addr: 0xfff0, size: 0x0010 },
        ]);
        expect(tree()).toEqual([{ free: 1, addr: 0xfff0, size: 0x0010 }]);

        key = null!;

        await gc();

        expect(list()).toEqual([
            { free: 1, addr: 0x0000, size: 0x0020 },
            { free: 0, addr: 0x0020, size: 0xffd0 },
            { free: 1, addr: 0xfff0, size: 0x0010 },
        ]);
        expect(tree()).toEqual([
            { free: 1, addr: 0xfff0, size: 0x0010 },
            { free: 1, addr: 0x0000, size: 0x0020 },
        ]);

        let err = grow(1);

        expect(err).toBe(0);

        expect(list()).toEqual([
            { free: 1, addr: 0x0000, size: 0x00020 },
            { free: 0, addr: 0x0020, size: 0x0ffd0 },
            { free: 1, addr: 0xfff0, size: 0x10010 },
        ]);
        expect(tree()).toEqual([
            { free: 1, addr: 0x0000, size: 0x00020 },
            { free: 1, addr: 0xfff0, size: 0x10010 },
        ]);
    });
});
