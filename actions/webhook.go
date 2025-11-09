package actions

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/envy"
)

// GitHubWebhookPayload represents the base GitHub webhook payload
type GitHubWebhookPayload struct {
	Action       string             `json:"action"`
	PullRequest  *GitHubPullRequest `json:"pull_request"`
	Push         *GitHubPush        `json:"push"`
	Ref          string             `json:"ref"`
	Repository   GitHubRepository   `json:"repository"`
	HeadCommit   *GitHubCommit      `json:"head_commit"`
	Installation GitHubInstallation `json:"installation"`
	EventType    string             `json:"-"` // Set from X-GitHub-Event header
}

// GitHubPullRequest represents a PR from GitHub
type GitHubPullRequest struct {
	ID        int            `json:"id"`
	Number    int            `json:"number"`
	Title     string         `json:"title"`
	Body      string         `json:"body"`
	State     string         `json:"state"`
	Action    string         `json:"action"`
	Merged    bool           `json:"merged"`
	MergedAt  *string        `json:"merged_at"`
	Base      GitHubPRBranch `json:"base"`
	Head      GitHubPRBranch `json:"head"`
	MergedBy  *GitHubUser    `json:"merged_by"`
	CreatedAt string         `json:"created_at"`
	UpdatedAt string         `json:"updated_at"`
}

// GitHubPRBranch represents a branch in a PR
type GitHubPRBranch struct {
	Ref  string      `json:"ref"`
	SHA  string      `json:"sha"`
	Repo *GitHubRepo `json:"repo"`
}

// GitHubPush represents push event data
type GitHubPush struct {
	Ref     string `json:"ref"`
	Before  string `json:"before"`
	After   string `json:"after"`
	Created bool   `json:"created"`
	Deleted bool   `json:"deleted"`
	Forced  bool   `json:"forced"`
}

// GitHubCommit represents a commit
type GitHubCommit struct {
	ID        string           `json:"id"`
	TreeID    string           `json:"tree_id"`
	Message   string           `json:"message"`
	Timestamp string           `json:"timestamp"`
	Author    GitHubCommitUser `json:"author"`
	Committer GitHubCommitUser `json:"committer"`
	Added     []string         `json:"added"`
	Removed   []string         `json:"removed"`
	Modified  []string         `json:"modified"`
}

// GitHubCommitUser represents commit author/committer info
type GitHubCommitUser struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Username string `json:"username"`
}

// GitHubRepository represents a repository
type GitHubRepository struct {
	ID       int        `json:"id"`
	Name     string     `json:"name"`
	FullName string     `json:"full_name"`
	Owner    GitHubUser `json:"owner"`
	Private  bool       `json:"private"`
	HTMLURL  string     `json:"html_url"`
	CloneURL string     `json:"clone_url"`
}

// GitHubRepo represents minimal repo info
type GitHubRepo struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	FullName string `json:"full_name"`
}

// GitHubUser represents a GitHub user
type GitHubUser struct {
	Login     string `json:"login"`
	ID        int    `json:"id"`
	AvatarURL string `json:"avatar_url"`
	HTMLURL   string `json:"html_url"`
	Type      string `json:"type"`
}

// GitHubInstallation represents GitHub app installation
type GitHubInstallation struct {
	ID int `json:"id"`
}

// WebhookEvent represents our internal webhook event
type WebhookEvent struct {
	EventType  string
	Action     string
	Repository string
	Branch     string
	PRNumber   int
	PRTitle    string
	PRAction   string
	CommitSHA  string
	CommitMsg  string
	Author     string
	MergedBy   string
	Timestamp  string
}

// WebhookHandler processes GitHub webhook events
// Supports PR merge and push events on main branch
func WebhookHandler(c buffalo.Context) error {
	// Get the GitHub event type from header
	eventType := c.Request().Header.Get("X-GitHub-Event")

	// Event type is required
	if eventType == "" {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error": "Missing X-GitHub-Event header",
		}))
	}

	// Get the webhook signature for verification
	signature := c.Request().Header.Get("X-Hub-Signature-256")

	// Read the request body
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error": "Failed to read request body",
		}))
	}

	// Ensure body is not empty
	if len(body) == 0 {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error": "Empty request body",
		}))
	} // Verify webhook signature if secret is configured
	webhookSecret := envy.Get("GITHUB_WEBHOOK_SECRET", "")
	if webhookSecret != "" && !verifyWebhookSignature(body, signature, webhookSecret) {
		return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
			"error": "Invalid webhook signature",
		}))
	}

	// Parse the webhook payload
	var payload GitHubWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error": "Invalid payload format",
		}))
	}

	payload.EventType = eventType

	// Process based on event type
	switch eventType {
	case "pull_request":
		return handlePullRequestEvent(c, payload)
	case "push":
		return handlePushEvent(c, payload)
	default:
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": fmt.Sprintf("Webhook received: %s (not processed)", eventType),
		}))
	}
}

