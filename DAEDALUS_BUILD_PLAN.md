# Daedalus Build Plan Projection

This is the daedalus-platform projection of the canonical build plan. The
canonical authority lives in `Daedalus-contracts/DAEDALUS_BUILD_PLAN.md`.

## Shared Platform Direction

- Property is the root identity.
- Twin belongs to Property.
- Capture creates property-rooted Working Twins and Capture Sessions.
- Contracts define shared truth.
- Platform stores active Property, Twin, and import metadata.
- R2 stores package and media objects.
- Main imports, validates, explains, and renders evidence packs.
- AI may improve readability only; it is not source of truth.
- Users, billing, permissions, sync, and revenue models are deliberately deferred.

## Current Stage

Stage P0: Property-root Platform Foundation

Completed:

- property-root contracts
- Capture C3 property-root lifecycle
- Main P1/P2/D1 alignment
- Platform Property POC
- Platform Capture Package Import
- Platform Property Viewer
- Platform Property Dashboard v1

## Next Planned Tranches

These are planned, not implemented:

1. Live deploy verification
   - Confirm Cloudflare Worker routes.
   - Confirm D1 migrations applied remotely.
   - Confirm R2 write.
   - Import real Capture export.
   - View it in Platform Dashboard.
2. Main evidence-pack integration
   - Main can render an Evidence Pack from imported Platform data or stored package JSON.
   - Still no recommendations.
3. Capture upload handoff
   - Capture can export or share package to Platform import endpoint manually.
   - No full sync yet.
4. Data portability checkpoint
   - Confirm D1/R2 schema remains portable.
   - Export all property and import metadata as JSON.

## Repo Responsibility: daedalus-platform

Owns:

- Cloudflare Worker
- D1 active metadata
- R2 package/object storage
- property registry
- capture package import
- platform dashboard
- future sync boundary

Must not own:

- Main reasoning
- Capture UX
- AI truth creation
- recommendations
- billing or users yet

## Deferred Explicitly

Do not implement yet:

- user accounts
- roles
- permissions
- billing
- subscriptions
- enterprise hierarchy
- sync engine
- AI extraction
- recommendations
- compliance or legal judgement

## Anti-Drift Rules

- Any contract shape change must begin in Daedalus-contracts.
- Capture Swift mirror must be explicitly checked after contract changes.
- Main must validate package/import behaviour against shared contracts.
- Platform must validate API inputs against shared contracts.
- No repo may invent its own property-root semantics silently.
- Any cross-repo change must update this build-plan file.

## Verification

Run before merging changes in this repo:

```sh
npm test
npm run typecheck
git diff --check
npm exec wrangler deploy -- --dry-run
```
