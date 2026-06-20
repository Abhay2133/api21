package services

import (
	"context"
	"log"
	"net/http"
	"time"
)

func StartPingWorker(pingURL string) {
	if pingURL == "" {
		return
	}

	log.Printf("[ping:server] started background ping worker for: %s", pingURL)

	pingServer := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		req, err := http.NewRequestWithContext(ctx, "GET", pingURL, nil)
		if err != nil {
			log.Printf("[ping:server] error creating request to %s: %v", pingURL, err)
			return
		}

		client := &http.Client{}
		res, err := client.Do(req)
		if err != nil {
			log.Printf("[ping:server] error pinging %s: %v", pingURL, err)
			return
		}
		defer res.Body.Close()

		log.Printf("[ping:server] %s → %s", pingURL, res.Status)
	}

	// Run on startup in a separate goroutine
	go func() {
		pingServer()

		ticker := time.NewTicker(60 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			pingServer()
		}
	}()
}
