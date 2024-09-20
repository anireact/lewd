// #region Types
/** Boolean-like integer. */
type bool = 0 | 1;

/** Event handler function. */
type Func = () => unknown;

/** A search tree node. */
interface Node {
    /** Associated zone. */ z: Zone;
    /** Subtree height.  */ h: number;
    /** Left child.      */ l: null | Node;
    /** Right child.     */ r: null | Node;
}

/** A memory zone descriptor. */
interface Zone {
    /** Free zone flag. */ f: bool;
    /** Zone address.   */ a: number;
    /** Previous zone.  */ p: null | Zone;
    /** Next zone.      */ n: null | Zone;
}

/** Numeric constants. */ //prettier-ignore
const enum $ {
    Align16  = 0x000F,
    Align64K = 0x0FFF,
}
// #endregion Types

// #region Pure functions
/**
 * Construct new memory of the given initial size (in 64 KiB pages).
 */ /*#__NO_SIDE_EFFECTS__*/
const Memory = (initial: number) => {
    initial = initial | 0;
    return new WebAssembly.Memory({ initial: initial >>> 0 });
};
// #endregion Pure functions

// #region Search tree
/**
 * Compute the balance factor of the subtree.
 *
 * @param self The target subtree.
 */ // prettier-ignore
const bfac = (self: Node) => {
    // ↓ Balance(x) = Height(x.r) - Height(x.l)
    return (self.r?.h! | 0) - (self.l?.h! | 0) | 0;
};

/**
 * Fix the subtree height.
 *
 * @param self The target subtree.
 */ // prettier-ignore
const fixh = (self: Node) => {
    var l = 0;
    var r = 0;

    // ↓ Height(x) ← max(Height(x.l), Height(x.r)) + 1
    l = self.l?.h! | 0;
    r = self.r?.h! | 0;
    self.h = (l > r ? l : r) + 1 | 0;
};

/**
 * Rotate the subtree left.
 *
 * @param self The target subtree.
 */ // prettier-ignore
const rotl = (self: Node) => {
    //       X              R
    //      / \     =>     / \
    //     l   R    =>    X   r
    //        / \   =>   / \
    //       L   r      l   L

    var node: null | Node = null;

    node = self.r!;
    self.r = node.l;
    node.l = self;
    fixh(self);
    fixh(node);
    return node;
};

/**
 * Rotate the subtree right.
 *
 * @param self The target subtree.
 */ // prettier-ignore
const rotr = (self: Node) => {
    //         X          L
    //        / \   =>   / \
    //       L   r  =>  l   X
    //      / \     =>     / \
    //     l   R          R   r

    var node: null | Node = null;

    node = self.l!;
    self.l = node.r;
    node.r = self;
    fixh(self);
    fixh(node);
    return node;
};

/**
 * Fix the subtree balance.
 *
 * @param self The target subtree.
 */ // prettier-ignore
const fixb = (self: Node) => {
    fixh(self);

    if ((bfac(self) | 0) ==  2) { if ((bfac(self.r!) | 0) < 0) self.r = rotr(self.r!); return rotl(self); }
    if ((bfac(self) | 0) == -2) { if ((bfac(self.l!) | 0) > 0) self.l = rotl(self.l!); return rotr(self); }

    return self;
};

/**
 * Delete a minimal leaf node from the subtree.
 *
 * @param self The target subtree.
 */
const dmin = (self: Node) => {
    if (!self.l) return self.r;

    self.l = dmin(self.l);

    return fixb(self);
};

/**
 * Add a zone into the subtree.
 *
 * @param self The target subtree.
 * @param zone The zone to insert.
 */ // prettier-ignore
const ins = (self: null | Node, zone: Zone) => {
    if (!self) return { z: zone, h: 1, l: null, r: null };

    if (lt(zone, self.z)) self.l = ins(self.l!, zone);
    else                  self.r = ins(self.r!, zone);

    return fixb(self);
};

/**
 * Delete a zone from the subtree.
 *
 * @param self The target subtree.
 * @param zone The zone to delete.
 */
