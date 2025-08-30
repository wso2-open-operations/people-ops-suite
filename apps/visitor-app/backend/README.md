# Visitor Management API

## Version: 1.0.0

**Base URL:** `{server}:{port}/`  
Default: `http://localhost:9090/`

---

## Endpoints

### **/user-info**

#### GET

Fetch logged-in user's details.

**Responses:**

- **200 OK**

```json
{
  "employeeId": "E123",
  "workEmail": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "jobRole": "Software Engineer",
  "employeeThumbnail": "https://example.com/thumbnails/john_doe",
  "privileges": [101, 202]
}
```

- **500 Internal Server Error**

---

### **/visitors/{hashedNIC}**

#### GET

Fetches a specific visitor by hashed NIC number.

**Parameters:**

| Name      | In   | Type   | Required | Description                  |
| --------- | ---- | ------ | -------- | ---------------------------- |
| hashedNIC | path | string | Yes      | Hashed NIC number of visitor |

**Responses:**

- **200 OK**

```json
{
  "nicHash": "hashed123",
  "name": "Alice",
  "nicNumber": "123456789V",
  "contactNumber": "0771234567",
  "email": "alice@example.com",
  "createdBy": "admin",
  "createdOn": "2025-01-01T10:00:00Z",
  "updatedBy": "admin",
  "updatedOn": "2025-01-10T15:00:00Z"
}
```

- **400 Bad Request**, **404 Not Found**, **500 Internal Server Error**

---

### **/visitors**

#### POST

Create a new visitor.

**Request Body:**

```json
{
  "nicHash": "hashed123",
  "name": "Alice",
  "nicNumber": "123456789V",
  "contactNumber": "0771234567",
  "email": "alice@example.com"
}
```

**Responses:**

- **201 Created**
- **400 Bad Request**, **500 Internal Server Error**

---

### **/visits**

#### GET

Fetch visits based on filters.

**Query Parameters:**

| Name   | In    | Type  | Required | Description                     |
| ------ | ----- | ----- | -------- | ------------------------------- |
| limit  | query | int64 | No       | Limit number of visits to fetch |
| offset | query | int64 | No       | Offset for pagination           |

**Responses:**

- **200 OK**

```json
{
  "totalCount": 2,
  "visits": [
    {
      "id": 1,
      "name": "Alice",
      "nicNumber": "123456789V",
      "contactNumber": "0771234567",
      "email": "alice@example.com",
      "companyName": "Tech Corp",
      "passNumber": "PASS001",
      "whomTheyMeet": "John Doe",
      "purposeOfVisit": "Business Discussion",
      "accessibleLocations": [{ "floor": "1", "rooms": ["101", "102"] }],
      "timeOfEntry": "2025-03-31T12:00:00Z",
      "timeOfDeparture": "2025-03-31T14:00:00Z",
      "status": "PENDING",
      "createdBy": "admin",
      "createdOn": "2025-03-30T10:00:00Z",
      "updatedBy": "admin",
      "updatedOn": "2025-03-30T12:00:00Z"
    }
  ]
}
```

- **400 Bad Request**, **500 Internal Server Error**

#### POST

Create a new visit.

**Request Body:**

```json
{
  "nicHash": "hashed123",
  "companyName": "Tech Corp",
  "passNumber": "PASS001",
  "whomTheyMeet": "John Doe",
  "purposeOfVisit": "Business Discussion",
  "accessibleLocations": [{ "floor": "1", "rooms": ["101", "102"] }],
  "timeOfEntry": "2025-03-31T12:00:00Z",
  "timeOfDeparture": "2025-03-31T14:00:00Z"
}
```

**Responses:**

- **201 Created**
- **400 Bad Request**, **500 Internal Server Error**

---

## Schemas

### **UserInfo**

- Inherits from `Employee`
- Adds:
  - `privileges`: Array of integers (privileges assigned to the user)

### **Employee**

- `firstName` (string)
- `lastName` (string)
- `employeeId` (string)
- `employeeThumbnail` (string, nullable)
- `workEmail` (string)
- `jobRole` (string)

### **Visitor**

- Inherits from `AddVisitorPayload` and `AuditFields`

### **AddVisitorPayload**

- `nicHash` (string)
- `name` (string)
- `nicNumber` (string)
- `contactNumber` (string)
- `email` (string, nullable)

### **AddVisitPayload**

- `nicHash` (string)
- `companyName` (string, nullable)
- `passNumber` (string)
- `whomTheyMeet` (string)
- `purposeOfVisit` (string)
- `accessibleLocations` (array of Floor)
- `timeOfEntry` (string, UTC)
- `timeOfDeparture` (string, UTC)

### **DatabaseAddVisitPayload**

- Inherits from `AddVisitPayload`
- Adds:
  - `status` (Status enum)

### **AuditFields**

- `createdBy`, `updatedBy` (string)
- `createdOn`, `updatedOn` (string)

### **Visit**

- Inherits from `DatabaseAddVisitPayload` and `AuditFields`
- Adds visitor personal info:
  - `id` (int64)
  - `name`, `nicNumber`, `contactNumber`, `email`

### **VisitsResponse**

- `totalCount` (int64)
- `visits` (array of Visit)

### **Floor**

- `floor` (string)
- `rooms` (array of strings)

### **Status**

- Enum: `REJECTED`, `ACCEPTED`, `PENDING`

### **ErrorPayload**

- `timestamp` (string)
- `status` (integer)
- `reason` (string)
- `message` (string)
- `path` (string)
- `method` (string)
