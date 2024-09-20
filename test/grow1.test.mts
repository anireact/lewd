import { describe, test, expect } from '@jest/globals';

import { alloc, cap } from '@anireact/lewd';

import { cell } from './util.mjs';

describe('Growing', () => {
    test('alloc(..) can create a new zone', () => {
        let [, tok] = cell(0x10000);
        alloc(0x10000);
        expect(cap).toBe(0x2000);

        void tok;
    });
});
