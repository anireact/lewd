import { alloc } from '@anireact/lewd';
import { bool, Node, Zone, measure, head, root } from '#self/impl';

interface Span {
    free: bool;
    addr: number;
    size: number;
}

export const gc = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    global.gc?.();
    await new Promise(resolve => setTimeout(resolve, 100));
};

export const list = () => {
    let list: Span[] = [];

    let zone: null | Zone = head;

    while (zone) {
        list.push({
            free: zone.f,
            addr: 16 * (zone.a >>> 0),
            size: 16 * (measure(zone) >>> 0),
        });
        zone = zone.n;
    }

    return list;
};

export const tree = () => {
    let tree: Span[] = [];

    let iter = (node: null | Node) => {
        if (!node) return;

        iter(node.l);
        tree.push({
            free: 1,
            addr: 16 * (node.z.a >>> 0),
            size: 16 * (measure(node.z) >>> 0),
        });
        iter(node.r);
    };

    iter(root);

    return tree;
};

export const cell = (size: number) => {
    let tok = Symbol();
    let ptr = alloc(size, tok);

    return [ptr, tok] as const;
};
