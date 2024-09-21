import { describe, test, expect, jest } from '@jest/globals';

import { alloc, trim, on, off } from '@anireact/lewd';

describe('Events', () => {
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
});
