package tests

import (
	"os"
	"testing"

	"api21/internal/cron_jobs"
)

func TestNewPingJob(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("PING_URL", "https://httpbin.org/get")
	os.Setenv("PING_SCHEDULE", "*/1 * * * *")
	defer func() {
		os.Unsetenv("PING_URL")
		os.Unsetenv("PING_SCHEDULE")
	}()

	job := cron_jobs.NewPingJob()

	status := job.GetStatus()
	if status["ping_url"] != "https://httpbin.org/get" {
		t.Errorf("Expected ping URL to be 'https://httpbin.org/get', got '%v'", status["ping_url"])
	}

	if status["schedule"] != "*/1 * * * *" {
		t.Errorf("Expected schedule to be '*/1 * * * *', got '%v'", status["schedule"])
	}
}

func TestPingJobDefaultSchedule(t *testing.T) {
	// Clear environment variables
	os.Unsetenv("PING_URL")
	os.Unsetenv("PING_SCHEDULE")

	job := cron_jobs.NewPingJob()
	status := job.GetStatus()

	if status["schedule"] != "*/5 * * * *" {
		t.Errorf("Expected default schedule to be '*/5 * * * *', got '%v'", status["schedule"])
	}
}

func TestPingJobStart(t *testing.T) {
	// Test with empty URL (should not start)
	os.Unsetenv("PING_URL")
	job := cron_jobs.NewPingJob()

	err := job.Start()
	if err != nil {
		t.Errorf("Expected no error when URL is empty, got: %v", err)
	}

	// Test with valid URL
	os.Setenv("PING_URL", "https://httpbin.org/get")
	os.Setenv("PING_SCHEDULE", "0 0 1 1 *") // Once a year to avoid actual pings in test
	defer func() {
		os.Unsetenv("PING_URL")
		os.Unsetenv("PING_SCHEDULE")
	}()

	job = cron_jobs.NewPingJob()
	err = job.Start()
	if err != nil {
		t.Errorf("Expected no error when starting job, got: %v", err)
	}

	// Clean up
	job.Stop()
}

func TestPingJobGetStatus(t *testing.T) {
	os.Setenv("PING_URL", "https://example.com")
	os.Setenv("PING_SCHEDULE", "*/5 * * * *")
	defer func() {
		os.Unsetenv("PING_URL")
		os.Unsetenv("PING_SCHEDULE")
	}()

	job := cron_jobs.NewPingJob()
	status := job.GetStatus()

	if status["ping_url"] != "https://example.com" {
		t.Errorf("Expected ping_url to be 'https://example.com', got '%v'", status["ping_url"])
	}

	if status["schedule"] != "*/5 * * * *" {
		t.Errorf("Expected schedule to be '*/5 * * * *', got '%v'", status["schedule"])
	}
}

func TestCronJobsManager(t *testing.T) {
	manager := cron_jobs.NewManager()

	// Test initial state
	status := manager.GetStatus()
	if status["manager_started"] != false {
		t.Errorf("Expected manager to not be started initially")
	}

	// Test start
	err := manager.Start()
	if err != nil {
		t.Errorf("Expected no error when starting manager, got: %v", err)
	}

	status = manager.GetStatus()
	if status["manager_started"] != true {
		t.Errorf("Expected manager to be started after Start()")
	}

	// Test stop
	manager.Stop()
	status = manager.GetStatus()
	if status["manager_started"] != false {
		t.Errorf("Expected manager to be stopped after Stop()")
	}
}

func TestCronJobsUtilities(t *testing.T) {
	// Test config retrieval
	os.Setenv("PING_URL", "https://test.example.com")
	os.Setenv("PING_SCHEDULE", "*/10 * * * *")
	defer func() {
		os.Unsetenv("PING_URL")
		os.Unsetenv("PING_SCHEDULE")
	}()

	config := cron_jobs.GetConfigFromEnv()
	if config["PING_URL"] != "https://test.example.com" {
		t.Errorf("Expected PING_URL to be 'https://test.example.com', got '%s'", config["PING_URL"])
	}

	if config["PING_SCHEDULE"] != "*/10 * * * *" {
		t.Errorf("Expected PING_SCHEDULE to be '*/10 * * * *', got '%s'", config["PING_SCHEDULE"])
	}

	// Test schedule validation
	validSchedules := []string{
		"*/5 * * * *",
		"0 9 * * 1-5",
		"0 0 1 1 *",
	}

	for _, schedule := range validSchedules {
		if err := cron_jobs.ValidateSchedule(schedule); err != nil {
			t.Errorf("Expected schedule '%s' to be valid, got error: %v", schedule, err)
		}
	}

	// Test invalid schedule
	invalidSchedule := "invalid schedule"
	if err := cron_jobs.ValidateSchedule(invalidSchedule); err == nil {
		t.Errorf("Expected schedule '%s' to be invalid, but got no error", invalidSchedule)
	}
}
