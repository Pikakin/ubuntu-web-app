package main

import (
	"log"
	"net/http"
	"strings"

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
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Content-Length"},
	}))

	// 認証関連
	r.POST("/api/auth/login", handlers.Login)

	// 認証が必要なAPI
	authorized := r.Group("/api")
	authorized.Use(handlers.AuthMiddleware())
	{
		authorized.GET("/system/info", handlers.GetSystemInfo)
		authorized.POST("/system/execute", handlers.ExecuteCommand)
		authorized.GET("/files", handlers.ListFiles)
		authorized.GET("/ws", handleWebSocket)
	}

	// 静的ファイルの提供 (Reactビルド後のファイル)
	r.StaticFS("/app", http.Dir("./frontend/build"))

	// その他のルートはフロントエンドにリダイレクト
	r.NoRoute(func(c *gin.Context) {
		c.File("./frontend/build/index.html")
	})

	log.Println("Server starting on :8080")
	r.Run(":8080")
}

func handleWebSocket(c *gin.Context) {
	// WebSocketの認証トークンをクエリパラメータから取得
	token := c.Query("token")
	if token == "" {
		// ヘッダーからも確認
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	// トークンの検証（実際の実装ではJWTの検証を行う）
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

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
