# 🚰 Water Source Inventory Module

## Overview

The Water Source Inventory module enables crowdsourced mapping and monitoring of water sources across communities. Users can submit, view, and update information about wells, public taps, rivers, lakes, and bowser points with geospatial capabilities.

## Features

✅ **Geospatial Indexing**: MongoDB 2dsphere index for location-based queries  
✅ **Duplicate Prevention**: Automatic check for existing sources within 20 meters  
✅ **Nearby Search**: Find water sources within a specified radius (up to 50km)  
✅ **Soft Delete**: Preserve historical data with `is_deleted` flag  
✅ **Verification System**: Moderators can verify water source legitimacy  
✅ **Status Tracking**: Monitor operational status (Functional, Broken, Maintenance, Abandoned)  
✅ **Access Control**: Role-based permissions for updates and deletions  
✅ **Filtering & Pagination**: Query by type, status, access type, and verification status

---

## Data Model

### WaterSource Schema

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Display name (e.g., "Community Well #4") |
| `type` | Enum | Well, Public Tap, River, Lake, Bowser Point |
| `location` | GeoJSON Point | {type: "Point", coordinates: [lng, lat]} |
| `operational_status` | Enum | Functional, Broken, Maintenance, Abandoned |
| `access_type` | Enum | Public, Private, Restricted |
| `verified` | Boolean | Whether source is verified by moderator |
| `created_by` | ObjectId | User who created the entry |
| `verified_by` | ObjectId | User who verified (if applicable) |
| `verified_at` | Date | Verification timestamp |
| `description` | String | Additional notes (max 1000 chars) |
| `is_deleted` | Boolean | Soft delete flag |
| `deleted_by` | ObjectId | User who deleted |
| `deleted_at` | Date | Deletion timestamp |
| `createdAt` | Date | Auto-generated creation timestamp |
| `updatedAt` | Date | Auto-generated update timestamp |

### Indexes

- **2dsphere Index** on `location` - Enables geospatial queries
- **Compound Index** on `{type: 1, operational_status: 1}` - Fast filtering
- **Index** on `{is_deleted: 1, createdAt: -1}` - Efficient non-deleted queries

---

## API Endpoints

### 1. Create Water Source

```http
POST /api/v1/water-sources
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Community Well #4",
  "type": "Well",
  "location": {
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "operational_status": "Functional",
  "access_type": "Public",
  "description": "Main well serving 50+ families"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Water source created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Community Well #4",
    "type": "Well",
    "location": {
      "type": "Point",
      "coordinates": [79.8612, 6.9271]
    },
    "operational_status": "Functional",
    "access_type": "Public",
    "verified": false,
    "created_by": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2026-02-14T10:30:00.000Z"
  }
}
```

**Duplicate Prevention:**
- Automatically checks for existing sources within 20 meters
- Returns `409 Conflict` if duplicate detected

---

### 2. Get All Water Sources

```http
GET /api/v1/water-sources?type=Well&operational_status=Functional&page=1&limit=10
```

**Query Parameters:**
- `type` - Filter by type (Well, Public Tap, River, Lake, Bowser Point)
- `operational_status` - Filter by status (Functional, Broken, Maintenance, Abandoned)
- `access_type` - Filter by access (Public, Private, Restricted)
- `verified` - Filter by verification (true/false)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 100)
- `sort` - Sort field (createdAt, -createdAt, name, -name)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Water sources retrieved successfully",
  "data": {
    "sources": [...],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3. Get Nearby Water Sources (Geospatial)

```http
GET /api/v1/water-sources/nearby?latitude=6.9271&longitude=79.8612&radius=5000&type=Well
```

**Query Parameters:**
- `latitude` - **Required** - User's current latitude
- `longitude` - **Required** - User's current longitude
- `radius` - Search radius in meters (default: 5000, max: 50000)
- `type` - Optional filter by type
- `operational_status` - Optional filter by status

**Geospatial Logic:**
- Uses MongoDB `$near` operator with 2dsphere index
- Results automatically sorted by distance (nearest first)
- `$maxDistance` defines search radius in meters

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Found 3 water source(s) within 5000m",
  "data": {
    "sources": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Community Well #4",
        "type": "Well",
        "operational_status": "Functional",
        "location": {
          "type": "Point",
          "coordinates": [79.8612, 6.9271]
        }
      }
    ],
    "count": 3,
    "center": {
      "latitude": 6.9271,
      "longitude": 79.8612
    },
    "radius": 5000
  }
}
```

---

### 4. Get Water Source by ID

```http
GET /api/v1/water-sources/:id
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Water source retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Community Well #4",
    "type": "Well",
    "location": {
      "type": "Point",
      "coordinates": [79.8612, 6.9271]
    },
    "operational_status": "Functional",
    "access_type": "Public",
    "verified": true,
    "created_by": {...},
    "verified_by": {...},
    "recentReports": []  // Placeholder for water quality reports
  }
}
```

---

### 5. Update Operational Status

```http
PATCH /api/v1/water-sources/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Access:** Authenticated users (preferably verified users or admins)

**Request Body:**
```json
{
  "operational_status": "Broken",
  "notes": "Pump motor not working, requires immediate repair"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operational status updated from 'Functional' to 'Broken'",
  "data": { ... }
}
```

---

### 6. Update Water Source Details

```http
PATCH /api/v1/water-sources/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Access:** Creator, Moderator, or Admin only

**Request Body:** (all fields optional, at least one required)
```json
{
  "name": "Updated Well Name",
  "type": "Well",
  "operational_status": "Maintenance",
  "access_type": "Public",
  "description": "Updated description"
}
```

---

### 7. Verify Water Source

```http
PATCH /api/v1/water-sources/:id/verify
Authorization: Bearer <token>
```

**Access:** Moderator or Admin only

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Water source verified successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "verified": true,
    "verified_by": {...},
    "verified_at": "2026-02-14T11:00:00.000Z"
  }
}
```

