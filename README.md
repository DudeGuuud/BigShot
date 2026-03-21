# BigShot - EVE Frontier Bounty Interdiction System

BigShot is a decentralized bounty system built on the EVE Frontier Smart World framework using Sui Move. It allows players (issuers) to place trustless kill bounties on other players' characters. Hunters can claim these bounties by submitting verifiable proof of termination (Killmails) registered on-chain.

## 🚀 Features

- **Trustless Escrow**: Bounties are locked in a shared `BigShot Treasury` object on the Sui network.
- **Verifiable Interdictions**: Bounties can only be claimed using authenticated `Killmail` records from the EVE Frontier Killmail Registry, completely preventing fraud.
- **Tactical Intelligence**: Leverages live on-chain interaction data (Gate Jumps, Storage Deposits/Withdrawals) alongside Killmails to generate a chronological Target Timeline.
- **Auto-Asset Management**: Integrates seamlessly with EVE Vault to fetch owned LUX or EVE tokens dynamically to fund bounties.
- **Persistent Identity**: Uses a local storage context to remember your `character_id` across sessions.
- **Premium Aesthetics**: Industrial, utilitarian frontend built with Radix UI, Framer Motion, and pure CSS to mimic the immersive EVE terminal experience.

## 📁 Architecture Overview

```text
├── bigshot_extension/     # Sui Move Smart Contracts
│   ├── sources/
│   │   ├── bigshot.move   # Core bounty system logic
│   │   └── config.move    # Extension configuration
│   └── Move.toml
└── dapps/                 # Frontend React Application (Vite)
    ├── src/
    │   ├── components/    # Reusable UI (ThreatBadge, TacticalTimelineModal, etc.)
    │   ├── context/       # Global State (BigShotContext for character ID)
    │   ├── hooks/         # On-chain query hooks (GraphQL + Sui RPC)
    │   ├── pages/         # Core views (Contract Board, Detail, Post Bounty)
    │   ├── transactions/  # Sui PTB Builders (Claim, Create)
    │   ├── constants.ts   # Envs and Contract Object IDs
    │   └── utils/         # Formatting utilities
    ├── index.html
    └── package.json
```

## 🛠 Prerequisites & Installation

- Node.js >= 18
- `bun` or `pnpm`
- Sui CLI (for smart contract deployment)

```bash
# Clone the repository
cd bigshot-frontend/dapps

# Install dependencies
bun install

# Start development server
bun run dev
```