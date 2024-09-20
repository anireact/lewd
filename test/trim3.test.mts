import { describe, test, expect } from '@jest/globals';

import { alloc, trim, memory, buffer, total } from '@anireact/lewd';

describe('Shrinking', () => {
    test('trim() doesn’t update the buffers if there’s nothing to shrink', () => {
        let old_mem = memory;
        let old_buf = buffer;
        let old_cap = total();

        alloc(0x10000, global);

        trim();

        expect(old_mem).toBe(memory);
        expect(old_buf).toBe(buffer);
        expect(old_cap).toBe(total());
    });
});
