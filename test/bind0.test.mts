import { describe, test, expect } from '@jest/globals';

import { bind } from '@anireact/lewd';

describe('Memory binding', () => {
    test('bind() returns the result of init', () => {
        let x = bind(() => 2434, () => {});

        expect(x).toBe(2434);
    });
});
