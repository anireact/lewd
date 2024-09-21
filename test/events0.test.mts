import { describe, test, expect, jest, beforeEach } from '@jest/globals';

import { bool, alloc, grow, trim, memory, buffer, Resize, OOM, on, off } from '@anireact/lewd';
import { reset } from '#self/impl';

beforeEach(reset);

describe('Events', () => {
    test('Implicit grow triggers the resize', () => {
        let log: string[] = [];

        let grow_info: Resize.Info;
        let resize_info: Resize.Info;

        on('resize', global, ({ type, info }) => {
            log.push(type);
            resize_info = info;
        });

        on('grow', global, ({ type, info }) => {
            log.push(type);
            grow_info = info;
        });

        alloc(0x20000);

        expect(log).toEqual(['grow', 'resize']);

        expect(grow_info!).toBe(resize_info!);

        expect(grow_info!.memory).toBe(memory);
        expect(grow_info!.buffer).toBe(buffer);
        expect(grow_info!.oldSize).toBe(0x10000);
        expect(grow_info!.newSize).toBe(0x20000);
    });

    test('Explicit grow() triggers the resize', () => {
        let log: string[] = [];

        let grow_info: Resize.Info;
        let resize_info: Resize.Info;

        on('resize', global, ({ type, info }) => {
            log.push(type);
            resize_info = info;
        });

        on('grow', global, ({ type, info }) => {
            log.push(type);
            grow_info = info;
        });

        grow(1);

        expect(log).toEqual(['grow', 'resize']);

        expect(grow_info!).toBe(resize_info!);

        expect(grow_info!.memory).toBe(memory);
        expect(grow_info!.buffer).toBe(buffer);
        expect(grow_info!.oldSize).toBe(0x10000);
        expect(grow_info!.newSize).toBe(0x20000);
    });

    test('trim() triggers the resize', () => {
        let log: string[] = [];

        let trim_info: Resize.Info;
        let resize_info: Resize.Info;

        alloc(0x20000, global);
        alloc(0x20000);

        on('resize', global, ({ type, info }) => {
            log.push(type);
            resize_info = info;
        });

        on('trim', global, ({ type, info }) => {
            log.push(type);
            trim_info = info;
        });

        trim();

        expect(log).toEqual(['trim', 'resize']);

        expect(trim_info!).toBe(resize_info!);

        expect(trim_info!.memory).toBe(memory);
        expect(trim_info!.buffer).toBe(buffer);
        expect(trim_info!.oldSize).toBe(0x40000);
        expect(trim_info!.newSize).toBe(0x20000);
    });

    test('Explicit unsubscribing works as expected', () => {
        let t = Symbol();
        let u = Symbol();

        let f1 = jest.fn();
        let f2 = jest.fn();
        let f3 = jest.fn();
        let f4 = jest.fn();
        let f5 = jest.fn();
        let f6 = jest.fn();

        on('resize', t, f1);
        on('resize', t, f2);
        on('resize', t, f3);
        on('resize', u, f4);
        on('resize', u, f5);
        on('resize', u, f6);

        alloc(0x20000);

        off('resize', t, f1); // Unsub f1
        off('resize', u, f2); // nop
        off('resize', u, f3); // nop

        trim();

        off('resize', u, f4); // Unsub f4
        off('resize', t, f5); // nop
        off('resize', t, f6); // nop

        alloc(0x20000);

        off('resize', t); // Unsub f2, f3

        trim();

        off('resize', u); // Unsub f5, f6

        alloc(0x20000);

        expect(f1.mock.calls.length).toBe(1);
        expect(f2.mock.calls.length).toBe(3);
        expect(f3.mock.calls.length).toBe(3);
        expect(f4.mock.calls.length).toBe(2);
        expect(f5.mock.calls.length).toBe(4);
        expect(f6.mock.calls.length).toBe(4);
    });

    test('OOM is triggered as expected', () => {
        let log: string[] = [];
        let oom: OOM.Info;
        let err: bool;

        on('oom', global, ({ type, info }) => {
            log.push(type);
            oom = info;
        });

        alloc(0x80000000, global); // 2 GiB
        alloc(0x80000000, global); // Another 2 GiB

        try {
            alloc(16);
            err = 0;
        } catch {
            err = 1;
        }

        expect(log).toEqual(['oom']);
        expect(err).toBe(1);
        expect(oom!.currentCapacity).toBe(0x10000);
        expect(oom!.requestCapacity).toBe(0x10001);
        expect(oom!.maximumCapacity).toBe(0x10000);

        err = grow(2);

        expect(log).toEqual(['oom', 'oom']);
        expect(err).toBe(1);
        expect(oom!.currentCapacity).toBe(0x10000);
        expect(oom!.requestCapacity).toBe(0x10002);
        expect(oom!.maximumCapacity).toBe(0x10000);
    });
});
