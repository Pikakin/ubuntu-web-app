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
		
		// WebSocket
		authorized.GET("/ws", handleWebSocket)
	}

	// ターミナルWebSocketエンドポイント - クエリパラメータでトークン認証
	terminalGroup := r.Group("/api")
	terminalGroup.Use(handlers.VerifyTokenFromQuery)
	{
		terminalGroup.GET("/terminal", handlers.HandleTerminalSession)
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
