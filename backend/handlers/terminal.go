package handlers

import (
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/creack/pty"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/websocket"
)

var terminalUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 開発環境では全てのオリジンを許可
	},
}

// HandleTerminalSession handles terminal WebSocket connections
func HandleTerminalSession(c *gin.Context) {
	log.Println("Terminal WebSocket connection request received")
	
	// 認証チェック
	username, exists := c.Get("username")
	if !exists {
		log.Println("Error: No username found in context")
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}
	log.Printf("Authenticated user: %v", username)
	
	// WebSocketにアップグレード
	conn, err := terminalUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()
	
	log.Println("Terminal WebSocket connection established")

	// シェルコマンドを作成
	cmd := exec.Command("/bin/bash")
	
	// 環境変数を設定
	cmd.Env = append(os.Environ(), 
		"TERM=xterm-256color",
		"PS1=\\u@\\h:\\w\\$ ",
		"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
		"USER="+username.(string),
	)
	
	// PTYを作成
	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Println("Failed to start PTY:", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Error starting shell: "+err.Error()))
		return
	}
	defer func() {
		cmd.Process.Kill()
		ptmx.Close()
	}()
	
	log.Println("PTY started successfully for user:", username)

	// WebSocketからの入力をPTYに送信
	go func() {
		for {
			messageType, message, err := conn.ReadMessage()
			if err != nil {
				if !strings.Contains(err.Error(), "websocket: close") {
					log.Println("Error reading from WebSocket:", err)
				}
				return
			}

			if messageType == websocket.TextMessage {
				_, err = ptmx.Write(message)
				if err != nil {
					log.Println("Error writing to PTY:", err)
					return
				}
			}
		}
	}()

	// PTYからの出力をWebSocketに送信
	buf := make([]byte, 1024)
	for {
		n, err := ptmx.Read(buf)
		if err != nil {
			if err != io.EOF {
				log.Println("Error reading from PTY:", err)
			}
			return
		}

		err = conn.WriteMessage(websocket.BinaryMessage, buf[:n])
		if err != nil {
			if !strings.Contains(err.Error(), "websocket: close") {
				log.Println("Error writing to WebSocket:", err)
			}
			return
		}
	}
}

// VerifyTokenFromQuery verifies JWT token from query parameter
func VerifyTokenFromQuery(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(401, gin.H{"error": "Authorization token required"})
		c.Abort()
		return
	}

	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil || !parsedToken.Valid {
		c.JSON(401, gin.H{"error": "Invalid or expired token"})
		c.Abort()
		return
	}

	c.Set("username", claims.Username)
	c.Next()
}
