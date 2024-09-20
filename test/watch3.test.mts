import { describe, test, expect } from '@jest/globals';

import { alloc, buf, cap, i32, mem, watch } from '@anireact/lewd';

describe('Resize', () => {
    test('Resize handler is called with updated buffers', () => {
        let new_mem: typeof mem;
        let new_buf: typeof buf;
        let new_i32: typeof i32;
        let new_cap: typeof cap;

        watch(() => {
            new_mem = mem;
            new_buf = buf;
            new_i32 = i32;
            new_cap = cap;
        }, global);

        alloc(0x20000);

        expect(new_mem!).toBe(mem);
        expect(new_buf!).toBe(buf);
        expect(new_i32!).toBe(i32);
        expect(new_cap!).toBe(cap);
    });
});
