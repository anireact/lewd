import { describe, test, expect } from '@jest/globals';

import { alloc, trim, total } from '@anireact/lewd';

import { cell } from './util.mjs';

describe('Shrinking', () => {
    test('trim() shrinks the memory', () => {
        let [, tok] = cell(0x10000);
        alloc(0x10000);
        trim();
        expect(total()).toBe(0x10000);

        void tok;
    });
});
