package handlers

import (
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

// ListInstalledPackages returns a list of installed packages
func ListInstalledPackages(c *gin.Context) {
	cmd := exec.Command("bash", "-c", "dpkg --get-selections | grep -v deinstall")
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"packages": string(output),
	})
}

// SearchPackages searches for packages in repositories
func SearchPackages(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	cmd := exec.Command("bash", "-c", "apt-cache search "+query)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"results": string(output),
	})
}

// InstallPackage installs a package
func InstallPackage(c *gin.Context) {
	var request struct {
		Package string `json:"package"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 非同期でインストールを実行
	go func() {
		cmd := exec.Command("bash", "-c", "apt-get install -y "+request.Package)
		cmd.Run()
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Package installation started",
	})
}
