# Build 66: the sound audit and upgrade (2026-09-26, live since 09:16 PDT)

Released as release 10 (`main` = `6bb25f1`, deploy `6ab7efe0`). The live checks are under release 10 in `docs/verification/release-2026-09-25/`.

Pieter turned the city's sound on at the bank teller and it "tweeted loudly like a broken speaker". This build fixes that and redoes every sound in the game. All of it is still synthesized in the browser: there are no downloads, no files to license and no paid service.

## The broken-speaker sound

**Cause:** the night-cricket layer in `components/town/townAtmosphere.ts` routed a 27 Hz square wave (at depth 0.5) straight into the cricket's volume (`cricketDepth → cricketGain.gain`). An audio-rate input adds to a gain's value, so the cricket's level was the intended night level ± 0.5 at all times: day or night, indoors or out, as soon as the city's sound was on. The result was a 4.3 kHz tone chopped 54 times a second.

**Measured** (offline render of the old code, inside the bank by day):

| | Before | After |
|---|---|---|
| Bank, output RMS | **−10.5 dBFS** | −50 dBFS (quiet room tone) |
| Bank, peak | −6.2 dBFS | −32 dBFS (−23 with a purchase ka-ching) |
| Energy at 4273/4327 Hz | −11 dB | nothing measurable |

The old UI beeps peaked at −21 dBFS, so the whine was about 15 dB louder than anything else in the game, and continuous.

`bank-spectrogram-before-then-after.png` shows 3 s of the old bank, a second of silence, then the new bank with footsteps and a purchase. The old one is a solid 4.3 kHz line with buzz smeared across the whole spectrum.

## Second bug found on the way: one-sample cracks

A Web Audio gain starts at 1.0 until its first scheduled event. When a sound's start time drifted a hair past a sample boundary (floating-point sums like `2 + 7 × 0.4`), one full-scale sample got through before the fade-in. After a high-pass filter, that came out as a crack up to **−0.4 dBFS**. It appeared in a run of 12 rainy footsteps. Every envelope now zeroes its gain first (`envelope()` in `services/soundDesign.ts`). Twelve splash bursts now peak at −29.7 dBFS, and a stress run of 300 mixed one-shots at drifting times stays under −30. The old code had the same pattern in its footstep and car bursts.

## What changed

**One audio engine** (`services/audioService.ts`):
- one `AudioContext` for the whole game; the city used to open a second one;
- a master limiter (a `DynamicsCompressor` at −10 dB, 20:1). The master trims the compressor's automatic +5.7 dB make-up gain, so quiet sounds pass at unity;
- a small generated room reverb, used for one-shots only;
- two buses: `ui` (interface sounds) and `world` (the city);
- no audio before the first click or key press, so there is no autoplay warning. The city waits for that press (`whenAudioReady`);
- pauses while the tab is hidden, and pauses fully when muted;
- a purchase's ka-ching no longer plays on top of the "success" toast chime that reports it; a sound doubled by a handler and its toast plays once; month sounds repeated during 4× autoplay play quieter.

**Interface sounds, redesigned** (`services/soundDesign.ts`, `playUiSound`). They were single sine beeps. Each is now a small designed sound in C major, so overlaps never clash:

| Sound | Now | Peak |
|---|---|---|
| click | a soft key tap | −29 dBFS |
| month tick | a wooden clock tick | −32 |
| purchase | ka-ching: drawer, two register bells, a coin rattle | −24 |
| sell | coins handed over, down a fourth | −26 |
| money gain | the coin (B5→E6); a third note from $2,000 and a fourth plus shimmer from $10,000 | −26 |
| money loss | a gentle "aw" (a minor third down over a soft thud) | −27 |
| achievement | a bell arpeggio to a ringing C | −26 |
| level up | a mallet run into a bell chord | −25 |
| victory | a short brass fanfare with bells | −18 |
| warning | "uh-oh" (down a major third) | −27 |
| error | a muted double bonk, no buzz | −26 |
| notification | up a fourth, resolved | −26 |

No sound has more than about 10% of its energy above 4 kHz. None clips or clicks.

