# Build 28 — steer around people (QA build, 127.0.0.1:5188, Chrome, 2026-09-06 22:00–22:40 PDT)

Before the fix (build 27 code): destination "Rosa" from the cart; player position sampled once a second for 10 s: stuck at (1.44, 9.99), nearest resident (1.10, 9.50) at 0.62, queue customers at the cart. Every later destination click did nothing.

After `steerAround`: `walk(3.2, 9.6)` then `walk(-2.5, 9.6)` straight through the queue positions (1.1, 9.5) and (0.2, 9.5):
trail (-0.40, 9.01) → (-1.61, 9.35) → (-2.48, 9.59) arrived; closest approach to any resident 0.77.
Destination bar: Rosa reached at (-4.48, 7.98) with the "Talk about your month →" pill; Work reached at (15.69, 7.37) with "Go to work →"; Board opened at the fountain.

Café practice shift steps recorded: counter → three orders → machine → latte → deliver Mia → espresso → deliver Sam → latte Leo → summary "What did you keep?" (practice, no money changes). Console: no errors.
