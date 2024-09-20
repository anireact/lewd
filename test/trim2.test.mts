import { describe, test, expect } from '@jest/globals';

import { alloc, trim, mem, buf, i32, cap } from '@anireact/lewd';

describe('Shrinking', () => {
    test('trim() updates the buffers', () => {
        alloc(0x20000, global);
        alloc(0x10000);

        let old_mem = mem;
        let old_buf = buf;
        let old_i32 = i32;
        let old_cap = cap;

        trim();

        expect(old_mem).not.toBe(mem);
        expect(old_buf).not.toBe(buf);
        expect(old_i32).not.toBe(i32);
        expect(old_cap).not.toBe(cap);
    });
});