**The city soundscape, rebuilt** (`components/town/townAtmosphere.ts`, recipes in `townSfx`):
- **Wind:** gusts every few seconds. The brown-noise loop is levelled at its seam; the old loop thumped every two seconds.
- **Rain:** a lowpassed wash plus a light hiss and drops on puddles. Indoors it's muffled on the roof.
- **The fountain:** babbling water whose pitch and level wander, a low splash and falling drops, heard only when close.
- **Crickets after dark:** three crickets, each with its own pitch, place and steady rhythm, as real ones have.
- **Songbirds on dry days:** a two-note whistle, a trill and a warble, panned around the square.
- **Footsteps:** alternating feet, varied so they don't machine-gun; a tap with room echo indoors; a splash when wet.
- **Cars:** tyre roar and an engine note, both dropping in pitch as the car passes (Doppler). The sound pans out to the side the car leaves on, measured from the camera.
- **Fireworks:** a boom, a thump and a crackle for every burst, replacing an arpeggio on every third. Freedom Day's endless show plays them quieter.
- **The café:** a counter bell for an order, a two-note "ready", a mallet run for a served cup, the shared ka-ching for a tip, a soft fall when a guest leaves.
- **Fade:** it fades in over 1.5 s and out over 0.15 s, so there's no click on the toggle.

City levels (RMS):

| Place | Level |
|---|---|
| Bank | −50 dBFS |
| Street by day | −43 |
| Street at night | −44 |
| By the fountain | −36 |
| In the rain | −35 |

**One sound switch.** The city's Sound button now shows and sets the game's sound setting, the same one as Quick actions → Mute. Before, "Sound off" in the city still let purchase beeps play, and the city started muted on every visit. Now the city's soundscape plays whenever the game's sound is on, starting on the player's first click. Money Quest's square keeps its own switch; turning it on also lifts a mute left over from the adult game.

## Checks

- **Tests:** `test/Sound.test.ts` (20 tests) uses a recording Web Audio fake that, like real browsers, throws on an exponential ramp to zero. It checks:
  - every UI sound is short, stops by itself and stays under 0.04 per voice;
  - the coin gains notes with the amount;
  - every envelope starts from silence;
  - no oscillator drives a volume control. This check fails on the old `townAtmosphere.ts` (verified) and passes on the new one;
  - the city's beds stay under budget in every place and weather, and every city recipe plays;
  - the engine shares one context, is silent when muted, drops the toast chime after an action sound, and waits for the first click before starting the city.
- **Suite:** 518 tests / 89 files, `tsc` and the production build pass. The dev-only `window.__audio` meter handle is not in the production bundle.
- **Live, in the dev build** (browser pane, a new Alex game on `127.0.0.1:5191`, measured with an `AnalyserNode` on the engine's output):
  - month turn: peak −28 dBFS;
  - street: −41 dBFS RMS;
  - walking the street with traffic: peak −29, RMS −46;
  - **at the bank teller, sound switched off and on again (Pieter's steps): −54 dBFS RMS, peak −41, the 4.2–4.4 kHz band at −125 dB**;
  - "Sound off" suspends the audio context;
  - no console errors or autoplay warnings.
- **Not checked:** the ear test. The sounds were designed from standard synthesis recipes and tuned by measurement, and nobody has listened to them yet. The files in `audio/` are for that.

## Listening files (`audio/`)

| File | What |
|---|---|
| `bank-before-then-after.m4a` | **Turn the volume down first.** 3 s of the old bank whine, a second of silence, then the new bank with footsteps and a purchase |
| `before-ui-sequence.m4a`, `after-ui-sequence.m4a` | the twelve UI sounds, one a second, in the order of the table above |
| `after-ui-coin-small-medium-large.m4a` | the money-gain coin at $300, $4,000 and $25,000 |
| `after-city-street-day.m4a` | wind, footsteps, three birds and a passing car |
| `after-city-by-the-fountain.m4a` | the fountain up close |
| `after-city-street-night.m4a` | crickets |
| `after-city-street-rain.m4a` | rain and wet footsteps |
| `after-city-bank.m4a` | the bank's room tone, indoor footsteps and a purchase |
| `after-city-car-firework-cafe.m4a` | a car passing, a firework, then the six café sounds (order, ready, served, tip, left, celebrate) |

The offline renders place the timer-driven events (birds, crickets, drops) by hand, because offline rendering skips timers. The live game schedules them four times a second.

## Not changed

- Kids mode (Money Quest) still has no interface sounds of its own, only the square's soundscape.
- There is no music.
