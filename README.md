# 💰 Tycoon: Financial Freedom Simulator v3.4.3

## Continue the current work

**Start with [HANDOVER.md](HANDOVER.md).** The September 5 financial-learning and 3D city/café upgrades are implemented and tested in the local preview at `http://127.0.0.1:5187/`; they have **not** been committed, pushed or publicly deployed. The working folder includes important untracked source/assets. Latest code checks: 236 tests / 38 files and production build passed; real-phone testing remains open.

See [gameplay overview](docs/gameplay-foundation-and-3d.md), [implementation receipt](docs/completed-improvements.md) and [QA checklist](docs/qa-checklist.md). Existing cloud, payment and historical deployment notes below do not establish that the new features are live.

A fun and educational financial simulation game with **four modes**:
- **Adult Mode**: Full realistic financial simulation with careers, real estate, stocks, education, and life events
- **Daily Challenge**: everyone plays the same seeded world each day — a 10-year sprint scored by final net worth, with a shareable run card, streaks, and a daily leaderboard
- **Kids Mode**: Simplified money management game for ages 8-10
- **Multiplayer**: race friends to financial freedom at the same table (full version)

Progress can sync across devices via cloud saves (private sync code or an email-linked account).

## 🔓 Access Model

- **Free demo**: 36 in-game months of the adult simulation + full kids mode, no code needed
- **Full game**: unlocked with an access code (validated server-side; supports Gumroad license keys) — see [docs/monetization-setup.md](docs/monetization-setup.md)
- **Multiplayer**: full version only

## 📚 Project Docs

- [CLAUDE.md](CLAUDE.md) — quick orientation: commands, architecture and historical service notes; read HANDOVER.md first
- [docs/roadmap.md](docs/roadmap.md) — current priorities followed by archived roadmap history
- [docs/monetization-setup.md](docs/monetization-setup.md) — how to start selling (Gumroad + Netlify env)
- [docs/b2b-classroom-packs.md](docs/b2b-classroom-packs.md) + [docs/outreach-drafts.md](docs/outreach-drafts.md) — B2B classroom offer: strategy + ready-to-paste copy
- [docs/architecture-map.md](docs/architecture-map.md) — deeper technical map (HISTORICAL snapshot; see banner)

## 🎮 How to Play

### Installation
```bash
npm install
npm run dev
```
Then open http://localhost:5173

In dev builds the access code `Bokke` unlocks the full game locally. To test the
real code validation, run `netlify dev` instead of `npm run dev`.

## 🧒 Kids Mode Features (Ages 8-10)

### Characters
- 🎨 Alex the Artist
- 🔬 Sam the Scientist  
- ⚽ Jordan the Athlete
- 💻 Taylor the Tech Kid
- 🐕 Riley the Pet Lover
- 🧁 Casey the Chef

### Ways to Earn Money
- 🍋 Lemonade Stand
- 🐕 Dog Walking
- 🚗 Car Wash Helper
- 🍂 Yard Helper
- 🎨 Craft Sales
- 🍪 Bake Sales
- 📚 Homework Helper
- 🐱 Pet Sitting
- ♻️ Recycling Collector

### Savings Goals
- 🚲 New Bike ($150)
- 🎮 Gaming Console ($300)
- 📱 First Phone ($200)
- 🐹 Pet Supplies ($100)
- 🏕️ Summer Camp ($250)
- 💻 Laptop ($400)
- 🛹 Skateboard ($80)
- 🎨 Art Kit ($60)

### Kid-Friendly Life Events
- 🎂 Birthday money
- 🦷 Tooth fairy visits
- 👴 Grandparent gifts
- 📝 Good grades rewards
- 🎄 Holiday money
- ⭐ Chore bonuses
- Fun choices like ice cream trucks and school fairs!

### Learning Concepts
- Saving money for goals
- Earning through work
- Making spending choices
- Delayed gratification
- Basic budgeting

## 👔 Adult Mode Features

### Life Events System (39 events!)
- 💰 Taxes & Audits
- ⚖️ Legal Issues  
- 👨‍👩‍👧 Family Emergencies
- 🏥 Medical Events
- 📉 Economic Cycles & Recessions
- 🚗 Vehicle Issues
- 💕 Marriage & Family
- 🏠 Housing Events
- 🎉 Windfalls
- 🤖 AI Disruption

### Career Paths (8 careers)
- 💻 Technology
- 💰 Finance
- 🏥 Healthcare
- 🔧 Skilled Trades
- 🎨 Creative
- 🚀 Entrepreneur
- 🏛️ Government
- 💼 Sales

### Financial Systems
- 📈 Stock market with volatility
- 🏠 Real estate with mortgages
- 🎓 Education system with 25+ programs
- 💳 Loans (5 types)
- 💼 Side hustles (12 options)
- 📊 Progressive tax brackets
- 💍 Marriage & children expenses

### Economic Simulation
- Market cycles (Expansion → Peak → Contraction → Trough)
- Recessions affecting salaries and investments
- Inflation affecting lifestyle costs
- Interest rates affecting mortgages
- AI disruption affecting careers

## 🎯 How to Win

### Kids Mode
Pick a savings goal and earn enough money to reach it!

### Adult Mode  
Generate enough passive income to cover 110% of your recurring expenses (financial freedom!)

## 📱 Compatibility

Works on desktop and mobile browsers. Responsive design adapts to screen size.

## 🔊 Sound

Toggle sound on/off with the speaker icon. Fun sound effects for money earned, purchases, and achievements!

---

**v3.4.x** — Daily Challenge + leaderboard, cloud saves & accounts, run
summary cards, learning counterfactuals (sell hindsights + year-in-review),
free demo / paid unlock, Kids Mode, Multiplayer
