package main

import (
	"log"
	"net/http"

	"cloud-clips/internal/graphql"
	"cloud-clips/internal/storage"
	"github.com/graphql-go/handler"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Initialize storage
	storage := storage.NewMemoryStorage()
	storage.SeedMockData()

	// Initialize GraphQL schema
	schema, err := graphql.NewSchema(storage)
	if err != nil {
		log.Fatal("Failed to create GraphQL schema:", err)
	}
	log.Printf("Schema created successfully with %d query fields", len(schema.QueryType().Fields()))

	// Initialize GraphQL handler
	graphqlHandler := handler.New(&handler.Config{
		Schema:     &schema,
		Pretty:     true,
		GraphiQL:   true,
		Playground: true,
	})

	// Health check handler
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(200)
		w.Write([]byte(`{"status":"ok","message":"Cloud Clips API is running"}`))
	})

	// GraphQL handler
	http.Handle("/graphql", graphqlHandler)

	// Start server
	port := ":8080"
	log.Printf("GraphQL Server starting on port %s", port)
	log.Printf("GraphQL Playground: http://localhost%s/graphql", port)
	log.Printf("GraphQL Endpoint: http://localhost%s/graphql", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
