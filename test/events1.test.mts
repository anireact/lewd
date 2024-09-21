import { describe, test, expect } from '@jest/globals';

import { alloc, trim, buffer, on, free } from '@anireact/lewd';
import { gc } from './util.mjs';

describe('Events', () => {
    test('Event handlers don’t prevent garbage collection', async () => {
        class Example {
            #addr = 0;
            #view: Int32Array;

            constructor() {
                this.#addr = alloc(16, this);
                this.#view = new Int32Array(buffer, this.#addr >>> 0, 4);

                on('resize', this, () => {
                    this.#view = new Int32Array(buffer, this.#addr >>> 0, 4);
                });
            }

            get state() {
                return [...this.#view];
            }

            set state(s) {
                this.#view.set(s);
            }
        }

        let x = new Example();

        x.state = [2, 4, 3, 4];

        expect(x.state).toEqual([2, 4, 3, 4]);

        alloc(0x20000);

        expect(x.state).toEqual([2, 4, 3, 4]);

        trim();

        expect(x.state).toEqual([2, 4, 3, 4]);

        x = null!;

        await gc();

        expect(free()).toBe(0x10000);

        void x;
    });
});
