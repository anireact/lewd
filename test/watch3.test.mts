import { describe, test, expect } from '@jest/globals';

import { alloc, buffer, memory, watch, total } from '@anireact/lewd';

describe('Resize', () => {
    test('Resize handler is called with updated buffers', () => {
        let new_mem: WebAssembly.Memory;
        let new_buf: ArrayBuffer;
        let new_cap: number;

        watch(() => {
            new_mem = memory;
            new_buf = buffer;
            new_cap = total();
        }, global);

        alloc(0x20000);

        expect(new_mem!).toBe(memory);
        expect(new_buf!).toBe(buffer);
        expect(new_cap!).toBe(total());
    });
});