// handlePullRequestEvent processes pull request events
func handlePullRequestEvent(c buffalo.Context, payload GitHubWebhookPayload) error {
	if payload.PullRequest == nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error": "Missing pull_request data",
		}))
	}

	pr := payload.PullRequest

	// Only process events on main/master branch
	if pr.Base.Ref != "main" && pr.Base.Ref != "master" {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": fmt.Sprintf("PR #%d on branch '%s' ignored (not main/master)", pr.Number, pr.Base.Ref),
		}))
	}

	// Create webhook event
	event := WebhookEvent{
		EventType:  payload.EventType,
		Action:     pr.State,
		Repository: payload.Repository.FullName,
		Branch:     pr.Base.Ref,
		PRNumber:   pr.Number,
		PRTitle:    pr.Title,
		PRAction:   payload.Action,
		CommitSHA:  pr.Head.SHA,
		Author:     pr.Head.Repo.FullName,
		Timestamp:  pr.UpdatedAt,
	}

	// If PR is merged
	if pr.Merged && pr.State == "closed" {
		if pr.MergedBy != nil {
			event.MergedBy = pr.MergedBy.Login
		}
		event.Action = "merged"

		// Log the merged PR event
		logWebhookEvent(event)

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"status":     "received",
			"event_type": "pull_request",
			"action":     "merged",
			"pr_number":  pr.Number,
			"pr_title":   pr.Title,
			"branch":     pr.Base.Ref,
			"repository": payload.Repository.FullName,
			"merged_by":  event.MergedBy,
		}))
	}

	// Log other PR actions (opened, closed, reopened, etc.)
	logWebhookEvent(event)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"status":     "received",
		"event_type": "pull_request",
		"action":     payload.Action,
		"pr_number":  pr.Number,
		"pr_title":   pr.Title,
		"branch":     pr.Base.Ref,
		"repository": payload.Repository.FullName,
	}))
}

// handlePushEvent processes push events
func handlePushEvent(c buffalo.Context, payload GitHubWebhookPayload) error {
	// Extract branch name from ref (refs/heads/main -> main)
	branch := extractBranchFromRef(payload.Ref)

	// Only process pushes to main/master branch
	if branch != "main" && branch != "master" {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": fmt.Sprintf("Push to branch '%s' ignored (not main/master)", branch),
		}))
	}

	// Skip push events on branch creation/deletion
	if payload.Push != nil && (payload.Push.Created || payload.Push.Deleted) {
		action := "created"
		if payload.Push.Deleted {
			action = "deleted"
		}
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"status":     "received",
			"event_type": "push",
			"action":     action,
			"branch":     branch,
			"repository": payload.Repository.FullName,
		}))
	}

	// Get commit info
	commitSHA := ""
	commitMsg := ""
	author := ""

	if payload.HeadCommit != nil {
		commitSHA = payload.HeadCommit.ID
		commitMsg = payload.HeadCommit.Message
		author = payload.HeadCommit.Author.Username
		if author == "" {
			author = payload.HeadCommit.Author.Name
		}
	}

	// Create webhook event
	event := WebhookEvent{
		EventType:  payload.EventType,
		Action:     "pushed",
		Repository: payload.Repository.FullName,
		Branch:     branch,
		CommitSHA:  commitSHA,
		CommitMsg:  commitMsg,
		Author:     author,
		Timestamp:  payload.HeadCommit.Timestamp,
	}

	// Log the push event
	logWebhookEvent(event)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"status":     "received",
		"event_type": "push",
		"action":     "pushed",
		"branch":     branch,
		"repository": payload.Repository.FullName,
		"commit_sha": commitSHA,
		"author":     author,
	}))
}

// verifyWebhookSignature verifies the GitHub webhook signature
// Format: sha256=<hex>
func verifyWebhookSignature(body []byte, signature, secret string) bool {
	if signature == "" {
		return false
	}

	// Create HMAC signature
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	expectedSignature := "sha256=" + hex.EncodeToString(h.Sum(nil))

	// Compare signatures using constant-time comparison
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// extractBranchFromRef converts refs/heads/main to main
func extractBranchFromRef(ref string) string {
	if len(ref) > 11 && ref[:11] == "refs/heads/" {
		return ref[11:]
	}
	return ref
}

// logWebhookEvent logs webhook event details
// In a real application, you might store this in a database
func logWebhookEvent(event WebhookEvent) {
	var summary string

	if event.EventType == "pull_request" {
		summary = fmt.Sprintf(
			"[WEBHOOK] PR %s #%d '%s' on %s (action: %s, author: %s, merged_by: %s)",
			event.Action,
			event.PRNumber,
			event.PRTitle,
			event.Branch,
			event.PRAction,
			event.Author,
			event.MergedBy,
		)
	} else if event.EventType == "push" {
		summary = fmt.Sprintf(
			"[WEBHOOK] Push to %s/%s by %s (commit: %s, msg: %.50s)",
			event.Repository,
			event.Branch,
			event.Author,
			event.CommitSHA[:7],
			event.CommitMsg,
		)
	}

	fmt.Println(summary)
	// TODO: Log to database or external service
}
