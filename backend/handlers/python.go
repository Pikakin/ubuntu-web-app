package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

type PythonVersion struct {
	Version string `json:"version"`
	Path    string `json:"path"`
	Current bool   `json:"current"`
}

type VirtualEnv struct {
	Name      string            `json:"name"`
	Path      string            `json:"path"`
	Python    string            `json:"python"`
	Packages  []PythonPackage   `json:"packages"`
	Active    bool              `json:"active"`
	Created   string            `json:"created"`
	Size      string            `json:"size"`
}

type PythonPackage struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Latest  string `json:"latest"`
}

type RequirementFile struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Content string `json:"content"`
}

// GetPythonVersions returns all available Python versions
func GetPythonVersions(c *gin.Context) {
	versions := []PythonVersion{}
	
	// Check pyenv versions
	if cmd := exec.Command("pyenv", "versions"); cmd.Run() == nil {
		output, _ := cmd.Output()
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" && !strings.Contains(line, "system") {
				current := strings.HasPrefix(line, "*")
				version := strings.TrimPrefix(line, "* ")
				version = strings.TrimSpace(version)
				
				versions = append(versions, PythonVersion{
					Version: version,
					Path:    fmt.Sprintf("~/.pyenv/versions/%s/bin/python", version),
					Current: current,
				})
			}
		}
	}
	
	// Check system Python
	if cmd := exec.Command("python3", "--version"); cmd.Run() == nil {
		output, _ := cmd.Output()
		version := strings.TrimSpace(string(output))
		version = strings.TrimPrefix(version, "Python ")
		
		pathCmd := exec.Command("which", "python3")
		pathOutput, _ := pathCmd.Output()
		path := strings.TrimSpace(string(pathOutput))
		
		versions = append(versions, PythonVersion{
			Version: version,
			Path:    path,
			Current: len(versions) == 0,
		})
	}
	
	c.JSON(http.StatusOK, gin.H{
		"versions": versions,
	})
}

// GetVirtualEnvironments returns all virtual environments
func GetVirtualEnvironments(c *gin.Context) {
	environments := []VirtualEnv{}
	
	// Check conda environments
	if cmd := exec.Command("conda", "env", "list"); cmd.Run() == nil {
		output, _ := cmd.Output()
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if strings.Contains(line, "/") && !strings.HasPrefix(line, "#") {
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					name := parts[0]
					path := parts[len(parts)-1]
					active := strings.Contains(line, "*")
					
					// Get Python version
					pythonPath := filepath.Join(path, "bin", "python")
					pythonCmd := exec.Command(pythonPath, "--version")
					pythonOutput, _ := pythonCmd.Output()
					pythonVersion := strings.TrimSpace(string(pythonOutput))
					
					environments = append(environments, VirtualEnv{
						Name:   name,
						Path:   path,
						Python: pythonVersion,
						Active: active,
					})
				}
			}
		}
	}
	
	// Check venv environments
	venvPaths := []string{
		filepath.Join(os.Getenv("HOME"), ".virtualenvs"),
		filepath.Join(os.Getenv("HOME"), "venv"),
		filepath.Join(os.Getenv("HOME"), ".venv"),
	}
	
	for _, basePath := range venvPaths {
		if dirs, err := filepath.Glob(filepath.Join(basePath, "*")); err == nil {
			for _, dir := range dirs {
				if stat, err := os.Stat(dir); err == nil && stat.IsDir() {
					pythonPath := filepath.Join(dir, "bin", "python")
					if _, err := os.Stat(pythonPath); err == nil {
						name := filepath.Base(dir)
						
						// Get Python version
						pythonCmd := exec.Command(pythonPath, "--version")
						pythonOutput, _ := pythonCmd.Output()
						pythonVersion := strings.TrimSpace(string(pythonOutput))
						
						environments = append(environments, VirtualEnv{
							Name:   name,
							Path:   dir,
							Python: pythonVersion,
							Active: false,
						})
					}
				}
			}
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"environments": environments,
	})
}

// CreateVirtualEnvironment creates a new virtual environment
func CreateVirtualEnvironment(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		PythonPath string `json:"python_path"`
		Type       string `json:"type"` // venv, virtualenv, conda
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var cmd *exec.Cmd
	var envPath string
	
	switch req.Type {
	case "conda":
		cmd = exec.Command("conda", "create", "-n", req.Name, "python", "-y")
		envPath = filepath.Join(os.Getenv("HOME"), "anaconda3", "envs", req.Name)
	case "virtualenv":
		envPath = filepath.Join(os.Getenv("HOME"), ".virtualenvs", req.Name)
		cmd = exec.Command("virtualenv", "-p", req.PythonPath, envPath)
	default: // venv
		envPath = filepath.Join(os.Getenv("HOME"), "venv", req.Name)
		cmd = exec.Command(req.PythonPath, "-m", "venv", envPath)
	}
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to create virtual environment: %s", string(output)),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Virtual environment '%s' created successfully", req.Name),
		"path":    envPath,
	})
}

// DeleteVirtualEnvironment deletes a virtual environment
func DeleteVirtualEnvironment(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var cmd *exec.Cmd
	
	switch req.Type {
	case "conda":
		cmd = exec.Command("conda", "env", "remove", "-n", req.Name, "-y")
	default:
		// For venv/virtualenv, just remove the directory
		envPath := c.Query("path")
		if envPath == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Environment path required"})
			return
		}
		cmd = exec.Command("rm", "-rf", envPath)
	}
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to delete virtual environment: %s", string(output)),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Virtual environment '%s' deleted successfully", req.Name),
	})
}

