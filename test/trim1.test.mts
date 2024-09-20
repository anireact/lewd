import { describe, test, expect } from '@jest/globals';

import { trim, cap } from '@anireact/lewd';

import { cell } from './util.mjs';

describe('Shrinking', () => {
    test('trim() doesn’t release used memory', () => {
        let [tok] = cell(0x10008);
        trim();
        expect(cap).toBe(0x2000);
        void tok;
    });
});
