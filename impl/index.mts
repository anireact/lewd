export {
    // Priary API:
    alloc,
    trim,
    bind,
    memory,
    buffer,

    // Stats API:
    total,
    used,
    usedRun,
    free,
    headFree,
    tailFree,
    largestFree,

    // Events API:
    Resize,
    Grow,
    Trim,
    on,
    off,
} from './impl.mjs';