// GetPackages returns packages installed in a virtual environment
func GetPackages(c *gin.Context) {
	envPath := c.Query("env_path")
	envType := c.Query("env_type")
	
	var cmd *exec.Cmd
	
	if envType == "conda" {
		envName := c.Query("env_name")
		cmd = exec.Command("conda", "list", "-n", envName, "--json")
	} else {
		pipPath := filepath.Join(envPath, "bin", "pip")
		cmd = exec.Command(pipPath, "list", "--format=json")
	}
	
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to get packages: %s", err.Error()),
		})
		return
	}
	
	var packages []PythonPackage
	
	if envType == "conda" {
		var condaPackages []struct {
			Name    string `json:"name"`
			Version string `json:"version"`
		}
		json.Unmarshal(output, &condaPackages)
		
		for _, pkg := range condaPackages {
			packages = append(packages, PythonPackage{
				Name:    pkg.Name,
				Version: pkg.Version,
			})
		}
	} else {
		var pipPackages []struct {
			Name    string `json:"name"`
			Version string `json:"version"`
		}
		json.Unmarshal(output, &pipPackages)
		
		for _, pkg := range pipPackages {
			packages = append(packages, PythonPackage{
				Name:    pkg.Name,
				Version: pkg.Version,
			})
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"packages": packages,
	})
}

// InstallPackage installs a package in a virtual environment
func InstallPackage(c *gin.Context) {
	var req struct {
		EnvPath     string `json:"env_path"`
		EnvName     string `json:"env_name"`
		EnvType     string `json:"env_type"`
		PackageName string `json:"package_name"`
		Version     string `json:"version"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var cmd *exec.Cmd
	packageSpec := req.PackageName
	if req.Version != "" {
		packageSpec = fmt.Sprintf("%s==%s", req.PackageName, req.Version)
	}
	
	if req.EnvType == "conda" {
		cmd = exec.Command("conda", "install", "-n", req.EnvName, packageSpec, "-y")
	} else {
		pipPath := filepath.Join(req.EnvPath, "bin", "pip")
		cmd = exec.Command(pipPath, "install", packageSpec)
	}
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to install package: %s", string(output)),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Package '%s' installed successfully", req.PackageName),
	})
}

// UninstallPackage uninstalls a package from a virtual environment
func UninstallPackage(c *gin.Context) {
	var req struct {
		EnvPath     string `json:"env_path"`
		EnvName     string `json:"env_name"`
		EnvType     string `json:"env_type"`
		PackageName string `json:"package_name"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var cmd *exec.Cmd
	
	if req.EnvType == "conda" {
		cmd = exec.Command("conda", "uninstall", "-n", req.EnvName, req.PackageName, "-y")
	} else {
		pipPath := filepath.Join(req.EnvPath, "bin", "pip")
		cmd = exec.Command(pipPath, "uninstall", req.PackageName, "-y")
	}
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to uninstall package: %s", string(output)),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Package '%s' uninstalled successfully", req.PackageName),
	})
}

// GenerateRequirements generates requirements.txt for a virtual environment
func GenerateRequirements(c *gin.Context) {
	envPath := c.Query("env_path")
	envType := c.Query("env_type")
	
	var cmd *exec.Cmd
	
	if envType == "conda" {
		envName := c.Query("env_name")
		cmd = exec.Command("conda", "env", "export", "-n", envName)
	} else {
		pipPath := filepath.Join(envPath, "bin", "pip")
		cmd = exec.Command(pipPath, "freeze")
	}
	
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to generate requirements: %s", err.Error()),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"requirements": string(output),
	})
}

// InstallRequirements installs packages from requirements.txt
func InstallRequirements(c *gin.Context) {
	var req struct {
		EnvPath      string `json:"env_path"`
		EnvName      string `json:"env_name"`
		EnvType      string `json:"env_type"`
		Requirements string `json:"requirements"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Write requirements to temp file
	tempFile := "/tmp/requirements.txt"
	err := os.WriteFile(tempFile, []byte(req.Requirements), 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to write requirements file: %s", err.Error()),
		})
		return
	}
	defer os.Remove(tempFile)
	
	var cmd *exec.Cmd
	
	if req.EnvType == "conda" {
		cmd = exec.Command("conda", "env", "update", "-n", req.EnvName, "--file", tempFile)
	} else {
		pipPath := filepath.Join(req.EnvPath, "bin", "pip")
		cmd = exec.Command(pipPath, "install", "-r", tempFile)
	}
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to install requirements: %s", string(output)),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Requirements installed successfully",
	})
}

// SearchPackages searches for packages in PyPI
func SearchPackages(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query required"})
		return
	}
	
	// Use pip search alternative - search PyPI via API
	cmd := exec.Command("pip", "search", query)
	output, err := cmd.Output()
	if err != nil {
		// Fallback to basic search
		c.JSON(http.StatusOK, gin.H{
			"packages": []PythonPackage{},
			"message": "Package search not available",
		})
		return
	}
	
	// Parse pip search output
	packages := []PythonPackage{}
	lines := strings.Split(string(output), "\n")
	re := regexp.MustCompile(`^([^(]+)\s+\(([^)]+)\)\s+-\s+(.*)$`)
	
	for _, line := range lines {
		if matches := re.FindStringSubmatch(line); len(matches) >= 3 {
			packages = append(packages, PythonPackage{
				Name:    strings.TrimSpace(matches[1]),
				Version: strings.TrimSpace(matches[2]),
			})
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"packages": packages,
	})
}
