import { describe, test, expect } from '@jest/globals';

import { alloc, bind, buf, cap, i32, mem, trim } from '@anireact/lewd';

describe('Resize', () => {
    test('bind() is called with updated buffers', () => {
        let new_mem: typeof mem;
        let new_buf: typeof buf;
        let new_i32: typeof i32;
        let new_cap: typeof cap;

        alloc(0x20000);

        bind(() => null, () => {
            new_mem = mem;
            new_buf = buf;
            new_i32 = i32;
            new_cap = cap;
        });

        trim();

        expect(new_mem!).toBe(mem);
        expect(new_buf!).toBe(buf);
        expect(new_i32!).toBe(i32);
        expect(new_cap!).toBe(cap);
    });
});
