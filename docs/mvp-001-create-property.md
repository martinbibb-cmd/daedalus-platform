# MVP-001: Create Property

## Goal

Create the first working platform slice for Daedalus: a Property can be created, stored in D1, and retrieved by ID.

## Acceptance Criteria

- Worker deployed
- D1 connected
- `POST /property`
- `GET /property/:id`
- Property stored successfully
- No users, organisations, auth, permissions, billing, Twins, evidence uploads, or sync engine

## API

### `POST /property`

Request:

```json
{
  "propertyId": "test-property-001",
  "propertyName": "Martin Test Property"
}
```

Response:

```json
{
  "property": {
    "propertyId": "test-property-001",
    "propertyName": "Martin Test Property",
    "createdAt": "2026-06-23T00:00:00.000Z"
  }
}
```

### `GET /property/:id`

Returns the stored Property or `404` when no Property exists for the ID.
