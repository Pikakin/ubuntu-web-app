package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/pikakin/ubuntu-web-os/handlers"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 開発中は全てのオリジンを許可
	},
}

func main() {
	r := gin.Default()

	// CORS設定
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// 認証関連
	r.POST("/api/auth/login", handlers.Login)

	// 認証が必要なAPI
	authorized := r.Group("/api")
	authorized.Use(handlers.AuthMiddleware())
	{
		// システム関連
		authorized.GET("/system/info", handlers.GetSystemInfo)
		authorized.POST("/system/execute", handlers.ExecuteCommand)
		
		// サービス関連
		authorized.GET("/services", handlers.ListServices)
		authorized.GET("/services/:service", handlers.GetServiceStatus)
		authorized.POST("/services/control", handlers.ControlService)
		
		// ファイル関連
		authorized.GET("/files", handlers.GetFileList)
		authorized.GET("/files/content", handlers.GetFileContent)
		authorized.POST("/files/content", handlers.SaveFileContent)
		authorized.POST("/files/directory", handlers.CreateDirectory)
		authorized.DELETE("/files", handlers.DeleteFile)
		
		// Docker関連
		authorized.GET("/docker/containers", handlers.ListContainers)
		authorized.GET("/docker/containers/:id", handlers.GetContainer)
		authorized.POST("/docker/containers/:id/start", handlers.StartContainer)
		authorized.POST("/docker/containers/:id/stop", handlers.StopContainer)
		authorized.POST("/docker/containers/:id/restart", handlers.RestartContainer)
		authorized.DELETE("/docker/containers/:id", handlers.DeleteContainer)
		authorized.GET("/docker/containers/:id/logs", handlers.GetContainerLogs)
		authorized.POST("/docker/containers", handlers.CreateContainer)
		
		authorized.GET("/docker/images", handlers.ListImages)
		authorized.POST("/docker/images/pull", handlers.PullImage)
		authorized.DELETE("/docker/images/:id", handlers.DeleteImage)
		
		authorized.GET("/docker/networks", handlers.ListNetworks)
		authorized.POST("/docker/networks", handlers.CreateNetwork)
		authorized.DELETE("/docker/networks/:id", handlers.DeleteNetwork)
		
		authorized.GET("/docker/volumes", handlers.ListVolumes)
		authorized.POST("/docker/volumes", handlers.CreateVolume)
		authorized.DELETE("/docker/volumes/:name", handlers.DeleteVolume)
		
		authorized.GET("/docker/stats", handlers.GetContainerStats)
		authorized.GET("/docker/info", handlers.GetDockerInfo)
		authorized.GET("/docker/version", handlers.GetDockerVersion)
		authorized.POST("/docker/cleanup", handlers.DockerCleanup)
		
		authorized.GET("/docker/compose/projects", handlers.ListDockerComposeProjects)
		authorized.GET("/docker/compose/project", handlers.GetDockerComposeProject)
		authorized.POST("/docker/compose/project", handlers.SaveDockerComposeProject)
		authorized.POST("/docker/compose/up", handlers.DockerComposeUp)
		authorized.POST("/docker/compose/down", handlers.DockerComposeDown)
		authorized.POST("/docker/compose/restart", handlers.DockerComposeRestart)
		
		// CUDA関連
		authorized.GET("/cuda/gpu-info", handlers.GetGPUInfo)
		authorized.GET("/cuda/toolkit-info", handlers.GetCUDAToolkitInfo)
		authorized.GET("/cuda/cudnn-info", handlers.GetCuDNNInfo)
		authorized.GET("/cuda/environment", handlers.GetCUDAEnvironment)
		authorized.POST("/cuda/environment", handlers.SetCUDAEnvironment)
		authorized.POST("/cuda/test", handlers.RunCUDATest)
		
		// Python関連
		authorized.GET("/python/versions", handlers.GetPythonVersions)
		authorized.GET("/python/environments", handlers.GetVirtualEnvironments)
		authorized.POST("/python/environments", handlers.CreateVirtualEnvironment)
		authorized.DELETE("/python/environments", handlers.DeleteVirtualEnvironment)
		authorized.GET("/python/packages", handlers.GetPackages)
		authorized.POST("/python/packages/install", handlers.InstallPackage)
		authorized.DELETE("/python/packages", handlers.UninstallPackage)
		authorized.GET("/python/requirements", handlers.GenerateRequirements)
		authorized.POST("/python/requirements/install", handlers.InstallRequirements)
		authorized.GET("/python/packages/search", handlers.SearchPackages)
		
		// System Resources関連
		authorized.GET("/resources", handlers.GetSystemResources)
		authorized.POST("/resources/kill", handlers.KillProcess)
		authorized.POST("/resources/priority", handlers.SetProcessPriority)
		authorized.GET("/resources/info", handlers.GetDetailedSystemInfo)
		
		// APT Package管理関連
		authorized.GET("/packages", handlers.ListInstalledPackages)
		authorized.GET("/packages/search", handlers.SearchAPTPackages)
		authorized.POST("/packages/install", handlers.InstallAPTPackage)
		
		// WebSocket
		authorized.GET("/ws", handleWebSocket)
	}

	// ユーザー管理API - 認証が必要
	userHandler := handlers.NewUserHandler()
	userRoutes := authorized.Group("/users")  // 修正: authorizedグループ内に移動
	{
		userRoutes.GET("", userHandler.GetUsers)
		userRoutes.POST("", userHandler.CreateUser)
		userRoutes.PUT("/:username", userHandler.UpdateUser)
		userRoutes.DELETE("/:username", userHandler.DeleteUser)
		userRoutes.POST("/change-password", userHandler.ChangePassword)
	}

	// ターミナルWebSocketエンドポイント - クエリパラメータでトークン認証
	terminalGroup := r.Group("/api")
	terminalGroup.Use(handlers.VerifyTokenFromQuery)
	{
		terminalGroup.GET("/terminal", handlers.HandleTerminalSession)
		terminalGroup.GET("/docker/containers/:id/logs/stream", handlers.StreamContainerLogs)
		terminalGroup.GET("/cuda/gpu-stats/stream", handlers.StreamGPUStats)
		// terminalGroup.GET("/resources/stream", handlers.StreamSystemResources) // TODO: Implement
	}

	// 静的ファイルの提供 (Reactビルド後のファイル)
	r.StaticFS("/app", http.Dir("./frontend/build"))

	// その他のルートはフロントエンドにリダイレクト
	r.NoRoute(func(c *gin.Context) {
		c.File("./frontend/build/index.html")
	})

	// ポート設定
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Server starting on :" + port)
	r.Run(":" + port)
}

func handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	// WebSocketハンドリングロジック
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}

		// メッセージを処理して応答
		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Println("WebSocket write error:", err)
			break
		}
	}
}
