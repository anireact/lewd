import { describe, test, expect, beforeEach } from '@jest/globals';

import { alloc, trim, memory, buffer, totalBytes } from '@anireact/lewd';
import { reset } from '#self/impl';

beforeEach(reset);

describe('Shrinking', () => {
    test('trim() shrinks the memory', () => {
        alloc(0x10000, global);
        alloc(0x10000);
        trim();
        expect(totalBytes()).toBe(0x10000);
    });

    test('trim() doesn’t release used memory', () => {
        alloc(0x10001, global);
        trim();
        expect(totalBytes()).toBe(0x20000);
    });

    test('trim() updates the buffers', () => {
        alloc(0x20000, global);
        alloc(0x10000);

        let old_mem = memory;
        let old_buf = buffer;
        let old_cap = totalBytes();

        trim();

        expect(old_mem).not.toBe(memory);
        expect(old_buf).not.toBe(buffer);
        expect(old_cap).not.toBe(totalBytes());
    });

    test('trim() doesn’t update the buffers if there’s nothing to shrink', () => {
        let old_mem = memory;
        let old_buf = buffer;
        let old_cap = totalBytes();

        alloc(0x10000, global);

        trim();

        expect(old_mem).toBe(memory);
        expect(old_buf).toBe(buffer);
        expect(old_cap).toBe(totalBytes());
    });

    test('trim() preserves the data', () => {
        alloc(0x20000, global);
        alloc(0x10000);

        let i32 = new Int32Array(buffer);

        i32[0x0000] = 2434;
        i32[0x3fff] = 1312;

        trim();

        i32 = new Int32Array(buffer);

        expect(i32[0x0000]).toBe(2434);
        expect(i32[0x3fff]).toBe(1312);
    });
});
