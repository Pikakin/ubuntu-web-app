package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// ListFiles returns a list of files in the specified directory
func ListFiles(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		path = "/home"
	}

	files, err := os.ReadDir(path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var fileList []map[string]interface{}
	for _, file := range files {
		info, err := file.Info()
		if err != nil {
			continue
		}

		fileList = append(fileList, map[string]interface{}{
			"name":        file.Name(),
			"path":        filepath.Join(path, file.Name()),
			"isDirectory": file.IsDir(),
			"size":        info.Size(),
			"modTime":     info.ModTime(),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"files": fileList,
		"path":  path,
	})
}
