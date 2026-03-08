export const KMGTS = {
    '': Math.pow(10, 0),
    k: Math.pow(10, 3),
    m: Math.pow(10, 6),
    g: Math.pow(10, 9),
    t: Math.pow(10, 12),
};
export function kmgt(val: number): [string, string] {
    const nearest = Object.entries(KMGTS)
        .reverse()
        .find(([, v]) => val >= v);
    return nearest
        ? [new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(nearest[1] ? val / nearest[1] : val), nearest[0]]
        : [new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val), ''];
}
