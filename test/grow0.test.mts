import { describe, test, expect } from '@jest/globals';

import { alloc, total } from '@anireact/lewd';

describe('Growing', () => {
    test('alloc(..) can expand the last zone', () => {
        alloc(0x20000);
        expect(total()).toBe(0x20000);
    });
});
