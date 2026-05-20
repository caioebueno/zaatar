# Feedback API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## List Feedback

`GET /feedback`  
`GET /feedbacks`

Both paths return the same data.

### Query Params

| Param | Required | Description |
|---|---|---|
| `from` | No | Start date/datetime filter |
| `to` | No | End date/datetime filter |
| `timezone` | No | IANA timezone for date interpretation |
| `sentiment` | No | Filter by sentiment (e.g. `positive`, `negative`, `neutral`) |
| `limit` | No | Maximum number of results to return |

### Success (`200`)

Returns an array of feedback entries for the active business.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "<field-name>" }
```
