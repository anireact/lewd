import { describe, test, expect } from '@jest/globals';

import { trim, total } from '@anireact/lewd';

import { cell } from './util.mjs';

describe('Shrinking', () => {
    test('trim() doesn’t release used memory', () => {
        let [tok] = cell(0x10008);
        trim();
        expect(total()).toBe(0x20000);
        void tok;
    });
});
