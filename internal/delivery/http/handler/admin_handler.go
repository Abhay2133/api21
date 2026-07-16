package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/abhay2133/api21/config"
	"github.com/abhay2133/api21/internal/domain"
	"github.com/creack/pty"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type AdminHandler struct {
	sessionUsecase domain.SessionUsecase
}

func NewAdminHandler(sessionUsecase domain.SessionUsecase) *AdminHandler {
	return &AdminHandler{
		sessionUsecase: sessionUsecase,
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Remember bool   `json:"remember"`
}

// Login authenticates credentials, deactivates older sessions if Stay Logged in is false, and returns opaque token
func (h *AdminHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	config.AppConfig.RLock()
	expectedPass, exists := config.AppConfig.MasterCredentials[req.Username]
	config.AppConfig.RUnlock()

	if !exists || expectedPass != req.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Deactivate all other sessions if Stay Logged in is unchecked
	deactivateOthers := !req.Remember

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	session, err := h.sessionUsecase.CreateSession(c.Request.Context(), req.Username, ip, ua, deactivateOthers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":    session.Token,
		"username": session.Username,
	})
}

// Logout revokes the current session token
func (h *AdminHandler) Logout(c *gin.Context) {
	tokenVal, exists := c.Get("session_token")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active session"})
		return
	}

	tokenStr := tokenVal.(string)
	err := h.sessionUsecase.RevokeSession(c.Request.Context(), tokenStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetSessions returns all active sessions for the current admin
func (h *AdminHandler) GetSessions(c *gin.Context) {
	usernameVal, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active session"})
		return
	}

	username := usernameVal.(string)
	sessions, err := h.sessionUsecase.GetActiveSessions(c.Request.Context(), username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active sessions"})
		return
	}

	c.JSON(http.StatusOK, sessions)
}

// RevokeSession revokes a specific session by ID
func (h *AdminHandler) RevokeSession(c *gin.Context) {
	usernameVal, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active session"})
		return
	}
	username := usernameVal.(string)

	idStr := c.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	err := h.sessionUsecase.RevokeSessionByID(c.Request.Context(), id, username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session revoked successfully"})
}

// GetSystemMetrics returns CPU, RAM, and Storage stats
func (h *AdminHandler) GetSystemMetrics(c *gin.Context) {
	v, _ := mem.VirtualMemory()
	cPercent, _ := cpu.Percent(0, false)
	d, _ := disk.Usage("/")

	var cpuUsage float64
	if len(cPercent) > 0 {
		cpuUsage = cPercent[0]
	}

	c.JSON(http.StatusOK, gin.H{
		"ram": gin.H{
			"total":       v.Total,
			"used":        v.Used,
			"usedPercent": v.UsedPercent,
		},
		"cpu": gin.H{
			"usedPercent": cpuUsage,
		},
		"disk": gin.H{
			"total":       d.Total,
			"used":        d.Used,
			"usedPercent": d.UsedPercent,
		},
	})
}

// GetEnvVars returns the current contents of the .env file
func (h *AdminHandler) GetEnvVars(c *gin.Context) {
	envMap, err := godotenv.Read()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not read .env file"})
		return
	}
	c.JSON(http.StatusOK, envMap)
}

// UpdateEnvVars updates the .env file and reloads config in memory
func (h *AdminHandler) UpdateEnvVars(c *gin.Context) {
	var payload map[string]string
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Read existing
	envMap, err := godotenv.Read()
	if err != nil {
		// Create new if doesn't exist
		envMap = make(map[string]string)
	}

	// 2. Update map
	for k, v := range payload {
		envMap[k] = v
	}

	// 3. Write back
	if err := godotenv.Write(envMap, ".env"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write .env file"})
		return
	}

	// 4. Reload in memory
	config.AppConfig.ReloadDynamicConfig()

	c.JSON(http.StatusOK, gin.H{"message": "Environment updated successfully"})
}

// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		config.AppConfig.RLock()
		allowedOrigin := config.AppConfig.AllowedAdminOrigin
		config.AppConfig.RUnlock()
		
		// Allow local development origin as well for testing
		origin := r.Header.Get("Origin")
		return origin == allowedOrigin || origin == "http://localhost:5173"
	},
}

// WebTerminal upgrades to WS and spawns a bash shell, authenticating with the first message
func (h *AdminHandler) WebTerminal(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return // error already written by Upgrader
	}
	defer ws.Close()

	// 1. Authenticate using the first message within a short timeout
	ws.SetReadDeadline(time.Now().Add(5 * time.Second))

	var authMsg struct {
		Type  string `json:"type"`
		Token string `json:"token"`
	}
	err = ws.ReadJSON(&authMsg)
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte("\r\nAuthentication timeout or bad format.\r\n"))
		return
	}

	if authMsg.Type != "auth" || authMsg.Token == "" {
		ws.WriteMessage(websocket.TextMessage, []byte("\r\nInvalid message type or token format.\r\n"))
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	session, err := h.sessionUsecase.ValidateToken(c.Request.Context(), authMsg.Token, ip, ua)
	if err != nil || !session.IsActive {
		ws.WriteMessage(websocket.TextMessage, []byte("\r\nUnauthorized WebSocket connection.\r\n"))
		return
	}

	// Reset read deadline for normal terminal interaction
	ws.SetReadDeadline(time.Time{})

	// Spawn a bash shell
	// Consider passing restricted arguments or using a restricted shell for security
	cmd := exec.Command("/bin/bash")
	cmd.Env = append(os.Environ(), "TERM=xterm")

	ptmx, err := pty.Start(cmd)
	if err != nil {
		ws.WriteMessage(websocket.TextMessage, []byte("Failed to start terminal: "+err.Error()))
		return
	}
	defer func() {
		_ = ptmx.Close()
		_ = cmd.Process.Kill() // Ensure no zombie process
		_ = cmd.Wait()
	}()

	// Handle WebSocket text/binary messages representing window resize
	// A simple approach is ignoring resize for now, or handling JSON for resize

	// Read from PTY stdout and write to WebSocket
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := ptmx.Read(buf)
			if err != nil {
				if err == io.EOF {
					ws.WriteMessage(websocket.TextMessage, []byte("\r\nTerminal exited.\r\n"))
				}
				return
			}
			if err := ws.WriteMessage(websocket.TextMessage, buf[:n]); err != nil {
				return
			}
		}
	}()

	// Read from WebSocket and write to PTY stdin
	for {
		messageType, p, err := ws.ReadMessage()
		if err != nil {
			break
		}
		if messageType == websocket.TextMessage || messageType == websocket.BinaryMessage {
			// For a fully featured terminal, we might get resize commands.
			// If we assume purely pty input:
			_, err = ptmx.Write(p)
			if err != nil {
				break
			}
		}
	}
}

