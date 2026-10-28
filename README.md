# UNO Cards Web

A browser-based UNO-style card game built with React, TypeScript and Vite. This repository is separate from the original Python card generator.

## Current MVP
- Play against three local AI opponents
- Seven-card starting hands and a shuffled deck
- Match by color or value
- Wild color selection
- Skip, Reverse, Draw Two and Wild Draw Four cards
- Draw pile recycling, turn indicator and win screen
- Responsive layout for desktop and mobile

## Run locally
Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Important notes
This is an early playable prototype, not yet an official UNO rules implementation. Multiplayer, authoritative server validation, accounts, persistent stats, and automated rules tests are future milestones. Wild Draw Four challenge rules and some official-rule edge cases are not implemented yet.

## Roadmap
1. Add automated tests and tighten rules/state transitions.
2. Improve AI behavior and turn UX.
3. Deploy the static app to Cloudflare Pages.
4. Add online rooms with Cloudflare Workers and Durable Objects.
5. Add optional match history and player profiles.

## License
Choose and add a license before redistributing the project.
