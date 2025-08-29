package cron_jobs

import (
	"log"
	"sync"
)

// Manager handles all cron jobs in the application
type Manager struct {
	pingJob *PingJob
	mu      sync.RWMutex
	started bool
}

// NewManager creates a new cron jobs manager
func NewManager() *Manager {
	return &Manager{
		pingJob: NewPingJob(),
	}
}

// Start starts all cron jobs
func (m *Manager) Start() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.started {
		log.Println("Cron jobs already started")
		return nil
	}

	log.Println("Starting cron jobs...")

	// Start ping job
	if err := m.pingJob.Start(); err != nil {
		return err
	}

	m.started = true
	log.Println("All cron jobs started successfully")
	return nil
}

// Stop stops all cron jobs
func (m *Manager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.started {
		return
	}

	log.Println("Stopping cron jobs...")

	// Stop ping job
	m.pingJob.Stop()

	m.started = false
	log.Println("All cron jobs stopped")
}

// GetStatus returns the status of all cron jobs
func (m *Manager) GetStatus() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return map[string]interface{}{
		"manager_started": m.started,
		"ping_job":        m.pingJob.GetStatus(),
	}
}

// GetPingJob returns the ping job instance
func (m *Manager) GetPingJob() *PingJob {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.pingJob
}
