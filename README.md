# Daedalus Platform

Daedalus Platform provides the active cloud services for the Daedalus ecosystem.

## Responsibilities

- Property identity management
- Property Twin lifecycle
- Import and export services
- Synchronization
- Active metadata storage
- Evidence storage orchestration
- Archive coordination

## Non-responsibilities

- Capture workflows
- Main reasoning kernel
- AI truth generation
- Recommendations
- Commercial decision making

## Architecture

```text
Property
-> Twin
-> Evidence
-> Commit
-> Merge
-> Archive
```

## Storage Model

- D1: active metadata
- R2: active binary objects
- NAS: long-term archive
- Main: reasoning and explanation
- Capture: local-first acquisition

## MVP-001: Create Property

Acceptance criteria:

- Worker deployed
- D1 connected
- `POST /property`
- `GET /property/:id`
- Property stored successfully

## Local Development

Install dependencies:

```sh
npm install
```

Run tests:

```sh
npm test
```

Run locally with Wrangler:

```sh
npm run dev
```

Create and apply a local D1 database:

```sh
npx wrangler d1 create daedalus-platform
npx wrangler d1 migrations apply daedalus-platform --local
```

