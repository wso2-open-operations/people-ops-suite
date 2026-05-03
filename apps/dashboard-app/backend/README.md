# Dashboard Backend API

This service powers the Dashboard application backend on `http://localhost:9090`.

## Authentication and Authorization

All endpoints are protected by the request interceptor.

- Header expected: `x-jwt-assertion`
- Missing/invalid header returns `401`/`400` depending on endpoint flow.
- Role checks:
  - Employee/Admin: read analytics, daily data, advertisements
  - Admin only: create/update/delete food waste and advertisement mutations

## API Surface

### User

#### `GET /user-info`
Fetch logged-in user profile and dashboard privileges.

Returns:
- `200` `UserInfoResponse`
- `500` on backend retrieval failures

---

### Food Waste

#### `POST /food-waste`
Create a breakfast/lunch food waste record.

Request body (`AddFoodWasteRecordPayload`):

```json
{
  "recordDate": "2026-03-05",
  "mealType": "BREAKFAST",
  "totalWasteKg": 12.5,
  "plateCount": 180
}
```

Returns:
- `201` created record
- `409` duplicate `(recordDate, mealType)`
- `403` insufficient privileges
- `400` bad request
- `500` internal server error

#### `GET /food-waste/daily?date=YYYY-MM-DD`
Get breakfast/lunch records for one day.

Returns:
- `200` `DailyFoodWasteRecords`
- `403`, `400`, `500`

#### `GET /food-waste`
List/filter food waste records and expose analytics modes.

Query params:
- `startDate` (optional, `YYYY-MM-DD`)
- `endDate` (optional, `YYYY-MM-DD`)
- `mealType` (optional: `BREAKFAST` or `LUNCH`)
- `duration` (optional: `weekly`, `monthly`, `yearly`)
- `latest` (optional boolean)
- `limit` (optional, default from backend)
- `offset` (optional, default `0`)

Returns by mode:
- Standard listing: `PaginatedFoodWasteRecords`
- `latest=true`: `TodayKPIs`
- `duration=weekly`: `WeeklyTrendItem[]`
- `duration=monthly|yearly`: `MonthlyTrendItem[]`

Errors:
- `403`, `400`, `500`

#### `PUT /food-waste/{id}`
Update an existing food waste record.

Request body (`UpdateFoodWasteRecordPayload`):

```json
{
  "totalWasteKg": 10.8,
  "plateCount": 165
}
```

Returns:
- `200` updated `FoodWasteRecord`
- `404` if record not found
- `403`, `400`, `500`

#### `DELETE /food-waste/{id}`
Delete a food waste record.

Returns:
- `204` no content
- `404` if record not found
- `403`, `400`, `500`

#### `GET /food-waste/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Get summary statistics for a date range.

Returns:
- `200` `DateRangeSummary`
- `403`, `400`, `500`

---

### Advertisements

#### `POST /advertisements`
Create a new advertisement.

Request body (`CreateAdvertisementPayload`):

```json
{
  "adName": "Lunch Promo",
  "mediaUrl": "https://cdn.example.com/ad-1.jpg",
  "mediaType": "IMAGE",
  "durationSeconds": 12
}
```

Returns:
- `201` created with `{ "id": <int> }`
- `403`, `400`, `500`

#### `GET /advertisements`
Get all advertisements.

Returns:
- `200` `Advertisement[]`
- `403`, `400`, `500`

#### `GET /advertisements/active`
Get currently active advertisement.

Returns:
- `200` `Advertisement`
- `404` if no active advertisement
- `403`, `400`, `500`

#### `PUT /advertisements/{id}/activate`
Activate an advertisement.

Returns:
- `200` success message
- `404` if advertisement not found
- `403`, `400`, `500`

#### `DELETE /advertisements/{id}`
Delete an advertisement.

Returns:
- `204` no content
- `400` when trying to delete active advertisement
- `404` if advertisement not found
- `403`, `500`

## Notes

- Date validation uses `YYYY-MM-DD` format.
- Food waste pagination enforces backend max page size.
- Error payloads generally follow `{ "message": "..." }`.
