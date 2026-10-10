export const scenes = [
    { id: 's0-membrane', lengthVh: 140, owner: 'user', touch: true, surface: 's0', back: 's1', seamIn: 'same' },
    { id: 'seam-01', lengthVh: 60, owner: 'user', touch: false, surface: 's0', back: 's1', seamIn: 'same' },
    { id: 's1-suketo', lengthVh: 220, owner: 'user', touch: false, surface: 's1', back: 's1', seamIn: 'same' },
    { id: 'seam-12', lengthVh: 60, owner: 'user', touch: false, surface: 's1', back: 's2', seamIn: 'dark' },
    { id: 's2-kasane', lengthVh: 240, owner: 'user', touch: true, surface: 's2', back: 's3-black', seamIn: 'same' },
    { id: 'seam-23', lengthVh: 60, owner: 'user', touch: false, surface: 's2', back: 's3-black', seamIn: 'same' },
    { id: 's3-aima', lengthVh: 240, owner: 'user', touch: true, surface: 's3-black', back: 's3', seamIn: 'same' },
    { id: 'seam-34', lengthVh: 60, owner: 'user', touch: false, surface: 's3', back: 's4', seamIn: 'white' },
    { id: 's4-paper', lengthVh: 160, owner: 'user', touch: true, surface: 's4', back: 'white', seamIn: 'same' },
];
export const totalVh = scenes.reduce((sum, s) => sum + s.lengthVh, 0);
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const smooth = (n) => { const v = clamp(n); return v * v * (3 - 2 * v); };
export function sceneStart(index) { return scenes.slice(0, index).reduce((n, s) => n + s.lengthVh, 0); }
// Coordinates are scroll pixels, independent of DOM and drawing state.
export function resolve(scrollY, viewportH) {
    const vh = Number.isFinite(viewportH) && viewportH > 0 ? viewportH : 1;
    const position = Math.max(0, Math.min(totalVh, Number.isFinite(scrollY) ? Math.round(scrollY / vh * 100 * 1e8) / 1e8 : 0));
    let start = 0, index = scenes.length - 1;
    for (let i = 0; i < scenes.length; i++) {
        if (position < start + scenes[i].lengthVh || i === scenes.length - 1) {
            index = i;
            break;
        }
        start += scenes[i].lengthVh;
    }
    const scene = scenes[index], p = clamp((position - start) / scene.lengthVh);
    return { scene, p, prev: scenes[index - 1], next: scenes[index + 1], index, startVh: start };
}
