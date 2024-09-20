import { describe, test, expect } from '@jest/globals';

import { alloc } from '@anireact/lewd';

import { gc, list } from './util.mjs';

describe('Deallocation', () => {
    test('Deallocation handles multiple pointers for a single token', async () => {
        let tok = Symbol();

        alloc(16, tok);
        alloc(16, tok);

        tok = null!;

        await gc();

        expect(list()).toEqual([{ free: 1, addr: 0, size: 0x10000 }]);
    });
});