const cut = (self: Node, zone: Zone) => {
    var left: null | Node = null;
    var rght: null | Node = null;

    if (!self) return null;

    if (lt(zone, self.z) | 0) {
        self.l = cut(self.l!, zone);
    } else if (zone !== self.z) {
        self.r = cut(self.r!, zone);
    } else {
        left = self.l;
        rght = self.r;
        if (!rght) return left;
        self = rght;
        while (self.l) self = self.l;
        self.r = dmin(rght);
        self.l = left;
    }

    return fixb(self);
};
// #endregion Search tree

// #region Chunk list
/**
 * Create and link a new memory zone.
 *
 * @param free Free zone flag.
 * @param addr Zone address.
 * @param prev Previous zone.
 * @param next Next zone.
 */ // prettier-ignore
const Zone = (free: bool, addr: number, prev: null | Zone, next: null | Zone): Zone => {
    free = (free | 0) as bool;
    addr =  addr | 0;

    var self: null | Zone = null;

    self = { f: free, a: addr, p: prev, n: next };

    if (prev) prev.n = self; else head = self;
    if (next) next.p = self; else last = self;

    return self;
};

/**
 * Create, link, and index a new free memory zone.
 *
 * @param addr Zone address.
 * @param prev Previous zone.
 * @param next Next zone.
 */
const Free = (addr: number, prev: null | Zone, next: null | Zone): Zone => {
    addr = addr | 0;
    return add(Zone(1, addr, prev, next));
};

/**
 * Add a zone into the search tree.
 *
 * @param zone The zone to insert.
 */
const add = (zone: Zone): Zone => {
    root = ins(root, zone);
    return zone;
};

/**
 * Delete a zone from the search tree.
 *
 * @param zone The zone to delete.
 */
const del = (zone: Zone): Node | null => {
    return (root = cut(root!, zone));
};

/**
 * Remove the memory zone from the list.
 *
 * @param self The target zone.
 */ // prettier-ignore
const unlink = (self: Zone): void => {
    if (self.p) self.p.n = self.n; else head = self.n!;
    if (self.n) self.n.p = self.p; else last = self.p!;
};

/**
 * Compute the full zone length in 16-byte blocks.
 *
 * @param self The target zone.
 */ // prettier-ignore
const measure = (self: Zone): number => {
    if (self.n) return (self.n.a | 0) - (self.a | 0) | 0;
    else        return cap            - (self.a | 0) | 0;
};

/**
 * Compare two zones; prefer smaller zones at lower addresses.
 */ // prettier-ignore
const lt = (a: Zone, b: Zone): bool => {
    var p = 0;
    var q = 0;

    p = measure(a) | 0;
    q = measure(b) | 0;

    // ↓ a) Equal sizes     => compare addresses:
    if ((p | 0) == (q | 0)) return ((((a.a >>> 0) < (b.a >>> 0)) as any) | 0) as bool;

    // ↓ b) Nothing special => just compare sizes:
    else                    return (((p >>> 0 < q >>> 0) as any) | 0) as bool;
};
// #endregion Chunk list

// #region Memory management
/**
 * Allocates {@linkcode size} bytes and returns the allocated address.
 *
 * If the {@linkcode token} is specified, it indicates the lifetime of the
 * allocation, so the pointer is automatically deallocated when the host
 * garbage-collects the {@linkcode token}.
 *
 * If no {@linkcode token} is specified, the function returns a _scratch_
 * pointer. No memory is actually allocated, and just an unused address to fit
 * {@linkcode size} bytes is returned. This can save some CPU cycles by skipping
 * the underlying bookkeeping, but should be used carefully to avoid any
 * allocations while the scratch memory is still in use.
 *
 * @param size  The number of bytes to allocate.
 * @param token The lifetime token.
 */ /*#__NO_SIDE_EFFECTS__*/ // prettier-ignore
