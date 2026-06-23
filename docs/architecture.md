# Architecture

Daedalus Platform is the platform layer between Daedalus Capture and Daedalus Main.

It owns active platform services, not local acquisition workflows and not the reasoning kernel.

```text
Capture -> Platform -> Main
              |
              v
Property -> Twin -> Evidence -> Commit -> Merge -> Archive
```

## Boundaries

- Capture owns local-first acquisition.
- Platform owns identity, active metadata, synchronization, object orchestration, and lifecycle APIs.
- Main owns reasoning, analysis, and explanation.

## Persistence

- D1 stores active relational metadata.
- R2 stores active binary objects.
- NAS stores long-term archive material.

