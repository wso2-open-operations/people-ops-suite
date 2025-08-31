# Visitor & Visits Management API

## Version: 1.0.0

Base URL: `{server}:{port}/`  
Default: `http://localhost:9090/`

---

## Endpoints

### `/user-info`

#### GET

**Summary:** Fetch logged-in user's details.

**Responses:**

| Code | Description |
| ---- | ----------- |
| 200  | OK <br/>    |

````json
{
  "employeeId": "E123",
  "firstName": "John",
  "lastName": "Doe",
  "workEmail": "john.doe@example.com",
  "jobRole": "Software Engineer",
  "employeeThumbnail": "https://example.com/thumbnails/john_doe",
  "privileges": [101, 102]
}
``` |
| 500  | Internal Server Error |

---

### `/visitors/{hashedNic}`

#### GET

**Summary:** Fetch a specific visitor by hashed NIC.

**Parameters:**

| Name       | In   | Description              | Required | Type   |
| ---------- | ---- | ------------------------ | -------- | ------ |
| hashedNic  | path | Hashed NIC number        | Yes      | string |

**Responses:**

| Code | Description |
| ---- | ----------- |
| 200  | OK <br/>
```json
{
  "nicHash": "hashed123",
  "name": "Jane Smith",
  "nicNumber": "123456789V",
  "contactNumber": "0771234567",
  "email": "jane.smith@example.com",
  "createdBy": "admin",
  "createdOn": "2025-08-30T10:00:00Z",
  "updatedBy": "admin",
  "updatedOn": "2025-08-30T10:00:00Z"
}
``` |
| 400  | Bad Request |
| 404  | Not Found   |
| 500  | Internal Server Error |

---

### `/visitors`

#### POST

**Summary:** Create a new visitor.

**Request Body:**

```json
{
  "nicHash": "hashed123",
  "name": "Jane Smith",
  "nicNumber": "123456789V",
  "contactNumber": "0771234567",
  "email": "jane.smith@example.com"
}
````

**Responses:**

| Code | Description           |
| ---- | --------------------- |
| 201  | Created               |
| 400  | Bad Request           |
| 500  | Internal Server Error |

---

### `/visits`

#### GET

**Summary:** Fetch visits based on filters.

**Query Parameters:**

| Name   | Description                     | Required | Type    |
| ------ | ------------------------------- | -------- | ------- |
| limit  | Limit number of visits to fetch | No       | integer |
| offset | Offset for pagination           | No       | integer |

**Responses:**

| Code | Description |
| ---- | ----------- |
| 200  | OK <br/>    |

````json
{
  "totalCount": 2,
  "visits": [
    {
      "id": 1,
      "nicHash": "hashed123",
      "name": "Jane Smith",
      "nicNumber": "123456789V",
      "contactNumber": "0771234567",
      "email": "jane.smith@example.com",
      "companyName": "ABC Corp",
      "passNumber": "V001",
      "whomTheyMeet": "John Doe",
      "purposeOfVisit": "Meeting",
      "accessibleLocations": [
        { "floor": "Ground", "rooms": ["Lobby"] }
      ],
      "timeOfEntry": "2025-08-30T09:00:00Z",
      "timeOfDeparture": "2025-08-30T11:00:00Z",
      "createdBy": "admin",
      "createdOn": "2025-08-30T08:50:00Z",
      "updatedBy": "admin",
      "updatedOn": "2025-08-30T08:55:00Z",
      "status": "ACCEPTED"
    }
  ]
}
``` |
| 400  | Bad Request |
| 500  | Internal Server Error |

#### POST

**Summary:** Create a new visit.

**Request Body:**

```json
{
  "nicHash": "hashed123",
  "companyName": "ABC Corp",
  "passNumber": "V001",
  "whomTheyMeet": "John Doe",
  "purposeOfVisit": "Meeting",
  "accessibleLocations": [
    { "floor": "Ground", "rooms": ["Lobby"] }
  ],
  "timeOfEntry": "2025-08-30T09:00:00Z",
  "timeOfDeparture": "2025-08-30T11:00:00Z"
}
````

**Responses:**

| Code | Description           |
| ---- | --------------------- |
| 201  | Created               |
| 400  | Bad Request           |
| 500  | Internal Server Error |

---

## Schemas

### `UserInfo`

Combination of `Employee` and privileges.

### `Employee`

```json
{
  "employeeId": "string",
  "firstName": "string",
  "lastName": "string",
  "workEmail": "string",
  "jobRole": "string",
  "employeeThumbnail": "string|null"
}
```

### `Visitor`

Visitor record with audit fields.

### `Visit`

Visit record with details, accessible locations, and audit fields.

### `AddVisitorPayload`

Payload for creating a visitor.

### `AddVisitPayload`

Payload for creating a visit.

### `Floor`

```json
{
  "floor": "string",
  "rooms": ["string"]
}
```

### `ErrorPayload`

```json
{
  "timestamp": "string",
  "status": 500,
  "reason": "string",
  "message": "string",
  "path": "string",
  "method": "GET"
}
```

### `VisitsResponse`

```json
{
  "totalCount": 0,
  "visits": []
}
```
