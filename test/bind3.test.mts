import { describe, test, expect } from '@jest/globals';

import { alloc, bind, buffer, memory, trim } from '@anireact/lewd';

describe('Resize', () => {
    test('bind() is called with updated buffers', () => {
        let new_mem: typeof memory;
        let new_buf: typeof buffer;

        alloc(0x20000);

        bind(
            () => null,
            () => {
                new_mem = memory;
                new_buf = buffer;
            },
        );

        trim();

        expect(new_mem!).toBe(memory);
        expect(new_buf!).toBe(buffer);
    });
});
