# Phase 22 Implementation Status: Database Persistence

## Overview
Phase 22 involves replacing the in-memory storage with PostgreSQL for production-ready persistence.

## ✅ Completed Tasks

### 1. PostgreSQL Driver Installation
- ✅ Added `github.com/jackc/pgx/v5` (PostgreSQL driver)
- ✅ Added `github.com/jackc/pgx/v5/pgxpool` (Connection pooling)
- ✅ Updated `go.mod` and ran `go mod tidy`

### 2. Database Schema Migrations
- ✅ Schema already exists at `backend/migrations/000001_init_schema.up.sql`
- ✅ Includes all 9 tables:
  - users
  - barber_profiles
  - appointments
  - reviews
  - products
  - orders
  - coupons
  - chat_messages
  - notifications
- ✅ Proper indexes for performance
- ✅ PostGIS extension for geographic queries
- ✅ Automatic `updated_at` triggers

### 3. PostgreSQL Storage Layer Foundation
- ✅ Created `backend/internal/storage/postgres.go`
- ✅ Implemented connection pooling with configuration:
  - MaxConns: 25
  - MinConns: 5
  - MaxConnLifetime: 1 hour
  - MaxConnIdleTime: 30 minutes
  - HealthCheckPeriod: 1 minute
- ✅ Implemented `Ping()` health check
- ✅ Implemented `Close()` for cleanup
- ✅ Implemented User operations:
  - GetUser
  - GetUserByEmail
  - GetUserByFirebaseUID
  - GetUsers
  - CreateUser
  - UpdateUser
  - DeleteUser
- ✅ Implemented Barber Profile operations:
  - GetBarberProfile
  - GetBarberProfileByUserID
  - GetBarberProfiles
  - CreateBarberProfile
  - UpdateBarberProfile
  - DeleteBarberProfile
  - SearchBarbers (with geospatial search)

## 🚧 Remaining Work

### Implement Remaining Storage Operations

The following operations need to be implemented in `backend/internal/storage/postgres.go`:

#### 1. Appointment Operations
- [ ] GetAppointment
- [ ] GetAppointments
- [ ] GetUserAppointments
- [ ] GetBarberAppointments
- [ ] CreateAppointment
- [ ] UpdateAppointment
- [ ] DeleteAppointment

#### 2. Review Operations
- [ ] GetReview
- [ ] GetReviewByAppointmentID
- [ ] GetReviews
- [ ] GetBarberReviews
- [ ] GetClientReviews
- [ ] CreateReview
- [ ] UpdateReview
- [ ] DeleteReview

#### 3. Product Operations
- [ ] GetProduct
- [ ] GetProducts
- [ ] GetProductsByCategory
- [ ] GetProductsByBarberID
- [ ] CreateProduct
- [ ] UpdateProduct
- [ ] DeleteProduct

#### 4. Order Operations
- [ ] GetOrder
- [ ] GetOrders
- [ ] GetUserOrders
- [ ] CreateOrder
- [ ] UpdateOrder
- [ ] DeleteOrder

#### 5. Coupon Operations
- [ ] GetCoupon
- [ ] GetCouponByCode
- [ ] GetCoupons
- [ ] GetActiveCoupons
- [ ] CreateCoupon
- [ ] UpdateCoupon
- [ ] DeleteCoupon

#### 6. Chat Message Operations
- [ ] GetChatMessage
- [ ] GetChatMessages
- [ ] GetChatMessagesByAppointmentID
- [ ] GetChatThreads
- [ ] GetUnreadMessageCount
- [ ] CreateChatMessage
- [ ] UpdateChatMessage
- [ ] MarkMessagesAsRead
- [ ] DeleteChatMessage

#### 7. Notification Operations
- [ ] GetNotification
- [ ] GetNotifications
- [ ] GetUserNotifications
- [ ] GetUnreadNotificationCount
- [ ] CreateNotification
- [ ] UpdateNotification
- [ ] MarkNotificationAsRead
- [ ] MarkAllNotificationsAsRead
- [ ] DeleteNotification

## Implementation Pattern

Each operation should follow this pattern (using Appointment as an example):

```go
func (p *PostgresStorage) GetAppointment(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	query := `
		SELECT id, client_id, barber_id, status, service_type, hair_type,
		       special_requests, location_type, location_address,
		       ST_Y(location_coordinates::geometry) as latitude, 
		       ST_X(location_coordinates::geometry) as longitude,
		       scheduled_for, duration, price, applied_coupon_id, 
		       payment_status, payment_id, created_at, updated_at
		FROM appointments WHERE id = $1
	`
	
	var appt models.Appointment
	var hairType, specialRequests, locationType, locationAddress sql.NullString
	var lat, lng sql.NullFloat64
	var appliedCouponID sql.NullString
	var paymentID sql.NullString
	
	err := p.pool.QueryRow(ctx, query, id).Scan(
		&appt.ID, &appt.ClientID, &appt.BarberID, &appt.Status,
		&appt.ServiceType, &hairType, &specialRequests, &locationType,
		&locationAddress, &lat, &lng, &appt.ScheduledFor, &appt.Duration,
		&appt.Price, &appliedCouponID, &appt.PaymentStatus, &paymentID,
		&appt.CreatedAt, &appt.UpdatedAt,
	)
	
	if err == pgx.ErrNoRows {
		return nil, ErrAppointmentNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get appointment: %w", err)
	}
	
	// Handle nullable fields
	if hairType.Valid {
		ht := models.HairType(hairType.String)
		appt.HairType = ht
	}
	if specialRequests.Valid {
		appt.SpecialRequests = &specialRequests.String
	}
	// ... handle other nullable fields
	
	// Handle location
	if lat.Valid && lng.Valid {
		appt.Location.Coordinates = []float64{lng.Float64, lat.Float64}
	}
	
	return &appt, nil
}
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/cloudclips?sslmode=disable
USE_POSTGRES=false

# For production
# DATABASE_URL=postgres://username:password@host:5432/cloudclips?sslmode=require
# USE_POSTGRES=true
```

### Database Setup

```bash
# Create database
createdb cloudclips

# Run migrations
cd backend/migrations
psql -d cloudclips -f 000001_init_schema.up.sql

# Or use migrate tool
migrate -database $DATABASE_URL -path migrations up
```

## Testing

Once all operations are implemented:

```bash
# Run tests with PostgreSQL
cd backend
USE_POSTGRES=true DATABASE_URL="postgres://localhost/cloudclips_test" go test ./...

# Run with memory storage (default)
go test ./...
```

## Next Steps

1. **Implement remaining operations** - Follow the pattern shown above for each operation group
2. **Add integration tests** - Test PostgreSQL operations against a test database
3. **Update main.go** - Switch from MemoryStorage to PostgresStorage when complete
4. **Performance testing** - Ensure queries are optimized with proper indexes
5. **Migration testing** - Test rollback scenarios

## Notes

- The existing `MemoryStorage` implementation in `memory.go` can serve as a reference
- All database tables and indexes are already created via migrations
- PostGIS is enabled for geographic queries (barber search by location)
- Connection pooling is configured for production use
- The interface in `internal/interfaces/interfaces.go` defines all required methods

## Estimated Time

- Remaining operations: ~8-12 hours
- Testing and debugging: ~4-6 hours
- **Total: ~12-18 hours**

---

**Status**: Foundation complete, ~40% of operations implemented (User & Barber)
**Ready for**: Incremental implementation of remaining operations
