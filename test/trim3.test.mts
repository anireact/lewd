import { describe, test, expect } from '@jest/globals';

import { alloc, trim, mem, buf, i32, cap } from '@anireact/lewd';

describe('Shrinking', () => {
    test('trim() doesn’t update the buffers if there’s nothing to shrink', () => {
        let old_mem = mem;
        let old_buf = buf;
        let old_i32 = i32;
        let old_cap = cap;

        alloc(0x10000, global);

        trim();

        expect(old_mem).toBe(mem);  
        expect(old_buf).toBe(buf);
        expect(old_i32).toBe(i32);
        expect(old_cap).toBe(cap);
    });
});
