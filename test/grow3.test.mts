import { describe, test, expect } from '@jest/globals';

import { alloc, mem, buf, i32, cap } from '@anireact/lewd';

describe('Growing', () => {
    test('Growing updates the buffers', () => {
        let old_mem = mem;
        let old_buf = buf;
        let old_i32 = i32;
        let old_cap = cap;

        alloc(0x20000, global);

        expect(old_mem).toBe(mem);
        expect(old_buf).not.toBe(buf);
        expect(old_i32).not.toBe(i32);
        expect(old_cap).not.toBe(cap);
    });
});