const alloc = (size: number, token?: WeakKey): number => {
    size = size | 0;

    var node: null | Node = null;
    var fits: null | Node = null;
    var temp = 0;

    var free: null | Zone = null;
    var used: null | Zone = null;

    // ↓ 1. Align and shift the size:
    size = (size + (-size & $.Align16) | 0) >>> 4 | 0;

    // ↓ a) Find an existing free zone:
    //   ------------------------------

    node = root;

    while (node) {
        temp = measure(node.z) | 0;
        // ↓ a) The current zone is too small:
        if (temp >>> 0 < size >>> 0) {
            node = node.r;
        }
        // ↓ b) The current zone is too large:
        else if (temp >>> 0 > size >>> 0) {
            fits = node;
            node = node.l;
        }
        // ↓ c) The current zone is OK, but there is a candidate at a lower address:
        else if (node.l && (measure(node.l.z) | 0) >>> 0 >= size >>> 0) {
            node = node.l;
        }
        // ↓ d) Nothing else to try:
        else {
            fits = node;
            node = null;
        }
    }

    if (fits) free = fits.z; // ← A matching node is found, use its zone.

    // ↓ b) Grow the memory:
    //   -------------------

    else {
        // ↓ a) The last zone is free:
        if (last.f) {
            temp = size - (measure(last) | 0) | 0;               // ← 1. Compute the number of 16-byte blocks to grow the memory by.
            del(last);                                           // ← 2. Temporarily delete the last zone from the tree.
            memory.grow(temp + (-temp & $.Align64K) >>> 12) | 0; // ← 3. Grow the memory.
            add(last);                                           // ← 4. Add the last zone back to the tree.
        }

        // ↓ b) The last zone is used:
        else {
            memory.grow(size + (-size & $.Align64K) >>> 12) | 0; // ← 1. Grow the memory.
            Free(cap, last, null);                               // ← 2. Create and link new free zone.
        }

        // ↓ c) Finally:

        /*#__NOINLINE__*/ rebind();                              // ← 1. Update bindings after resize.
        /*#__NOINLINE__*/ notify();                              // ← 2. Notify resize listeners.
        free = last;                                             // ← 3. Use the last zone.
    }

    // ↓ c) Actually allocate:
    //   ---------------------

    // ↓ Lifetime token is specified:
    if (token) {
        del(free);                             // ← 1. Delete the free zone from the search tree.
        used = Zone(0, free.a, free.p, free);  // ← 2. Create a used zone.
        free.a = (free.a | 0) + size | 0;      // ← 3. Shift the free zone.
        if (measure(free) | 0)   add(free);    // ← 4. If the free node is still non-empty, add it back to the tree.
        else                     unlink(free); // ← 5. If it’s now too small, remove it from the list.

        preg.register(token, used);            // ← 6. Register the finalizer.
        allocd = allocd + size | 0;            // ← 7. Track memory usage:
    }

    return free.a << 4 | 0;
};

/**
 * Releases unused memory pages in the end of memory back to the host/OS.
 *
 * Internally, it creates a trimmed copy of memory, copies the data into it, and
 * then triggers the memory shrink handlers defined as the respawn callbacks of
 * the {@linkcode bind | bind()} function. Can cause OOM, if the host is short
 * on RAM.
 */ // prettier-ignore
const trim = (): void => {
    if (!last.f) return;

    /** Total used span size.  */ var size                   = 0;
    /** Current memory data.   */ var old: null | Int32Array = null;
    /** Memory shrink handler. */ var app: null | Func       = null;

    // ↓ 1. Calculate the memory amount to release:
    size = last.a | 0;                                // ← 1. Get the last zone size.
    size = size + (-size & $.Align64K) | 0;           // ← 2. Align to 64 KiB.
    if (!size) size = 0x1000;                         // ← 3. Preserve at least one page.
    if (size >>> 0 >= cap >>> 0) return;              // ← 4. Nothing to release.

    // ↓ 2. Respawn and migrate the memory:
    old = new Int32Array(buffer, 0, size << 2 >>> 0); // ← 1. Capture the current data.
    memory = Memory(size >>> 12);                     // ← 2. Spawn new memory.
    /*#__NOINLINE__*/ rebind();                       // ← 3. Update bindings after resize.
    new Int32Array(buffer).set(old);                  // ← 4. Copy the data.

    // ↓ 3. Notify listeners:
    for (app of apps) app();                          // ← 1. Notify shrink listeners.
    /*#__NOINLINE__*/ notify();                       // ← 2. Notify resize listeners.
};

