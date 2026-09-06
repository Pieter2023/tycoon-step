Performance Notes

## September 5 city checkpoint

See [HANDOVER.md](../HANDOVER.md). The Three.js scene is lazy-loaded when opened. The current build reports approximately 1,104.57 kB main JS, 725.44 kB town JS and 559.85 kB charts before gzip; these are build-output sizes, not measured frame rates or complete transfer budgets. Existing chunk-size warnings remain. [Build log](verification/gameplay-2026-09-05/build.log).

City model: 1,163,764 bytes, Draco compressed. Character: 333,824 bytes, six clips plus optional sex-specific parts. Vehicles, bike and dog: 153,864 bytes, Draco compressed, loaded with the city (the square still opens if that file fails); model URLs carry a version query so cached copies are not reused after an export. Runtime adds twelve residents, six vehicles, a cyclist, a dog on a leash, seven pigeons and three bunting strings; rain, pigeons, pennant waving and traffic motion are skipped under reduced motion. Rooms, labels, poses, cups, steam and ambience are runtime additions. Scene exit disposes render/audio/animation resources. Reduced motion skips optional effects; test actual devices before increasing visual complexity.

Browser layout/play checks were performed at 1280×720 and 390×844; portrait café framing was widened after cropping was found. Physical-device FPS, thermal load, multi-touch and slow-network loading remain unmeasured. No performance pass should claim these from desktop screenshots.
- Reduce motion: disables most motion-heavy animations via the root `tycoon-reduce-motion` class and avoids confetti.
- Confetti: caps particle count and logs frame drops in dev to spot jank.
- Tutorial video preload: `preload="none"` prevents loading until the user hits Play.
- Dev logging: render cycles over ~24ms are logged with active tab context for quick inspection.
