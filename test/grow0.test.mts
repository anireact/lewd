import { describe, test, expect } from '@jest/globals';

import { alloc, cap } from '@anireact/lewd';

describe('Growing', () => {
    test('alloc(..) can expand the last zone', () => {
        alloc(0x20000);
        expect(cap).toBe(0x2000);
    });
});
