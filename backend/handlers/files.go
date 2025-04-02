package handlers

import (
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type FileInfo struct {
	Name    string    `json:"name"`
	Path    string    `json:"path"`
	IsDir   bool      `json:"isDir"`
	Size    int64     `json:"size"`
	ModTime time.Time `json:"modTime"`
}

// GetFileList returns a list of files in the specified directory
func GetFileList(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		path = "/home"
	}

	// パスの検証（セキュリティ対策）
	absPath, err := filepath.Abs(path)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// ディレクトリが存在するか確認
	fileInfo, err := os.Stat(absPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Directory not found"})
		return
	}

	if !fileInfo.IsDir() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path is not a directory"})
		return
	}

	// ディレクトリ内のファイル一覧を取得
	files, err := ioutil.ReadDir(absPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read directory"})
		return
	}

	// ファイル情報を構造体に変換
	var fileList []FileInfo
	for _, file := range files {
		// 隠しファイルはスキップ（オプション）
		if file.Name()[0] == '.' {
			continue
		}

		fileList = append(fileList, FileInfo{
			Name:    file.Name(),
			Path:    filepath.Join(absPath, file.Name()),
			IsDir:   file.IsDir(),
			Size:    file.Size(),
			ModTime: file.ModTime(),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"path":  absPath,
		"files": fileList,
	})
}

// GetFileContent returns the content of a file
func GetFileContent(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path is required"})
		return
	}

	// パスの検証
	absPath, err := filepath.Abs(path)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// ファイルが存在するか確認
	fileInfo, err := os.Stat(absPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	if fileInfo.IsDir() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path is a directory, not a file"})
		return
	}

	// ファイルサイズの制限（オプション）
	if fileInfo.Size() > 10*1024*1024 { // 10MB
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is too large"})
		return
	}

	// ファイルの内容を読み込む
	content, err := ioutil.ReadFile(absPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"path":    absPath,
		"content": string(content),
		"size":    fileInfo.Size(),
		"modTime": fileInfo.ModTime(),
	})
}

// CreateDirectory creates a new directory
func CreateDirectory(c *gin.Context) {
	var request struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if request.Path == "" || request.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path and name are required"})
		return
	}

	// パスの検証
	absPath, err := filepath.Abs(request.Path)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// 親ディレクトリが存在するか確認
	parentInfo, err := os.Stat(absPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Parent directory not found"})
		return
	}

	if !parentInfo.IsDir() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parent path is not a directory"})
		return
	}

	// 新しいディレクトリのパス
	newDirPath := filepath.Join(absPath, request.Name)

	// ディレクトリを作成
	err = os.Mkdir(newDirPath, 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Directory created successfully",
		"path":    newDirPath,
	})
}

// DeleteFile deletes a file or directory
func DeleteFile(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path is required"})
		return
	}

	// パスの検証
	absPath, err := filepath.Abs(path)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// ファイルまたはディレクトリが存在するか確認
	fileInfo, err := os.Stat(absPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File or directory not found"})
		return
	}

	// 削除処理
	var removeErr error
	if fileInfo.IsDir() {
		removeErr = os.RemoveAll(absPath) // ディレクトリとその中身を再帰的に削除
	} else {
		removeErr = os.Remove(absPath) // ファイルを削除
	}

	if removeErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully deleted",
		"path":    absPath,
		"isDir":   fileInfo.IsDir(),
	})
}

// SaveFileContent saves content to a file
func SaveFileContent(c *gin.Context) {
	var request struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if request.Path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path is required"})
		return
	}

	// パスの検証
	absPath, err := filepath.Abs(request.Path)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// ファイルが存在するか確認
	_, err = os.Stat(absPath)
	if err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check file"})
		return
	}

	// ファイルに書き込む
	err = ioutil.WriteFile(absPath, []byte(request.Content), 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File saved successfully",
		"path":    absPath,
	})
}
