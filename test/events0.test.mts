import { describe, test, expect } from '@jest/globals';

import { alloc, trim, memory, buffer, Resize, on } from '@anireact/lewd';
import { reset } from '#self/impl';

describe('Events', () => {
    test('Grow triggers the resize', () => {
        reset();

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

    test('Trim triggers the resize', () => {
        reset();

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
});
