# @apps21/chat

Modern, high-performance, real-time glassmorphic web chat application for the `apps21` monorepo.

---

## Overview

`@apps21/chat` delivers a responsive, sleek dark glassmorphic web chat client served via Express and TypeScript. It integrates seamlessly with the `@apps21/api` backend over WebSockets and REST fallback.

### Key Features
* **Dark Glassmorphic UI**: Matches `apps21` pure neutral dark design with subtle cyan and indigo neon accents, blurred glass panels (`backdrop-filter: blur(16px)`), and modern typography (`Outfit` and `JetBrains Mono`).
* **Header & Status Indicators**: Real-time WebSocket connection state (Connected / Reconnecting / REST Fallback) and active room presence count.
* **Identity Bar**: Displays the active session handle (`Talking as: <displayName> (IP: <ip>)`), ephemeral vs claimed status badge, truncated device session token, and a quick-access "Claim Handle / Switch Account" button.
* **Claim Handle Modal**: Interactive dialog to claim a new handle with a password or unlock an existing password-protected handle across devices. Calls `POST /api/v1/chat/identity/claim` with `Authorization: Bearer <token>` and provides inline error validation.
* **Messages Stream**: Chronologically ordered messages with sender name, claimed vs guest badges, formatted timestamps, safe URL auto-linking, and distinct alignment (self messages aligned right with neon gradient cards, other messages aligned left, system events centered).
* **Auto-Scrolling & Jump-to-Bottom**: Smooth scroll to latest messages with a floating jump button and unread message counter when scrolled up.
* **Message Composer**: Auto-expanding textarea up to 160px, live character counter (max 2000 chars) with color alerts, Send button, and keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline).
* **Real-time WebSocket & Resilient Fallback**: Automatic handshake via `POST /api/v1/chat/identity/handshake` on load, connection to `/ws/chat?token=<token>`, heartbeat `PING`/`PONG` every 25s, exponential backoff reconnects, and automatic REST polling fallback if the WebSocket disconnects.
* **Strict XSS Protection**: All user strings (handles, message bodies, IPs) are fully escaped before rendering.

---

## Architecture & File Structure

```text
apps/chat/
├── package.json         # Workspace package manifest with scripts & dependencies
├── tsconfig.json        # TypeScript configuration (ES2022, NodeNext)
├── README.md            # Application documentation
├── src/
│   └── index.ts         # Express server entrypoint, proxy routing, and WS upgrade forwarding
├── public/
│   ├── index.html       # Semantic glassmorphic HTML layout
│   ├── styles.css       # Glassmorphic CSS tokens, components, and responsive layout
│   └── app.js           # Client application controller (WS, REST, XSS, modal, state)
└── tests/
    └── chat.test.ts     # Automated integration & component validation suite
```

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the chat web server | `3001` |
| `API_URL` | Target `@apps21/api` backend HTTP base URL | `http://localhost:5000` |
| `WS_URL` | Target `@apps21/api` WebSocket endpoint | `ws://localhost:5000/ws/chat` |

---

## Development & Build Commands

* **Run development server**:
  ```bash
  pnpm --filter @apps21/chat dev
  ```
* **Build production bundle**:
  ```bash
  pnpm --filter @apps21/chat build
  ```
* **Start production server**:
  ```bash
  pnpm --filter @apps21/chat start
  ```
* **Run validation tests**:
  ```bash
  pnpm --filter @apps21/chat test
  ```
