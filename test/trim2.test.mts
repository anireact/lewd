import { describe, test, expect } from '@jest/globals';

import { alloc, trim, memory, buffer, total } from '@anireact/lewd';

describe('Shrinking', () => {
    test('trim() updates the buffers', () => {
        alloc(0x20000, global);
        alloc(0x10000);

        let old_mem = memory;
        let old_buf = buffer;
        let old_cap = total();

        trim();

        expect(old_mem).not.toBe(memory);
        expect(old_buf).not.toBe(buffer);
        expect(old_cap).not.toBe(total());
    });
});
