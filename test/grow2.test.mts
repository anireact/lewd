import { describe, test, expect } from '@jest/globals';

import { alloc, cap } from '@anireact/lewd';

import { cell } from './util.mjs';

describe('Growing', () => {
    test('alloc(..) grows even for small overflows', () => {
        let [tok] = cell(0x10000 - 16);
        alloc(32);
        expect(cap).toBe(0x2000);

        void tok;
    });
});
