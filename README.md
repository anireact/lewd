# LEWD Alloc

Lightweight Efficient WASM-first Dynamic Allocator — a simple and compact
JS-side allocator for hand-written WASM.

<div align="center">

![LEWD Alloc](./Alloc.png)

</div>

```bash
yarn add @anireact/lewd
```

## Rationale

Sometimes you just need a tiny hand-written WASM module to optimize a certain
function or data structure, but don’t want to bloat the module with a
general-purpose allocator. Even worse, if you have multiple WASM modules and
each of them requires an allocator to work, you’re forced to link an allocator
into each one and bloat the resulting bundle.

Well, we have WASM-GC, but as of the moment, it’s not supported across all major
environments and doesn’t support arbitrary `load`/`store` operations on the heap
objects.

That’s where LEWD Alloc comes in. It can be shared across multiple modules,
reduces memory overhead, doesn’t bloat the modules and saves the precious 4 KiB
of binary size allowed for sync compilation, supports garbage collection so you
can forget about memory leaks, and more.

But it **is not** a general-purpose allocator, so read the docs carefully,
especially the [Limitations](#limitations) and
[Minimal complete example](#minimal-complete-example) sections.

## Contents

-   [Features](#features)
-   [Limitations](#limitations)
-   [Minimal complete example](#minimal-complete-example)
    -   [The WASM Side](#the-wasm-side)
    -   [Getting started](#getting-started)
    -   [Load the module](#load-the-module)
    -   [Initialize the module](#initialize-the-module)
        -   [The spawn callback](#the-spawn-callback)
        -   [The respawn callback](#the-respawn-callback)
    -   [The wrapper class](#the-wrapper-class)
        -   [The constructor](#the-constructor)
        -   [Method wrappers](#method-wrappers)
        -   [State accessor](#state-sccessor)
-   [API](#api)
    -   [Primary API](#primary-api)
        -   [`alloc()`](#alloci32weakkeyi32)
        -   [`trim()`](#trimvoid)
        -   [`bind()`](#bindtfnfnt)
        -   [`memory`](#memorywebassemblymemory)
        -   [`buffer`](#bufferarraybuffer)
    -   [Events API](#events-api)
        -   [`on()`](#onstringweakkeyfnvoid)
        -   [`off()`](#offstringweakkeyfnvoid)
    -   [Stats API](#stats-api)
        -   [`total()`](#totalf64)
        -   [`used()`](#usedf64)
        -   [`usedRun()`](#usedrunf64)
        -   [`free()`](#freef64)
        -   [`headFree()`](#headfreef64)
        -   [`tailFree()`](#tailfreef64)
        -   [`largestFree()`](#largestfreef64)
-   [TODO](#todo)
-   [Support](#support)
-   [License](#license)

## Features

-   **Approx. 1.5 KiB minigzip**, and ≈3 KiB minified _no gzip_.
-   **Bundler/minifier annotations** to simplify tree-shaking and DCE.
-   **Best-fit strategy** attempts to reduce memory fragmentation.
-   **Efficient bookkeeping** with _zero_ overhead _(on the WASM side)_.
-   **GC integration** to automatically deallocate unused memory.
-   **Scratch allocations** for immediately dropped temporary buffers.
-   **16-byte alignment** to safely allocate all WASM types, including `v128`.
-   **Memory shrink** to release unused pages back to the host/OS.
-   **Resize notifications** to update data views on memory resize.

## Limitations

-   This **is not** a general-purpose allocator.
-   Holding allocated pointers in the data structures on the WASM side should be
    done with extreme care, or otherwise they’ll be garbage-collected while the
    associated memory is still in use.
-   No allocations from the WASM side.
-   No `malloc()`-like strong allocations.
-   No `free()`-like explicit deallocation.
-   No `realloc()` and `calloc()`.
-   No `(data)` segments.
-   No range protection (to prevent `(data)` and/or stack corruption).
-   No async instantiation.
-   No shared memories.
-   No exported memories.
-   No multiple allocator instances.

Some of the limitations can be worked around, some others can be worked around
in a limited number of scenarios, and others are fundamental to our design and
goals and can’t be worked around at all.

## Minimal complete example

Let’s consider a simple PRNG written in plain WASM, that we want to wrap in a JS
_library_. The algorithm has a 128-bit state and provides a number of methods to
initialize the state and to generate random numbers. Additionally, our algorithm
requires some precomputed constants or tables of, say, 1 KiB in size. We compute
them at startup and store at a certain address.

### The WASM side

The WASM module imports a memory and a single global and exports a number of
functions:

```wasm
;; The memory of at least 1 page:
(memory (import "env" "mem") 1)

;; Precomputed data address:
(global $tab (import "env" "tab") i32)

;; Precompute the constants, tables or
;; whatever of the total size 1 KiB
;; and save the result at `$tab`:
(func $init (export "init"))

;; Seed a PRNG instance at `$self`:
(func $seed (export "seed") (param $self i32) (param $seed i32))

;; Generate a 32-bit integer using a PRNG at `$self`:
(func $rand (export "rand") (param $self i32) (result i32))

;; Fill a 32-bit integer array at `$out` of
;; the byte length `$len` using a PRNG at `$self`:
(func $fill (export "fill") (param $self i32) (param $out i32) (param $len i32))
```

The corresponding C++ code looks something like this:

```cpp
// Precomputed data address:
uint32_t* tab = NULL;

// Precompute the constants, tables or
// whatever of the total size 1 KiB and
// save the result in `*tab`:
void init();

class PRNG {
public:
    // Instance state:
    uint32_t a, b, c, d;

    // Seed a PRNG instance:
    void seed(uint32_t seed);

    // Generate a 32-bit integer:
    uint32_t rand();

    // Fill an output array `out` of the byte length `len`:
    void fill(uint32_t* out, size_t len);
};
```

### Getting started

First, we import everything we’ll need later, and re-export the
[`trim()`](#trimvoid) function:

```typescript
import { alloc, trim, bind, memory, buffer, on } from '@anireact/lewd';

export { trim };
```

### Load the module

Then we define our WASM module object. And don’t forget about the `#__PURE__`
annotations to make tree-skaing/DCE easier:

```typescript
const PRNG_MOD = /*#__PURE__*/ new WebAssembly.Module(
    /*#__PURE__*/ new Uint8Array([
        // Compiled WASM module bytes
    ]),
);
```

Sure, we could get the module object in a different way, for example using the
async/streaming WebAsembly API, but that makes tree-shaking/DCE virtually
impossible, especially for Terser, even with `#__PURE__` annotations.
Theoretically, bundlers or optimizers like the Google Closure Compiler can be
slightly smarter, but I don’t trust them either.

Alternatively, we could use an `import` statement to load a WASM module bundled
with a special loader, but we should be careful to use a loader that loads a
_module_, not its _instance_ exports.

Of course, the synchronous WebAssembly API limits the module size to ≈4 KiB on
the UI thread, but if you have a larger module, it’s likely that its size is
already much larger than the size of a traditional WASM-side allocator, so
there’s no problem linking it into the WASM module, so you don’t really need
LEWD Alloc.

### Initialize the module

Before initializing of the module, we should allocate some memory for the
precomputed tables it requires:

```typescript
const tab = /*#__PURE__*/ alloc(1024, PRNG_MOD);
```

Here we allocate 1 KiB of memory with the lifetime token `PRNG_MOD`, which is
guaranteed to have the same lifetime as the whole library/application.

Now it’s time to initialize the module and configure its respawn callback. This
code has two parts, which will be discussed later:

```typescript
let impl = /*#__PURE__*/ bind(
    // Immediately invoked spawn callback:
    () => {
        // See below
    },
    // Respawn callback:
    () => {
        // See below
    },
);
```

Again, the [`bind()`](#bindtfnfnt) function call is annotated as `#__PURE__` to
simplify tree-shaking/DCE. The function itself has the `#__NO_SIDE_EFFECTS__`
annotation, which tells the bundler to mark _all_ its calls as `#__PURE__`, but
this annotation has no reliable support across bundlers/minifiers, so we still
have to add the `#__PURE__` annotation to each [`bind()`](#bindtfnfnt) call.

The [`bind()`](#bindtfnfnt) function spawns a WASM module and binds it to the
`WebAssembly.Memory` object when the allocator migrates to a new memory.

The function takes two callbacks: the spawn callback and the respawn callback.

#### The spawn callback

The spawn callback is invoked immediately on the [`bind()`](#bindtfnfnt) call,
and its result is returned as it is:

```typescript
// Spawn an instance and provide its imports:
let impl = new WebAssembly.Instance(PRNG_MOD, {
    env: { memory, tab },
});

// Invoke the initialization procedure:
impl.init();

return impl;
```

First, we create a `WebAssembly.Instance` object and provide its imports. In our
case, it’s the memory object `memory`, imported as `env.memory`,s and the
precomputed tables location imported as `env.tab`.

Then we call the `init()` procedure to precompute the tables and store the
result at the `tab` address.

Finally, we just return the local WASM instance, which is immediately assigned
to the top-level `impl` variable.

Oh, and technically it’s OK to use an async function here, but this makes
tree-shaking/DCE virtually impossible and should be avoided in libraries.

#### The respawn callback

The respawn callback is similar to the spawn callback, but instead of full
initialization it should capture the current state of the WASM instance, spawn a
new one, and restore the captured state.

In our case, we have no mutable state other than the memory itself, so the code
is quite trivial:

```typescript
// -> Capture code goes here <-

// Respawn the instance:
impl = new WebAssembly.Instance(PRNG_MOD, {
    env: { memory, tab },
});

// -> Restore code goes here <-
```

The state to be captured and restored includes mutable globals (all of which
should be exported), tables and other memories (all of which should be
imported), and probably certain other objects. Of course, specific objects can
be excluded from capture and restore, if their values are consumed synchronously
when they’re updated and then no longer used.

If the module has tables or other memories, all of them should be _imported_,
just like the main memory, and provided as usual on instantiation. If the module
has `(data)` segments mapped into _other_ memories, or `(elem)` segments mapped
into the tables, _and_ the spaces these segments are mapped into are overwritten
at runtime, they should be captured and restored as well.

Oh, and we don’t support modules with `(data)` segments mapped into the _main_
memory. This can be worked around in a number of scenarios, but in general, if
you have such modules, you should perfer other allocators, or wait for a
(distant) future version of this allocator.

Another important note is that unlike the spawn callback, **no** async code is
allowed here, or otherwise the memory can be corrupted.

### The wrapper class

The boilerplate is finished, and now we can write a wrapper class for our PRNG:

```typescript
export class MyPRNG {
    // PRNG instance address:
    #addr: number;

    // PRNG instance memory view:
    #view: Int32Array;

    // The constructor and initializer:
    constructor(seed: number);

    // Method bindings:
    rand(): number;
    fill(out: Int32Array): void;

    // State accessor:
    state: number[];
}
```

The class has the `#addr` field to hold the address of the PRNG and the `#view`
field for the memory view into the allocated space.

#### The constructor

The constructor should initialize both the wrapper instance and the WASM-side
instance:

```typescript
class MyPRNG {
    constructor(seed: number) {
        // Type-hint the seed:
        seed = seed | 0;

        // Allocate:
        this.#addr = alloc(16, this) | 0;

        // Create the memory view:
        this.#view = new Int32Array(buffer, this.#addr >>> 0, 4);

        // Register the memory resize handler:
        on('resize', this, () => {
            this.#view = new Int32Array(buffer, this.#addr >>> 0, 4);
        });

        // Call the WASM-side constructor:
        impl.seed(this.#addr | 0, seed | 0);
    }
}
```

First, we type-hint the argument to improve the performance in some engines. The
constructor can be pretty hot in some scenarios, so we should not ignore
optimization opportunities here.

Then we allocate the memory with the [`alloc(16, this)`](#alloci32weakkeyi32)
call. The allocation has the lifetime token `this`, which triggers the
deallocation of the associated memory when a particular wrapper object is
garbage-collected by the host. In other words, we don’t have to worry about
memory leaks, because the allocator does everything for us automatically. And
just like the `seed` argument, the call is type-hinted.

Now we create an initial view into the allocated memory and register a handler
to update it on memory resize with the [`on()`](#onstringweakkeyfnvoid) function
call. Just like the pointer, the handler is automatically unregistered when
`this` is garbage-collected by the host. The important thing here is to cast the
pointer to an unsigned integer with the `>>> 0` hint in the `Int32Array` calls,
because the addresses higher than 2 GiB are interpreted as negative values, but
the `Int32Array` constructor expects an unsigned integer.

Finally, we invoke the WASM-side constructor to actually initialize the PRNG
instance. It doesn’t have a return value, so the call isn’t type-hinted, but we
type-hint its arguments instead.

#### Method wrappers

Now let’s write the method wrappers:

```typescript
class MyPRNG {
    rand = () => {
        return impl.rand(this.#addr) | 0;
    };

    fill = (out: Int32Array) => {
        // Allocate a scratch for the output buffer:
        let scratch = alloc(out.byteLength | 0) | 0;

        // Call the buffer fill method:
        impl.fill(this.#addr | 0, scratch | 0, out.byteLength | 0);

        // Copy the scratch into the JS-side buffer:
        out.set(new Int32Array(buffer, scratch >>> 0, out.length));

        // Release unused memory back to the host/OS:
        trim();
    };
}
```

There’s nothing interesting in the `rand()` method, but we have a number of
things to discuss about the `fill()` method.

The first thing we do here is a _scratch_ allocation for the output data.
Scratches have _zero_ lifetime, and can be thought of as _immediately_
deallocated pointers. But if there are no allocation calls while the scratch
memory is still in use, we can save some CPU cycles by skipping the underlying
bookkeeping. For scratch allocations, we use the same
[`alloc()`](#alloci32weakkeyi32) call, but don’t provide a lifetime token.

Then we just call the `fill()` method, and when it fills the scratch, we copy
the data into the output array.

Finally, we release the unused memory pages back to the host/OS with the
[`trim()`](#trimvoid) call.

Oh, to keep the example simple, we didn’t handle some edge cases like OOM and
filling the output by parts, but in the real-world code you shouldn’t ignore
them.

#### State sccessor

Technically, we could stop here, but to make the wrapper complete, we’ll also
write an accessor for its internal state:

```typescript
class MyPRNG {
    get state() {
        return [...this.#view];
    }
    set state(state: number[]) {
        this.#view.set([state[0]!, state[1]!, state[2]!, state[3]!]);
    }
}
```

Nothing interesting, we just wrap the `#view` we’ve configured in the
constructor.

## API

### Primary API

#### `alloc(i32,WeakKey?):i32`

```typescript
function alloc(size: i32): i32;
function alloc(size: i32, token: WeakKey): i32;
```

-   **`size`:** `i32` — The number of bytes to allocate.
-   **`token`:** `WeakKey` — The lifetime token.

Allocate `size` bytes and get the allocated address.

If the `token` is specified, it indicates the lifetime of the allocation, so the
pointer is automatically deallocated when the host garbage-collects the `token`.

If no `token` is specified, the function returns a _scratch_ pointer. No memory
is actually allocated, and just an unused address to fit `size` bytes is
returned. This can save some CPU cycles by skipping the underlying bookkeeping,
but should be used carefully to avoid any allocations while the scratch memory
is still in use.

#### `trim():void`

```typescript
function trim(): void;
```

Release unused memory pages in the end of memory back to the host/OS.

Internally, it creates a trimmed copy of memory, copies the data into it, and
then triggers the memory shrink handlers defined as the respawn callbacks of the
[`bind()`](#bindtfnfnt) function. Can cause OOM, if the host is short on RAM.

#### `bind<t>(fn,fn):t`

```typescript
function bind<t>(initial: () => t, respawn: () => unknown): t;
```

-   **`spawn`:** `fn` — The immediately invoked spawn callback. See the
    [Spawn callback](#the-spawn-callback) section for details.
-   **`respawn`:** `fn` — The handler to respawn the WASM instance on memory
    shrink. Should also capture and restore mutable globals, tables, etc. See
    the [Respawn callback](#the-respawn-callback) section for details.

Register a memory shrink handler `respawn`, immediately invoke the `spawn`
callback, and get its result.

> **NB:**
>
> -   If a WASM module has mutable globals, tables, etc., don’t forget to
>     capture and restore them on respawn.
> -   If a module has a global initialization procedure, don’t call it on
>     respawn; instead, capture and restore the _initialized_ state (other than
>     memory).

#### `memory:WebAssembly.Memory`

The active memory object.

#### `buffer:ArrayBuffer`

The active buffer object.

### Events API

#### `on(string,WeakKey,fn):void`

```typescript
function on(type: 'resize', token: WeakKey, fn: (_: Resize) => any): void;
function on(type: 'grow', token: WeakKey, fn: (_: Grow) => any): void;
function on(type: 'trim', token: WeakKey, fn: (_: Trim) => any): void;
```

-   **`type`:** `string` — The event type.
-   **`token`:** `WeakKey` — The handler’s lifetime token.
-   **`fn`:** `fn` — The handler function.

Register an event handler. The handler is automatically unregistered when the
host garbage-collects its `token`. Each handler can be registered once per
token.

#### `off(string,WeakKey,fn?):void`

```typescript
function off(type: 'resize', token: WeakKey, fn?: (_: Resize) => any): void;
function off(type: 'grow', token: WeakKey, fn?: (_: Grow) => any): void;
function off(type: 'trim', token: WeakKey, fn?: (_: Trim) => any): void;
```

-   **`type`:** `string` — The event type.
-   **`token`:** `WeakKey` — The handler’s lifetime token.
-   **`fn`:** `fn` — The handler function.

Explicitly unregister the event handler. If no handler specified, all handlers
of the given `token` are removed.

#### interface `Resize`

The `'resize'` event object type:

-   **`type`:** `'resize'` — The event type.
-   **`info`:** [`Resize.Info`](#interface-resizeinfo) — Resize details.

#### interface `Grow`

The `'grow'` event object type:

-   **`type`:** `'grow'` — The event type.
-   **`info`:** [`Resize.Info`](#interface-resizeinfo) — Resize details.

#### interface `Trim`

The `'trim'` event object type:

-   **`type`:** `'trim'` — The event type.
-   **`info`:** [`Resize.Info`](#interface-resizeinfo) — Resize details.

#### interface `Resize.Info`

The resize details object:

-   **`oldSize`:** `f64` — Old memory size in bytes.
-   **`newSize`:** `f64` — New memory size in bytes.
-   **`memory`:** `WebAssembly.Memory` — Active memory object.
-   **`buffer`:** `ArrayBuffer` — Active buffer object.

### Stats API

> **NB:**
>
> All functions here return values as 64-bit floating point numbers, not
> integers.

#### `total():f64`

```typescript
function total(): f64;
```

Get the total memory size.

#### `used():i32`

```typescript
function used(): f64;
```

Get the total allocated memory amount.

#### `usedRun():i32`

```typescript
function usedRun(): f64;
```

Get the total used memory span size including free gaps between allocated
chunks.

#### `free():f64`

```typescript
function free(): f64;
```

Get the total free memory amount.

#### `headFree():f64`

```typescript
function headFree(): f64;
```

Get the amount of free memory in the beginning of memory. Calculated
independently of [`tailFree`](#tailfreef64).

#### `tailFree():f64`

```typescript
function tailFree(): f64;
```

Get the amount of free memory in the end of memory. Calculated independently of
[`headFree`](#headfreef64).

#### `largestFree():f64`

```typescript
function largestFree(): f64;
```

Get the largest free chunk size, in 16-byte blocks.

## TODO

-   [ ] `malloc()`, `realloc()`, `calloc()`, `free()` — C-like API.
-   [ ] `grow()` — explicit memory expansion.
-   [ ] Span protection to prevent `(data)` and/or stack corruption (and
        effectively support `__heap_base` or whatever your compiler uses
        instead).
-   [ ] Restricted working span to allow this allocator to be safely used
        alongside another one.
-   [ ] Safe handling of `(data)` segments in multiple modules.
-   [ ] Arbitrary alignment.
-   [ ] Best effort next-fit strategy.
-   [ ] Pointer kind conversion (strong to weak and vice versa).
-   [ ] OOM handling.
-   [ ] Debugging API.
-   [ ] Configurable limits.
-   [ ] Relocatable pointers.
-   [ ] Shared memory support.
-   [ ] Exported memory support.

## Support

If you have any issues, feel free to fork this module, or contact me on Telegram
https://t.me/miyaokamarina.

## License

MIT © 2024 Yuri Zemskov
