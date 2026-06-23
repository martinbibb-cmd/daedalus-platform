# MVP-001: Create Property

## Goal

Create the first working platform slice for Daedalus: a Property can be created, stored in D1, and retrieved by ID.

## Acceptance Criteria

- Worker deployed
- D1 connected
- `POST /property`
- `GET /property/:id`
- Property stored successfully

## API

### `POST /property`

Request:

```json
{
  "displayName": "1 Example Street",
  "uprn": "100000000001",
  "address": "1 Example Street, Exampletown"
}
```

Response:

```json
{
  "property": {
    "id": "generated-id",
    "displayName": "1 Example Street",
    "uprn": "100000000001",
    "address": "1 Example Street, Exampletown",
    "createdAt": "2026-06-23T00:00:00.000Z",
    "updatedAt": "2026-06-23T00:00:00.000Z"
  }
}
```

### `GET /property/:id`

Returns the stored Property or `404` when no Property exists for the ID.

