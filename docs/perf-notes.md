Performance Notes
- Reduce motion: disables most motion-heavy animations via the root `tycoon-reduce-motion` class and avoids confetti.
- Confetti: caps particle count and logs frame drops in dev to spot jank.
- Tutorial video preload: `preload="none"` prevents loading until the user hits Play.
- Dev logging: render cycles over ~24ms are logged with active tab context for quick inspection.
