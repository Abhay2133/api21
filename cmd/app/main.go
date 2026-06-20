package main

import (
	"fmt"
	"log"

	"github.com/abhay2133/api21/config"
	deliveryHttp "github.com/abhay2133/api21/internal/delivery/http"
	"github.com/abhay2133/api21/internal/delivery/http/handler"
	"github.com/abhay2133/api21/internal/infrastructure/database"
	"github.com/abhay2133/api21/internal/infrastructure/redis"
	"github.com/abhay2133/api21/internal/repository"
	"github.com/abhay2133/api21/internal/usecase"
	"github.com/abhay2133/api21/services"
)

func main() {
	// 1. Load config
	config.Load()

	// 2. Init Database (GORM + Postgres)
	dbConn, err := database.NewPostgresConnection(config.AppConfig.DatabaseURL)
	if err != nil {
		log.Fatalf("[main] fatal: failed to initialize database: %v", err)
	}

	// 3. Init Redis connection
	redisClient, err := redis.NewRedisConnection(config.AppConfig.RedisURL)
	if err != nil {
		log.Printf("[main] warning: failed to connect to Redis: %v. Proceeding without rate limiting features.", err)
	}

	// 4. Start background ping worker (if configured)
	services.StartPingWorker(config.AppConfig.PingURL)

	// 5. Wire layers (Dependency Injection)
	userRepo := repository.NewUserPostgresRepository(dbConn)
	userUsecase := usecase.NewUserUsecase(userRepo)
	userHandler := handler.NewUserHandler(userUsecase)
	healthHandler := handler.NewHealthHandler(dbConn, redisClient)

	// 6. Setup Gin Router & register handlers
	router := deliveryHttp.NewRouter(
		config.AppConfig.Env,
		dbConn,
		redisClient,
		userHandler,
		healthHandler,
	)

	// 7. Start the HTTP server
	addr := fmt.Sprintf(":%d", config.AppConfig.Port)
	log.Printf("[main] Server running at http://localhost%s in %s mode", addr, config.AppConfig.Env)
	if err := router.Run(addr); err != nil {
		log.Fatalf("[main] fatal: failed to start server: %v", err)
	}
}