/**
 * Update references on memory resize.
 */ // prettier-ignore
const rebind = () => {
    var len = 0.0;

    buffer = memory.buffer;                          // ← 1. Update the active buffer.
    len = +buffer.byteLength;                        // ← 2. Get the buffer size in bytes.
    if (+len == +4294967296.0) cap = 0x10000000;     // ← 3. Special-case the 4 GiB capacity.
    else                       cap = (~~+len >>> 4); // ← 4. Update the buffer size.
};
// #endregion Memory management

// #region Event system
/**
 * Registers a memory shrink handler {@linkcode respawn}, immediately invokes
 * the {@linkcode spawn} callback, and returns its result.
 *
 * **Notes:**
 *
 * -   If a WASM module has mutable globals, tables, etc., don’t forget to
 *     capture and restore them on respawn.
 * -   If a module has a global initialization procedure, don’t call it on
 *     respawn; instead, capture and restore the _initialized_ state (other than
 *     memory).
 *
 * @param spawn   The immediately invoked spawn callback. See the Spawn callback section in README for details.
 * @param respawn The handler to respawn the WASM instance on memory shrink. Should also capture and restore mutable globals, tables, etc. See the Respawn callback section in README for details.
 */ /*#__NO_SIDE_EFFECTS__*/
const bind = <t extends unknown>(spawn: () => t, respawn: () => unknown): t => {
    apps.add(respawn);
    return spawn();
};

/**
 * Registers a memory resize handler. Can be used to refresh memory views.
 *
 * @param watcher The memory resize handler.
 * @param token   The handler’s lifetime token.
 */ /*#__NO_SIDE_EFFECTS__*/
const watch = (watcher: () => unknown, token: WeakKey): void => {
    var wref: WeakRef<WeakKey>;
    var fset = wmap.get(token);

    if (!fset) {
        wref = new WeakRef(token);
        fset = new Set();
        wmap.set(token, fset);
        wset.add(wref);
        wreg.register(token, wref);
    }

    fset.add(watcher);
};

/**
 * Notify memory resize handlers.
 */
const notify = () => {
    var wref: null | WeakRef<WeakKey> = null;
    var func: null | Func = null;
    for (wref of wset) for (func of wmap.get(wref.deref()!) ?? []) func();
};
// #endregion Event system

// #region Testing helpers
/**
 * Reset the internal state (everything we can reset).
 */
const reset = (): void => {
    apps = new Set();
    wset = new Set();
    wmap = new WeakMap();
    memory = Memory(1);
    buffer = memory.buffer;
    cap = 0x1000;
    allocd = 0;
    head = { f: 1, a: 0, p: null, n: null };
    last = head;
    root = { z: head, h: 1, l: null, r: null };
};
// #endregion Testing helpers

// #region Usage stats
/**
 * Convert 16-byte blocks count to bytes.
 */
const bytes = (x: number) => {
    x = x | 0;
    return +(+(x >>> 0) * 16.0);
};

/**
 * Total memory size.
 */ // prettier-ignore
const total = (): number => {
    return +bytes(cap);
};

/**
 * Total allocated memory amount.
 */ // prettier-ignore
const used = (): number => {
    return +bytes(allocd);
};

/**
 * Total used memory span size including free gaps between allocated chunks.
 */ // prettier-ignore
const usedRun = (): number => {
    var z = 0;

    z = cap;

    if (head.f)                            z = z - (measure(head) | 0) | 0;
    if (last.f & ((head !== last) as any)) z = z - (measure(last) | 0) | 0;

    return +bytes(z);
};

/**
 * Total free memory amount.
 */ // prettier-ignore
const free = (): number => {
    return +bytes(cap - allocd | 0);
};

/**
 * Amount of free memory in the beginning of memory. Calculated independently
 * of {@linkcode tailFree}.
 */ // prettier-ignore
const headFree = (): number => {
    if (head.f) return +bytes(measure(head) | 0);
    else        return +0.0;
};

/**
 * Amount of free memory in the end of memory. Calculated independently
 * of {@linkcode headFree}.
 */ // prettier-ignore
