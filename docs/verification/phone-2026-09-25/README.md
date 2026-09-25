# First real-phone check (2026-09-25, 15:32–15:37 PDT)

**Device and setup:** Pieter's iPhone (Dynamic Island model), Safari, driven through macOS iPhone Mirroring. Branch `town-lighting-pass` at build 43: the lighting pass, the skinned townspeople, the AI Alex and the walk fix.

**Build served:** the production build (`npm run build`), served on the LAN by `tycoon-lan-preview` in `.claude/launch.json` (`vite preview --host 0.0.0.0 --port 5190`). The phone opened `http://192.168.1.80:5190/?stats`. The Mac's firewall allowed the connection with no prompt.

**Stats overlay.** `?stats` in the URL shows fps, draw calls, triangles and the graphics tier at the top of the city view (`TownModal`, class `town-stats`). The flag is off unless the URL has it.

| What | Result |
|---|---|
| Fresh game as Alex; the mobile shell; Enter 3D city | Loaded in about 8 s on Wi-Fi |
| The AI Alex on the phone | Renders correctly |
| Square, Auto graphics (the phone default) | 60 fps, 480–503 draw calls, 683–689k triangles |
| Walking with the joystick, camera following | 60 fps; the joystick and camera were smooth |
| Detailed graphics (the highest tier, `high`) | 56–59 fps |
| "See neighbourhood" camera, Detailed, about 3 minutes | 56–57 fps throughout; no thermal step-down |

**Not covered:**
- Café practice shift. The Café pill sits off the right edge of the destination row on a portrait phone, and the partly visible pill didn't take the tap.
- Rain, night and the kids square.
- Suspend/resume and orientation.
- A Chromebook.

**Notes for Phase 1** (matches assessment §2):
- In portrait, the header, destination pills and journey strip take about 40% of the screen above the 3D view.
- The destination row needs a horizontal swipe to reach Café and the pills after it.

**Left behind:** the test switched graphics from Auto to Detailed and did not switch it back, because Safari on the Mac came to the front and the check stopped. The setting is stored only for the LAN origin (`192.168.1.80:5190`), not the production site.
