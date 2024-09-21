import { describe, test, expect, jest, beforeEach } from '@jest/globals';

import { alloc, trim, bind, memory, buffer } from '@anireact/lewd';
import { reset } from '#self/impl';

beforeEach(reset);

describe('Memory binding', () => {
    test('bind() returns the result of init', () => {
        let x = bind(
            () => 2434,
            () => {},
        );

        expect(x).toBe(2434);
    });

    test('bind() is triggered on memory shrink', () => {
        let f = jest.fn();
        bind(() => null, f);

        alloc(0x10000, f);
        alloc(0x10000);

        trim();

        expect(f.mock.calls.length).toBe(1);
    });

    test('bind() is triggered after the memory migration', () => {
        let capture1 = 0;
        let capture2 = 0;

        bind(
            () => null,
            () => {
                let i32 = new Int32Array(buffer);
                capture1 = i32[0x0000]!;
                capture2 = i32[0x1fff]!;
            },
        );

        alloc(0x10000, global);
        alloc(0x10000);

        let i32 = new Int32Array(buffer);
        i32[0x0000] = 2434;
        i32[0x1fff] = 1312;

        trim();

        i32 = new Int32Array(buffer);

        expect(capture1).toBe(2434);
        expect(capture2).toBe(1312);

        expect(i32[0x0000]).toBe(2434);
        expect(i32[0x1fff]).toBe(1312);
    });

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