const tailFree = (): number => {
    if (last.f) return +bytes(measure(last) | 0);
    else        return +0.0;
};

/**
 * Largest free chunk size.
 */ // prettier-ignore
const largestFree = (): number => {
    var node: null | Node = null;
    var last: null | Node = null;

    node = root;

    while (node) {
        last = node;
        node = node.r;
    }

    if (last) return +bytes(measure(last.z) | 0);
    else      return +0.0;
};
// #endregion Usage stats

// #region GC handlers
/**
 * Pointer finalization registry.
 */ // prettier-ignore
const preg = /*#__PURE__*/ new FinalizationRegistry<Zone>(zone => {
    if (zone.f) return;
    zone.f = 1;

    // ↓ 1. Track memory usage:
    allocd = allocd - (measure(zone) | 0) | 0;

    // ↓ a) Both adjacent zones are free:
    if (zone.p?.f! & zone.n?.f!) {
        del(zone.p!);                                  // ← 1. Temporarily delete the prev zone from the tree.
        unlink(zone);                                  // ← 2. Remove the current zone from the list.
        unlink(zone.n!);                               // ← 3. Remove the next zone from the list.
        return add(zone.p!);                           // ← 4. Add the prev zone back to the tree.
    }

    // ↓ b) The previous zone is free:
    else if (zone.p?.f) {
        del(zone.p);                                   // ← 1. Temporarily delete the prev zone from the tree.
        unlink(zone);                                  // ← 2. Remove the current zone from the list.
        return add(zone.p);                            // ← 3. Add the prev zone back to the tree.
    }

    // ↓ c) The next zone is free:
    else if (zone.n?.f) {
        del(zone.n);                                   // ← 1. Temporarily delete the next zone from the tree.
        zone.n.a = zone.n.a - (measure(zone) | 0) | 0; // ← 2. Shift it.
        unlink(zone);                                  // ← 3. Remove the current zone from the list.
        return add(zone.n);                            // ← 4. Add the next zone back to the tree.
    }

    // ↓ d) No free adjacent zones:
    else {
        unlink(zone);                                  // ← 1. Remove the current zone from the list.
        return Free(zone.a, zone.p, zone.n);           // ← 2. Add new free zone to the tree.
    }
});

/**
 * Resize watcher finalization registry.
 */
const wreg = /*#__PURE__*/ new FinalizationRegistry<WeakRef<WeakKey>>(ref => {
    return wset.delete(ref);
});
// #endregion GC handlers

// #region Subscriber registries
/** Memory shrink handlers. */ var apps: Set<Func> /*                   */ = /*#__PURE__*/ new Set();
/** Resize handlers set.    */ var wset: Set<WeakRef<WeakKey>> /*       */ = /*#__PURE__*/ new Set();
/** Resize handlers map.    */ var wmap: WeakMap<WeakKey, Set<Func>> /* */ = /*#__PURE__*/ new WeakMap();
// #endregion Subscriber registries

// #region The memory etc.
/** The active memory object. */ var memory: WebAssembly.Memory /* */ = /*#__PURE__*/ Memory(1);
/** The active buffer object. */ var buffer: ArrayBuffer /*        */ = /*#__PURE__*/ (() => memory.buffer)();
// #endregion The memory etc.

// #region Usage stats
/** Total memory size, in 16-byte blocks.                                   */ var cap: /*    */ number = 0x1000;
/** Total used memory, in 16-byte blocks.                                   */ var allocd: /* */ number = 0;
// #endregion Usage stats

// #region Data structures
/** Chunk list head.  */ var head: Zone /*        */ = { f: 1, a: 0, p: null, n: null };
/** Chunk list end.   */ var last: Zone /*        */ = head;
/** Search tree root. */ var root: null | Node /* */ = { z: head, h: 1, l: null, r: null };
// #endregion Data structures

// Primary API:
export { alloc, trim, bind, watch, memory, buffer };

// Stats API:
export { total, used, usedRun, free, headFree, tailFree, largestFree };

// Private API:
export { bool, Func, Node, Zone, Free, add, del, unlink, measure, lt, reset, apps, wset, wmap, head, last, root };
