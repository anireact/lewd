import { describe, test, expect } from '@jest/globals';

import { alloc, total } from '@anireact/lewd';

import { cell } from './util.mjs';

describe('Growing', () => {
    test('alloc(..) can create a new zone', () => {
        let [, tok] = cell(0x10000);
        alloc(0x10000);
        expect(total()).toBe(0x20000);

        void tok;
    });
});
