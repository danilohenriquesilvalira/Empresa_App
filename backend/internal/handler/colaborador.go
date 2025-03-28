package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"empresa-app/backend/internal/middleware"
	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/service"
)

type ColaboradorHandler struct {
	colaboradorService *service.ColaboradorService
}

func NewColaboradorHandler(colaboradorService *service.ColaboradorService) *ColaboradorHandler {
	return &ColaboradorHandler{colaboradorService: colaboradorService}
}

// GetMe - Obter dados do usuário logado
func (h *ColaboradorHandler) GetMe(c *gin.Context) {
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	colaborador, err := h.colaboradorService.GetByID(colaboradorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Colaborador não encontrado"})
		return
	}

	c.JSON(http.StatusOK, colaborador)
}

// UpdateMe - Atualizar dados do usuário logado
func (h *ColaboradorHandler) UpdateMe(c *gin.Context) {
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var req model.Colaborador
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Assegurar que o ID é do usuário logado
	req.ID = colaboradorID

	if err := h.colaboradorService.Update(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar: " + err.Error()})
		return
	}

	// Buscar dados atualizados
	colaborador, err := h.colaboradorService.GetByID(colaboradorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados atualizados"})
		return
	}

	c.JSON(http.StatusOK, colaborador)
}