---

### 8. Soft Delete Water Source

```http
DELETE /api/v1/water-sources/:id
Authorization: Bearer <token>
```

**Access:** Creator, Moderator, or Admin only

**Soft Delete Logic:**
- Sets `is_deleted = true`
- Records `deleted_by` and `deleted_at`
- Preserves data for historical records
- Excluded from all queries automatically

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Water source deleted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

---

### 9. Get Statistics

```http
GET /api/v1/water-sources/stats
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 150,
    "verified": 120,
    "unverified": 30,
    "byType": {
      "Well": 80,
      "Public Tap": 45,
      "River": 15,
      "Lake": 7,
      "Bowser Point": 3
    },
    "byStatus": {
      "Functional": 130,
      "Broken": 10,
      "Maintenance": 8,
      "Abandoned": 2
    },
    "byAccessType": {
      "Public": 140,
      "Private": 8,
      "Restricted": 2
    }
  }
}
```

---

## Geospatial Concepts Explained

### GeoJSON Point Format

MongoDB uses **GeoJSON** format for geospatial data:

```javascript
{
  type: "Point",
  coordinates: [longitude, latitude]  // ⚠️ Note: [lng, lat] order, NOT [lat, lng]
}
```

**Important:** GeoJSON standard uses `[longitude, latitude]` order (x, y in cartesian coordinates), which is opposite of the common `[lat, lng]` format used in Google Maps.

### 2dsphere Index

The 2dsphere index enables:
- **$near** - Find points near a location, sorted by distance
- **$geoWithin** - Find points within a polygon/circle
- **$geoIntersects** - Find geometries that intersect
- Accurate distance calculations using spherical geometry

### Distance Calculations

MongoDB uses **meters** for distance by default:
- 1 km = 1000 meters
- 5 km = 5000 meters
- Default search radius = 5000m (5km)
- Max search radius = 50000m (50km)

---

## Usage Examples

### Example 1: Find All Wells Within 2km

```javascript
GET /api/v1/water-sources/nearby
  ?latitude=6.9271
  &longitude=79.8612
  &radius=2000
  &type=Well
```

### Example 2: Find Functional Public Taps

```javascript
GET /api/v1/water-sources
  ?type=Public Tap
  &operational_status=Functional
  &access_type=Public
  &verified=true
```

### Example 3: Report Broken Well

```javascript
PATCH /api/v1/water-sources/507f1f77bcf86cd799439011/status
{
  "operational_status": "Broken",
  "notes": "Water pump stopped working on 2026-02-14"
}
```

---

## Permission Matrix

| Action | User | Moderator | Admin |
|--------|------|-----------|-------|
| View sources | ✅ | ✅ | ✅ |
| Create source | ✅ | ✅ | ✅ |
| Update own source | ✅ | ✅ | ✅ |
| Update any source | ❌ | ✅ | ✅ |
| Update status | ✅* | ✅ | ✅ |
| Verify source | ❌ | ✅ | ✅ |
| Delete own source | ✅ | ✅ | ✅ |
| Delete any source | ❌ | ✅ | ✅ |

*All authenticated users can update operational status (community monitoring)

---

## Integration Points

### With Water Quality Reports

When integrating with the water testing module:

1. Add `source_id` reference in WaterTest model
2. Update `getSourceById` controller to fetch related reports
3. Enable filtering reports by source location

```javascript
// Future integration example
const recentReports = await WaterTest.find({
  source_id: waterSourceId,
  status: 'APPROVED'
})
.limit(5)
.sort('-createdAt');
```

---

## Testing Recommendations

### Unit Tests
- Model validation (coordinates, enums)
- Duplicate detection logic
- Soft delete functionality
- Permission checks

### Integration Tests
- Create source with duplicate prevention
- Geospatial nearby search
- Filtering and pagination
- Status updates by different roles
- Verification workflow

### Geospatial Tests
```javascript
// Test duplicate detection within 20m
// Test nearby search with various radii
// Test coordinate validation
// Test GeoJSON format conversion
```

---

## Future Enhancements

- [ ] Photo uploads for water sources
- [ ] Community ratings and reviews
- [ ] Water availability schedules
- [ ] Offline mobile sync for field workers
- [ ] Heat map visualization
- [ ] Route optimization for water delivery
- [ ] Integration with government water supply database
- [ ] SMS notifications for status changes
- [ ] Multi-language support
- [ ] Historical status tracking

---

## Files Created

1. **Model**: `src/models/WaterSource.model.js`
2. **Controller**: `src/controllers/waterSource.controller.js`
3. **Routes**: `src/routes/waterSource.routes.js`
4. **Validation**: `src/validations/waterSource.validation.js`
5. **Updated**: `src/routes/index.js`

---

## MongoDB Shell Queries

### Create 2dsphere index manually (if needed)
```javascript
db.watersources.createIndex({ location: "2dsphere" })
```

### Find sources within 1km of a point
```javascript
db.watersources.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [79.8612, 6.9271]
      },
      $maxDistance: 1000
    }
  },
  is_deleted: false
})
```

### Count sources by type
```javascript
db.watersources.aggregate([
  { $match: { is_deleted: false } },
  { $group: { _id: "$type", count: { $sum: 1 } } }
])
```

---

## Support

For issues or questions about the Water Source Inventory module:
1. Check this documentation
2. Review the API documentation at `/api/v1/docs`
3. Test endpoints using the health check: `/api/v1/health`

---

**Module Status**: ✅ Production Ready  
**Last Updated**: February 14, 2026  
**Version**: 1.0.0
