import { describe, test, expect } from '@jest/globals';

import { alloc, memory, buffer, total } from '@anireact/lewd';

describe('Growing', () => {
    test('Growing updates the buffers', () => {
        let old_mem = memory;
        let old_buf = buffer;
        let old_cap = total();

        alloc(0x20000, global);

        expect(old_mem).toBe(memory);
        expect(old_buf).not.toBe(buffer);
        expect(old_cap).not.toBe(total());
    });
});
