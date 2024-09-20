import { describe, test, expect } from '@jest/globals';

import { alloc } from '@anireact/lewd';

import { list } from './util.mjs';

describe('Allocation', () => {
    test('alloc(_, token) allocates multiple pointers for a single token', () => {
        alloc(16, global);
        alloc(16, global);

        expect(list()).toEqual([
            { free: 0, addr: 0x00, size: 0x0010 },
            { free: 0, addr: 0x10, size: 0x0010 },
            { free: 1, addr: 0x20, size: 0xffe0 },
        ]);
    });
});
