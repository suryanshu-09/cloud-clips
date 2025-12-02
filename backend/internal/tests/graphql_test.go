package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"cloud-clips/internal/graphql"
	"cloud-clips/internal/storage"
	"github.com/graphql-go/handler"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGraphQLSchema_UsersQuery(t *testing.T) {
	// Setup
	store := storage.NewMemoryStorage()
	store.SeedMockData()

	schema, err := graphql.NewSchema(store)
	require.NoError(t, err)

	// Create GraphQL handler
	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	// Test query
	query := `{
		users {
			id
			name
			email
			role
		}
	}`

	requestBody := map[string]string{
		"query": query,
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/graphql", io.NopCloser(bytes.NewReader(bodyBytes)))
	req.Header.Set("Content-Type", "application/json")
	req.ContentLength = int64(len(bodyBytes))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	data, ok := response["data"].(map[string]interface{})
	require.True(t, ok)

	users, ok := data["users"].([]interface{})
	require.True(t, ok)
	assert.Len(t, users, 2) // We seeded 2 users
}

func TestGraphQLSchema_BarbersQuery(t *testing.T) {
	// Setup
	store := storage.NewMemoryStorage()
	store.SeedMockData()

	schema, err := graphql.NewSchema(store)
	require.NoError(t, err)

	// Create GraphQL handler
	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	// Test query
	query := `{
		barbers {
			id
			businessName
			bio
			rating
			user {
				name
				email
			}
		}
	}`

	requestBody := map[string]string{
		"query": query,
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/graphql", io.NopCloser(bytes.NewReader(bodyBytes)))
	req.Header.Set("Content-Type", "application/json")
	req.ContentLength = int64(len(bodyBytes))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	data, ok := response["data"].(map[string]interface{})
	require.True(t, ok)

	barbers, ok := data["barbers"].([]interface{})
	require.True(t, ok)
	assert.Len(t, barbers, 1) // We seeded 1 barber
}

func TestGraphQLSchema_AppointmentsQuery(t *testing.T) {
	// Setup
	store := storage.NewMemoryStorage()
	store.SeedMockData()

	schema, err := graphql.NewSchema(store)
	require.NoError(t, err)

	// Create GraphQL handler
	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	// Test query
	query := `{
		appointments {
			id
			status
			serviceType
			price
			client {
				name
			}
			barber {
				name
			}
		}
	}`

	requestBody := map[string]string{
		"query": query,
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/graphql", io.NopCloser(bytes.NewReader(bodyBytes)))
	req.Header.Set("Content-Type", "application/json")
	req.ContentLength = int64(len(bodyBytes))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	data, ok := response["data"].(map[string]interface{})
	require.True(t, ok)

	appointments, ok := data["appointments"].([]interface{})
	require.True(t, ok)
	assert.Len(t, appointments, 1) // We seeded 1 appointment
}

func TestGraphQLSchema_UserByIDQuery(t *testing.T) {
	// Setup
	store := storage.NewMemoryStorage()
	store.SeedMockData()

	schema, err := graphql.NewSchema(store)
	require.NoError(t, err)

	// Create GraphQL handler
	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	// Get first user ID
	ctx := context.Background()
	users, err := store.GetUsers(ctx)
	require.NoError(t, err)
	require.Greater(t, len(users), 0)
	userID := users[0].ID.String()

	// Test query
	query := `{
		user(id: "` + userID + `") {
			id
			name
			email
			role
		}
	}`

	requestBody := map[string]string{
		"query": query,
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/graphql", io.NopCloser(bytes.NewReader(bodyBytes)))
	req.Header.Set("Content-Type", "application/json")
	req.ContentLength = int64(len(bodyBytes))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	data, ok := response["data"].(map[string]interface{})
	require.True(t, ok)

	user, ok := data["user"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, userID, user["id"])
}

func TestGraphQLSchema_InvalidQuery(t *testing.T) {
	// Setup
	store := storage.NewMemoryStorage()

	schema, err := graphql.NewSchema(store)
	require.NoError(t, err)

	// Create GraphQL handler
	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	// Test invalid query
	query := `{
		users {
			id
			name
			invalidField
		}
	}`

	requestBody := map[string]string{
		"query": query,
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/graphql", io.NopCloser(bytes.NewReader(bodyBytes)))
	req.Header.Set("Content-Type", "application/json")
	req.ContentLength = int64(len(bodyBytes))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Assert response - should have errors
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should have errors for invalid field
	errors, ok := response["errors"].([]interface{})
	require.True(t, ok)
	assert.Len(t, errors, 1)
}

func TestGraphQLSchema_IntrospectionQuery(t *testing.T) {
	// Setup
	store := storage.NewMemoryStorage()

	schema, err := graphql.NewSchema(store)
	require.NoError(t, err)

	// Create GraphQL handler
	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	// Test introspection query
	query := `{
		__schema {
			queryType {
				fields {
					name
					description
				}
			}
		}
	}`

	requestBody := map[string]string{
		"query": query,
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/graphql", io.NopCloser(bytes.NewReader(bodyBytes)))
	req.Header.Set("Content-Type", "application/json")
	req.ContentLength = int64(len(bodyBytes))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	data, ok := response["data"].(map[string]interface{})
	require.True(t, ok)

	schemaData, ok := data["__schema"].(map[string]interface{})
	require.True(t, ok)

	queryType, ok := schemaData["queryType"].(map[string]interface{})
	require.True(t, ok)

	fields, ok := queryType["fields"].([]interface{})
	require.True(t, ok)

	// Should have our query fields
	fieldNames := make(map[string]bool)
	for _, field := range fields {
		field := field.(map[string]interface{})
		fieldNames[field["name"].(string)] = true
	}

	assert.True(t, fieldNames["users"])
	assert.True(t, fieldNames["user"])
	assert.True(t, fieldNames["barbers"])
	assert.True(t, fieldNames["barber"])
	assert.True(t, fieldNames["appointments"])
	assert.True(t, fieldNames["appointment"])
}
