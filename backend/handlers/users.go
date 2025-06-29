package handlers

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pikakin/ubuntu-web-os/models"  // 修正: go.modのmodule名に合わせる
)

type UserHandler struct{}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

// GetUsers - ユーザー一覧取得
func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.parsePasswdFile()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users: " + err.Error()})
		return
	}

	// グループ情報とsudo権限を追加
	for i := range users {
		users[i].Groups = h.getUserGroups(users[i].Username)
		users[i].HasSudo = h.checkSudoPermission(users[i].Username)
		users[i].LastLogin = h.getLastLogin(users[i].Username)
	}

	c.JSON(http.StatusOK, models.UserListResponse{
		Users: users,
		Total: len(users),
	})
}

// CreateUser - ユーザー作成
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ユーザー作成コマンド構築
	args := []string{"useradd"}
	
	if req.CreateHome {
		args = append(args, "-m")
	}
	
	if req.FullName != "" {
		args = append(args, "-c", req.FullName)
	}
	
	if req.Shell != "" {
		args = append(args, "-s", req.Shell)
	} else {
		args = append(args, "-s", "/bin/bash")
	}

	args = append(args, req.Username)

	// ユーザー作成実行
	cmd := exec.Command("sudo", args...)
	if err := cmd.Run(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	// パスワード設定
	if err := h.setUserPassword(req.Username, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set password: " + err.Error()})
		return
	}

	// 初期グループ追加
	for _, group := range req.InitialGroups {
		if err := h.addUserToGroup(req.Username, group); err != nil {
			// ログに記録するが処理は続行
			fmt.Printf("Warning: Failed to add user to group %s: %v\n", group, err)
		}
	}

	// sudo権限付与
	if req.GrantSudo {
		if err := h.addUserToGroup(req.Username, "sudo"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to grant sudo permission: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

// UpdateUser - ユーザー更新
func (h *UserHandler) UpdateUser(c *gin.Context) {
	username := c.Param("username")
	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ユーザー情報更新
	args := []string{"usermod"}
	
	if req.FullName != "" {
		args = append(args, "-c", req.FullName)
	}
	
	if req.Shell != "" {
		args = append(args, "-s", req.Shell)
	}

	// アカウントロック/アンロック
	if req.IsLocked {
		args = append(args, "-L")
	} else {
		args = append(args, "-U")
	}

	args = append(args, username)

	cmd := exec.Command("sudo", args...)
	if err := cmd.Run(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user: " + err.Error()})
		return
	}

	// グループ管理
	currentGroups := h.getUserGroups(username)
	h.updateUserGroups(username, currentGroups, req.Groups)

	// sudo権限管理
	currentHasSudo := h.checkSudoPermission(username)
	if req.HasSudo != currentHasSudo {
		if req.HasSudo {
			h.addUserToGroup(username, "sudo")
		} else {
			h.removeUserFromGroup(username, "sudo")
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

// DeleteUser - ユーザー削除
func (h *UserHandler) DeleteUser(c *gin.Context) {
	username := c.Param("username")
	removeHome := c.Query("removeHome") == "true"

	args := []string{"userdel"}
	if removeHome {
		args = append(args, "-r")
	}
	args = append(args, username)

	cmd := exec.Command("sudo", args...)
	if err := cmd.Run(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// ChangePassword - パスワード変更
func (h *UserHandler) ChangePassword(c *gin.Context) {
	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.setUserPassword(req.Username, req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password: " + err.Error()})
		return
	}

	// 強制変更フラグが設定されている場合
	if req.ForceChange {
		cmd := exec.Command("sudo", "chage", "-d", "0", req.Username)
		if err := cmd.Run(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set password expiry: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// ヘルパーメソッド

func (h *UserHandler) parsePasswdFile() ([]models.User, error) {
	file, err := os.Open("/etc/passwd")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var users []models.User
	scanner := bufio.NewScanner(file)
	
	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Split(line, ":")
		
		if len(fields) < 7 {
			continue
		}

		uid, _ := strconv.Atoi(fields[2])
		gid, _ := strconv.Atoi(fields[3])
		
		user := models.User{
			Username: fields[0],
			UID:      uid,
			GID:      gid,
			FullName: fields[4],
			HomeDir:  fields[5],
			Shell:    fields[6],
			IsSystem: uid < 1000,
		}
		
		users = append(users, user)
	}

	return users, scanner.Err()
}

func (h *UserHandler) getUserGroups(username string) []string {
	cmd := exec.Command("groups", username)
	output, err := cmd.Output()
	if err != nil {
		return []string{}
	}

	line := strings.TrimSpace(string(output))
	parts := strings.Split(line, ":")
	if len(parts) < 2 {
		return []string{}
	}

	groups := strings.Fields(parts[1])
	return groups
}

func (h *UserHandler) checkSudoPermission(username string) bool {
	groups := h.getUserGroups(username)
	for _, group := range groups {
		if group == "sudo" || group == "admin" || group == "wheel" {
			return true
		}
	}
	return false
}

func (h *UserHandler) getLastLogin(username string) *time.Time {
	cmd := exec.Command("lastlog", "-u", username)
	output, err := cmd.Output()
	if err != nil {
		return nil
	}

	lines := strings.Split(string(output), "\n")
	if len(lines) < 2 {
		return nil
	}

	// lastlogの出力をパースして時刻を取得
	// 実装は簡略化（実際にはより詳細なパースが必要）
	return nil
}

func (h *UserHandler) setUserPassword(username, password string) error {
	cmd := exec.Command("sudo", "chpasswd")
	cmd.Stdin = strings.NewReader(fmt.Sprintf("%s:%s", username, password))
	return cmd.Run()
}

func (h *UserHandler) addUserToGroup(username, group string) error {
	cmd := exec.Command("sudo", "usermod", "-a", "-G", group, username)
	return cmd.Run()
}

func (h *UserHandler) removeUserFromGroup(username, group string) error {
	cmd := exec.Command("sudo", "gpasswd", "-d", username, group)
	return cmd.Run()
}

func (h *UserHandler) updateUserGroups(username string, currentGroups, newGroups []string) {
	// 現在のグループと新しいグループの差分を計算して更新
	// 実装は簡略化
	for _, group := range newGroups {
		found := false
		for _, current := range currentGroups {
			if current == group {
				found = true
				break
			}
		}
		if !found {
			h.addUserToGroup(username, group)
		}
	}
}