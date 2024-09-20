import { describe, test, expect, jest } from '@jest/globals';

import { alloc, watch } from '@anireact/lewd';

import { gc } from './util.mjs';

describe('Resize', () => {
    test('Resize handlers are unregistered on the token GC', async () => {
        let tok = Symbol();

        let f = jest.fn();
        let g = jest.fn();
        watch(f, tok);
        watch(g, tok);

        tok = null!;

        await gc();

        alloc(0x20000);

        expect(f.mock.calls.length).toBe(0);
        expect(g.mock.calls.length).toBe(0);
    });
});
