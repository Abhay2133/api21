package actions

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"api21/models"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
)

// RedeployHandler handles the redeploy endpoint
func RedeployHandler(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)

	// Generate version number (next sequential version)
	version, err := getNextVersion(tx)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error": "failed to generate version number",
		}))
	}

	// Create redeployment record
	redeploy := &models.Redeployment{
		ID:      uuid.Must(uuid.NewV4()),
		Version: version,
		Status:  "pending",
	}

	if err := tx.Create(redeploy); err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error": "failed to create redeployment record",
		}))
	}

	// Start redeploy process asynchronously
	go func() {
		err := performRedeploy(tx, redeploy)
		if err != nil {
			// Log the error but don't fail
			fmt.Printf("Redeploy failed: %v\n", err)
		}
	}()

	return c.Render(202, r.JSON(map[string]interface{}{
		"id":      redeploy.ID,
		"version": redeploy.Version,
		"status":  redeploy.Status,
		"message": "Redeployment initiated",
	}))
}

// GetRedeployStatusHandler returns the status of a redeployment
func GetRedeployStatusHandler(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)

	version := c.Param("version")
	versionNum, err := strconv.Atoi(version)
	if err != nil {
		return c.Render(400, r.JSON(map[string]interface{}{
			"error": "invalid version number",
		}))
	}

	redeploy := &models.Redeployment{}
	err = tx.Where("version = ?", versionNum).First(redeploy)
	if err != nil {
		return c.Render(404, r.JSON(map[string]interface{}{
			"error": "redeployment not found",
		}))
	}

	return c.Render(200, r.JSON(redeploy))
}

// performRedeploy executes the actual redeploy process
func performRedeploy(tx *pop.Connection, redeploy *models.Redeployment) error {
	msg := "Starting redeploy process"
	now := time.Now()
	redeploy.Status = "in_progress"
	redeploy.Message = &msg
	redeploy.StartedAt = &now
	tx.Update(redeploy)

	// Step 1: Pull the repo's main branch
	if err := pullMainBranch(); err != nil {
		errMsg := fmt.Sprintf("Failed to pull main branch: %v", err)
		redeploy.Status = "failed"
		redeploy.Error = &errMsg
		now := time.Now()
		redeploy.CompletedAt = &now
		tx.Update(redeploy)
		return err
	}

	msg = "Main branch pulled successfully"
	redeploy.Message = &msg
	tx.Update(redeploy)

	// Step 2: Rebuild the app binary with version number
	binaryPath := filepath.Join("bin", fmt.Sprintf("api21-v%d", redeploy.Version))
	if err := rebuildBinary(binaryPath); err != nil {
		errMsg := fmt.Sprintf("Failed to rebuild binary: %v", err)
		redeploy.Status = "failed"
		redeploy.Error = &errMsg
		now := time.Now()
		redeploy.CompletedAt = &now
		tx.Update(redeploy)
		return err
	}

	msg = fmt.Sprintf("Binary rebuilt successfully at %s", binaryPath)
	redeploy.Message = &msg
	tx.Update(redeploy)

	// Step 3: Update .buildversion file
	if err := writeBuildVersion(redeploy.Version); err != nil {
		errMsg := fmt.Sprintf("Failed to write build version: %v", err)
		redeploy.Status = "failed"
		redeploy.Error = &errMsg
		now := time.Now()
		redeploy.CompletedAt = &now
		tx.Update(redeploy)
		return err
	}

	msg = "Build version file updated"
	redeploy.Status = "completed"
	redeploy.Message = &msg
	now = time.Now()
	redeploy.CompletedAt = &now
	tx.Update(redeploy)

	return nil
}

// getNextVersion gets the next version number from the database
func getNextVersion(tx *pop.Connection) (int, error) {
	redeploy := &models.Redeployment{}
	err := tx.Order("version DESC").First(redeploy)
	if err != nil {
		// No redeployments yet, start from 1
		if strings.Contains(err.Error(), "no rows") {
			return 1, nil
		}
		return 0, err
	}
	return redeploy.Version + 1, nil
}

// pullMainBranch pulls the latest changes from the main branch
func pullMainBranch() error {
	cmd := exec.Command("git", "pull", "origin", "main")
	cmd.Dir = "/workspaces/api21" // Adjust path as needed
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git pull failed: %v\nOutput: %s", err, string(output))
	}
	return nil
}

// rebuildBinary rebuilds the application binary
func rebuildBinary(binaryPath string) error {
	// Ensure bin directory exists
	binDir := filepath.Dir(binaryPath)
	if err := os.MkdirAll(binDir, 0755); err != nil {
		return fmt.Errorf("failed to create bin directory: %v", err)
	}

	// Run buffalo build
	cmd := exec.Command("buffalo", "build", "-o", binaryPath)
	cmd.Dir = "/workspaces/api21" // Adjust path as needed
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("buffalo build failed: %v\nOutput: %s", err, string(output))
	}
	return nil
}

// writeBuildVersion writes the build version to the .buildversion file
func writeBuildVersion(version int) error {
	versionStr := strconv.Itoa(version)
	buildVersionPath := filepath.Join("/workspaces/api21", ".buildversion")
	if err := os.WriteFile(buildVersionPath, []byte(versionStr), 0644); err != nil {
		return fmt.Errorf("failed to write build version file: %v", err)
	}
	return nil
}
