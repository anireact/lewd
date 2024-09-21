import { describe, test, expect, beforeEach } from '@jest/globals';

import { bool, alloc, grow, memory, buffer, totalBytes, Resize, OOM, on } from '@anireact/lewd';
import { reset } from '#self/impl';
import { list, tree } from './util.mjs';

beforeEach(reset);

describe('Growing', () => {
    test('alloc(..) can expand an empty memory', () => {
        alloc(0x20000);
        expect(totalBytes()).toBe(0x20000);

        expect(list()).toEqual([{ free: 1, addr: 0x00000, size: 0x20000 }]);
        expect(tree()).toEqual([{ free: 1, addr: 0x00000, size: 0x20000 }]);
    });

    test('alloc(..) can create a new zone', () => {
        alloc(0x10000, global);
        alloc(0x10000);

        expect(totalBytes()).toBe(0x20000);

        expect(list()).toEqual([
            { free: 0, addr: 0x00000, size: 0x10000 },
            { free: 1, addr: 0x10000, size: 0x10000 },
        ]);

        expect(tree()).toEqual([{ free: 1, addr: 0x10000, size: 0x10000 }]);
    });

    test('alloc(..) grows even for small overflows', () => {
        alloc(0xfff0, global);
        alloc(32);

        expect(totalBytes()).toBe(0x20000);

        expect(list()).toEqual([
            { free: 0, addr: 0x00000, size: 0x0fff0 },
            { free: 1, addr: 0x0fff0, size: 0x10010 },
        ]);

        expect(tree()).toEqual([{ free: 1, addr: 0x0fff0, size: 0x10010 }]);
    });

    test('grow() updates the buffers', () => {
        let old_mem = memory;
        let old_buf = buffer;
        let old_cap = totalBytes();

        grow(1);

        expect(old_mem).toBe(memory);
        expect(old_buf).not.toBe(buffer);
        expect(old_cap).not.toBe(totalBytes());
    });

    test('grow(0) doesn’t update anything', () => {
        let old_mem = memory;
        let old_buf = buffer;
        let old_cap = totalBytes();

        let err = grow(0);

        expect(err).toBe(0);
        expect(old_mem).toBe(memory);
        expect(old_buf).toBe(buffer);
        expect(old_cap).toBe(totalBytes());
    });

    test('grow() handles unexpected OOM correctly', () => {
        Reflect.defineProperty(memory, 'grow', {
            writable: true,
            enumerable: true,
            configurable: true,
            value: function grow() {
                throw new RangeError();
            },
        });

        let log: string[] = [];
        let oom: OOM.Info;

        on('oom', global, ({ type, info }) => {
            log.push(type);
            oom = info;
        });

        let err = grow(1);

        expect(err).toBe(1);
        expect(log).toEqual(['oom']);
        expect(oom!.currentCapacity).toBe(1);
        expect(oom!.requestCapacity).toBe(2);
        expect(oom!.maximumCapacity).toBe(0x10000);
    });

    test('grow() handles unexpected buffer change correctly', () => {
        let fake_buffer = new ArrayBuffer(0x10000);

        Reflect.defineProperty(memory, 'grow', {
            writable: true,
            enumerable: true,
            configurable: true,
            value: function grow() {
                Reflect.defineProperty(memory, 'buffer', {
                    enumerable: true,
                    configurable: true,
                    get() {
                        return fake_buffer;
                    },
                });

                throw new WebAssembly.RuntimeError();
            },
        });

        let log: string[] = [];
        let resize_info: Resize.Info;
        let grow_info: Resize.Info;
        let err: bool;
        let ex: unknown;

        on('resize', global, ({ type, info }) => {
            log.push(type);
            resize_info = info;
        });

        on('grow', global, ({ type, info }) => {
            log.push(type);
            grow_info = info;
        });

        try {
            grow(1);
            err = 0;
        } catch (error) {
            err = 1;
            ex = error;
        }

        expect(err).toBe(1);
        expect(ex).toBeInstanceOf(WebAssembly.RuntimeError);

        expect(log).toEqual(['grow', 'resize']);

        expect(grow_info!).toBe(resize_info!);

        expect(grow_info!.memory).toBe(memory);
        expect(grow_info!.buffer).toBe(buffer);
        expect(grow_info!.oldSize).toBe(0x10000);
        expect(grow_info!.newSize).toBe(0x10000);

        expect(buffer).toBe(fake_buffer);
    });

    test('grow() handles unexpected buffer resize correctly', () => {
        let fake_buffer = new (ArrayBuffer as any)(0x10000, { maxByteLength: 0x100000000 }) as ArrayBuffer;

        let should_throw = false;

        Reflect.defineProperty(memory, 'buffer', {
            enumerable: true,
            configurable: true,
            get() {
                return fake_buffer;
            },
        });

        Reflect.defineProperty(memory, 'grow', {
            writable: true,
            enumerable: true,
            configurable: true,
            value: function grow(diff: number) {
                (fake_buffer as any).resize(buffer.byteLength + diff * 0x10000);

                if (should_throw) throw new WebAssembly.RuntimeError();
            },
        });

        let log: string[] = [];
        let resize_info: Resize.Info;
        let grow_info: Resize.Info;
        let err: bool;
        let ex: unknown;

        // Propagate the fake buffer into the internal state
        alloc(0x20000);

        should_throw = true;

        on('resize', global, ({ type, info }) => {
            log.push(type);
            resize_info = info;
        });

        on('grow', global, ({ type, info }) => {
            log.push(type);
            grow_info = info;
        });

        try {
            grow(1);
            err = 0;
        } catch (error) {
            err = 1;
            ex = error;
        }

        expect(err).toBe(1);
        expect(ex).toBeInstanceOf(WebAssembly.RuntimeError);

        expect(log).toEqual(['grow', 'resize']);

        expect(grow_info!).toBe(resize_info!);

        expect(grow_info!.memory).toBe(memory);
        expect(grow_info!.buffer).toBe(buffer);
        expect(grow_info!.oldSize).toBe(0x20000);
        expect(grow_info!.newSize).toBe(0x30000);

        expect(buffer).toBe(fake_buffer);
    });

    test('grow() errors don’t currupt the layout', () => {
        alloc(0x80000000, global);
        alloc(0x7ffffff0, global);

        let err = grow(1);

        expect(err).toBe(1);

        expect(list()).toEqual([
            { free: 0, addr: 0x00000000, size: 0x80000000 },
            { free: 0, addr: 0x80000000, size: 0x7ffffff0 },
            { free: 1, addr: 0xfffffff0, size: 0x00000010 },
        ]);

        expect(tree()).toEqual([{ free: 1, addr: 0xfffffff0, size: 0x00000010 }]);
    });
});
