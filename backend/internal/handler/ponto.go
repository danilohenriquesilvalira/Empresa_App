package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"empresa-app/backend/internal/middleware"
	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/service"
)

type PontoHandler struct {
	pontoService *service.PontoService
}

func NewPontoHandler(pontoService *service.PontoService) *PontoHandler {
	return &PontoHandler{pontoService: pontoService}
}

// Registrar - Registrar ponto de entrada/saída
func (h *PontoHandler) Registrar(c *gin.Context) {
	// Obter ID do colaborador do token
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	var req model.PontoRegistroRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Processar data/hora (se fornecida)
	var dataHora time.Time
	if req.DataHora != "" {
		dataHora, err = time.Parse(time.RFC3339, req.DataHora)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de data/hora inválido"})
			return
		}
	} else {
		dataHora = time.Now()
	}

	// Processar localização (se fornecida)
	localizacaoBytes, err := h.pontoService.ParseLocalizacao(req.Localizacao)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de localização inválido"})
		return
	}

	// Obter IP e user agent
	ipOrigem := c.ClientIP()
	userAgent := c.Request.UserAgent()

	ponto := &model.RegistroPonto{
		ColaboradorID: colaboradorID,
		Tipo:          req.Tipo,
		DataHora:      dataHora,
		Localizacao:   localizacaoBytes,
		IPOrigem:      ipOrigem,
		Dispositivo:   userAgent,
		Observacao:    req.Observacao,
	}

	if err := h.pontoService.Registrar(ponto); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao registrar ponto: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ponto)
}

// Listar - Listar pontos por data
func (h *PontoHandler) Listar(c *gin.Context) {
	// Obter ID do colaborador do token
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	// Processar data (se fornecida)
	var data time.Time
	dataParam := c.Query("data")
	if dataParam != "" {
		data, err = time.Parse("2006-01-02", dataParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de data inválido"})
			return
		}
	} else {
		data = time.Now()
	}

	pontos, err := h.pontoService.Listar(colaboradorID, data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar pontos: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, pontos)
}
