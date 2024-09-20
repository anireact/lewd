import { describe, test, expect } from '@jest/globals';

import { alloc, total } from '@anireact/lewd';

import { cell } from './util.mjs';

describe('Growing', () => {
    test('alloc(..) grows even for small overflows', () => {
        let [tok] = cell(0x10000 - 16);
        alloc(32);
        expect(total()).toBe(0x20000);

        void tok;
    });
});
