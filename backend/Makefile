.PHONY: help build run test clean deps lint fmt coverage benchmark

# Default target
help:
	@echo "Cloud Clips Backend - Available Commands:"
	@echo ""
	@echo "  build     - Build the application"
	@echo "  run       - Run the GraphQL server"
	@echo "  test      - Run all tests"
	@echo "  test-unit - Run unit tests only"
	@echo "  test-int - Run integration tests only"
	@echo "  test-graphql - Run GraphQL tests only"
	@echo "  coverage  - Generate test coverage report"
	@echo "  benchmark - Run benchmarks"
	@echo "  lint      - Run linter"
	@echo "  fmt       - Format code"
	@echo "  clean     - Clean build artifacts"
	@echo "  deps      - Install dependencies"
	@echo "  mocks     - Generate mocks"

# Build the application
build:
	@echo "🔨 Building Cloud Clips Backend..."
	go build -o bin/cloud-clips cmd/main.go

# Run the server
run:
	@echo "🚀 Starting Cloud Clips Backend..."
	go run cmd/main.go

# Run all tests
test:
	@echo "🧪 Running all tests..."
	go run cmd/run_tests.go

# Run unit tests only
test-unit:
	@echo "📋 Running unit tests..."
	go test ./internal/tests -v -run=TestMemoryStorage -run=TestMock

# Run integration tests only
test-int:
	@echo "🔗 Running integration tests..."
	go test ./internal/tests -v -run=TestIntegration

# Run GraphQL tests only
test-graphql:
	@echo "🌐 Running GraphQL tests..."
	go test ./internal/tests -v -run=TestGraphQL

# Generate coverage report
coverage:
	@echo "📊 Generating coverage report..."
	go test ./internal/tests -v -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "📄 Coverage report generated: coverage.html"

# Run benchmarks
benchmark:
	@echo "⚡ Running benchmarks..."
	go test ./internal/tests -bench=. -benchmem

# Run linter
lint:
	@echo "🔍 Running linter..."
	golangci-lint run ./...

# Format code
fmt:
	@echo "✨ Formatting code..."
	go fmt ./...
	goimports -w .

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	go clean -testcache

# Install dependencies
deps:
	@echo "📦 Installing dependencies..."
	go mod download
	go mod tidy

# Generate mocks
mocks:
	@echo "🎭 Generating mocks..."
	go generate ./internal/storage

# Development setup
setup: deps mocks
	@echo "🛠️  Development setup complete!"

# CI/CD pipeline
ci: deps fmt lint test coverage
	@echo "✅ CI/CD pipeline completed successfully!"

# Development workflow
dev: setup run
	@echo "🚀 Development environment ready!"

# Production build
prod: clean fmt lint test build
	@echo "🏭 Production build completed!"