import { describe, test, expect, jest } from '@jest/globals';

import { alloc, trim, bind } from '@anireact/lewd';

describe('Memory binding', () => {
    test('bind() is triggered on memory shrink', () => {
        let f = jest.fn();
        bind(() => null, f);

        alloc(0x10000, f);
        alloc(0x10000);

        trim();

        expect(f.mock.calls.length).toBe(1);
    });
});
