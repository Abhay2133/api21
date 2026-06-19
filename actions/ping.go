package actions

import (
	"log"
	"net/http"
	"os"
	"time"
)

func init() {
	pingURL := os.Getenv("PING_URL")
	if pingURL == "" {
		log.Println("[ping:server] skipped: PING_URL not set")
		return
	}

	log.Printf("[ping:server] started background ping worker for: %s", pingURL)
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		// Initial ping
		pingServer(pingURL)

		for range ticker.C {
			pingServer(pingURL)
		}
	}()
}

func pingServer(url string) {
	client := http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Get(url)
	if err != nil {
		log.Printf("[ping:server] error pinging %s: %s", url, err)
		return
	}
	defer resp.Body.Close()
	log.Printf("[ping:server] %s → %d", url, resp.StatusCode)
}
