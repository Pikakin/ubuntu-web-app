package models

import (
	"time"
)

type User struct {
	Username    string    `json:"username"`
	UID         int       `json:"uid"`
	GID         int       `json:"gid"`
	FullName    string    `json:"fullName"`
	HomeDir     string    `json:"homeDir"`
	Shell       string    `json:"shell"`
	LastLogin   *time.Time `json:"lastLogin"`
	IsLocked    bool      `json:"isLocked"`
	IsSystem    bool      `json:"isSystem"`
	Groups      []string  `json:"groups"`
	HasSudo     bool      `json:"hasSudo"`
}

type CreateUserRequest struct {
	Username         string `json:"username" binding:"required"`
	Password         string `json:"password" binding:"required"`
	FullName         string `json:"fullName"`
	Shell            string `json:"shell"`
	CreateHome       bool   `json:"createHome"`
	InitialGroups    []string `json:"initialGroups"`
	GrantSudo        bool   `json:"grantSudo"`
}

type UpdateUserRequest struct {
	FullName      string   `json:"fullName"`
	Shell         string   `json:"shell"`
	Groups        []string `json:"groups"`
	IsLocked      bool     `json:"isLocked"`
	HasSudo       bool     `json:"hasSudo"`
}

type ChangePasswordRequest struct {
	Username    string `json:"username" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required"`
	ForceChange bool   `json:"forceChange"`
}

type UserListResponse struct {
	Users []User `json:"users"`
	Total int    `json:"total"`
}