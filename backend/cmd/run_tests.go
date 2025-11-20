package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func main() {
	fmt.Println("🧪 Running Cloud Clips Backend Test Suite")
	fmt.Println(strings.Repeat("=", 50))

	// Get project root
	root, err := os.Getwd()
	if err != nil {
		fmt.Printf("Error getting working directory: %v\n", err)
		os.Exit(1)
	}

	// Run unit tests
	fmt.Println("\n📋 Running Unit Tests...")
	runTest(root, "go test ./internal/tests -v -run=TestMemoryStorage")
	runTest(root, "go test ./internal/tests -v -run=TestMock")

	// Run integration tests
	fmt.Println("\n🔗 Running Integration Tests...")
	runTest(root, "go test ./internal/tests -v -run=TestIntegration")

	// Run GraphQL tests
	fmt.Println("\n🌐 Running GraphQL Tests...")
	runTest(root, "go test ./internal/tests -v -run=TestGraphQL")

	// Run all tests with coverage
	fmt.Println("\n📊 Running All Tests with Coverage...")
	runTest(root, "go test ./internal/tests -v -coverprofile=coverage.out")
	runTest(root, "go tool cover -html=coverage.out -o coverage.html")

	// Run benchmarks
	fmt.Println("\n⚡ Running Benchmarks...")
	runTest(root, "go test ./internal/tests -bench=. -benchmem")

	fmt.Println("\n✅ Test Suite Complete!")
	fmt.Println("📄 Coverage report: coverage.html")
	fmt.Println("📈 Benchmark results available in test output")
}

func runTest(root, command string) {
	cmd := exec.Command("bash", "-c", command)
	cmd.Dir = root

	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("❌ Error running command: %v\n", err)
		fmt.Printf("Output: %s\n", string(output))
		return
	}

	fmt.Printf("✅ %s\n", command)
	outputStr := string(output)
	if len(outputStr) > 100 {
		outputStr = outputStr[:100] + "..."
	}
	fmt.Printf("   %s\n", outputStr)
}
