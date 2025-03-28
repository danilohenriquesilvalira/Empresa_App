package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"empresa-app/backend/internal/middleware"
	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/service"
)

type DocumentoHandler struct {
	documentoService *service.DocumentoService
}

func NewDocumentoHandler(documentoService *service.DocumentoService) *DocumentoHandler {
	return &DocumentoHandler{documentoService: documentoService}
}

// Create - Criar novo documento com upload de arquivo
func (h *DocumentoHandler) Create(c *gin.Context) {
	// Obter ID do colaborador do token
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	// Pegar formulário multipart
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao processar formulário"})
		return
	}

	// Validar campos obrigatórios
	var req model.DocumentoCreateRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Processar data
	dataDocumento, err := time.Parse("2006-01-02", req.DataDocumento)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de data inválido"})
		return
	}

	// Processar valor (se existir)
	var valor float64
	if req.Valor != "" {
		valor, err = strconv.ParseFloat(req.Valor, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Valor inválido"})
			return
		}
	}

	// Pegar arquivo
	files := form.File["arquivo"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não enviado"})
		return
	}

	file := files[0]

	// Verificar tamanho máximo (10MB)
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo muito grande (máximo 10MB)"})
		return
	}

	// Verificar tipo de arquivo
	mimeType := file.Header.Get("Content-Type")
	if mimeType != "application/pdf" && mimeType != "image/jpeg" && mimeType != "image/png" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de arquivo inválido (apenas PDF, JPEG ou PNG)"})
		return
	}

	// Gerar nome único para arquivo
	fileUUID := uuid.New().String()
	fileExt := filepath.Ext(file.Filename)
	fileName := fileUUID + fileExt

	// Criar diretório de upload se não existir
	uploadDir := "uploads/documentos"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar diretório"})
		return
	}

	// Caminho completo do arquivo
	filePath := filepath.Join(uploadDir, fileName)

	// Abrir arquivo para leitura
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao abrir arquivo"})
		return
	}
	defer src.Close()

	// Criar arquivo de destino
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar arquivo"})
		return
	}
	defer dst.Close()

	// Copiar conteúdo
	if _, err = io.Copy(dst, src); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar arquivo"})
		return
	}

	// Criar documento
	documento := &model.Documento{
		ColaboradorID:  colaboradorID,
		Titulo:         req.Titulo,
		Descricao:      req.Descricao,
		TipoDocumento:  req.TipoDocumento,
		DataDocumento:  dataDocumento,
		Valor:          valor,
		CaminhoArquivo: filePath,
		MimeType:       mimeType,
		TamanhoBytes:   int(file.Size),
		Status:         "pendente",
	}

	if err := h.documentoService.Create(documento); err != nil {
		// Remover arquivo em caso de erro
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar documento: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, documento)
}

// List - Listar documentos com filtros
func (h *DocumentoHandler) List(c *gin.Context) {
	// Obter ID e cargo do colaborador
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	cargoID, exists := c.Get("cargo_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	// Parâmetros
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	// Verificar se é admin (cargo 2, 5 ou 6)
	isAdmin := cargoID.(int) == 2 || cargoID.(int) == 5 || cargoID.(int) == 6

	var colaboradorIDPtr *int
	if isAdmin {
		// Admin pode ver todos documentos ou filtrar por colaborador
		if filtroColaboradorID := c.Query("colaborador_id"); filtroColaboradorID != "" {
			id, err := strconv.Atoi(filtroColaboradorID)
			if err == nil {
				colaboradorIDPtr = &id
			}
		}
	} else {
		// Colaborador normal só vê seus próprios documentos
		colaboradorIDPtr = &colaboradorID
	}

	documentos, err := h.documentoService.List(colaboradorIDPtr, status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar documentos: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, documentos)
}

// GetByID - Obter documento por ID
func (h *DocumentoHandler) GetByID(c *gin.Context) {
	// Obter ID e cargo do colaborador
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	cargoID, exists := c.Get("cargo_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	// Obter ID do documento
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Buscar documento
	documento, err := h.documentoService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Documento não encontrado"})
		return
	}

	// Verificar permissão
	isAdmin := cargoID.(int) == 2 || cargoID.(int) == 5 || cargoID.(int) == 6
	if !isAdmin && documento.ColaboradorID != colaboradorID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
		return
	}

	c.JSON(http.StatusOK, documento)
}

// Aprovar - Aprovar documento
func (h *DocumentoHandler) Aprovar(c *gin.Context) {
	// Verificar se é admin
	cargoID, exists := c.Get("cargo_id")
	if !exists || (cargoID.(int) != 2 && cargoID.(int) != 5 && cargoID.(int) != 6) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
		return
	}

	// Obter ID do colaborador
	colaboradorID, _ := middleware.CurrentUser(c)

	// Obter ID do documento
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.documentoService.UpdateStatus(id, "aprovado", colaboradorID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao aprovar documento: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Documento aprovado com sucesso"})
}

// Rejeitar - Rejeitar documento
func (h *DocumentoHandler) Rejeitar(c *gin.Context) {
	// Verificar se é admin
	cargoID, exists := c.Get("cargo_id")
	if !exists || (cargoID.(int) != 2 && cargoID.(int) != 5 && cargoID.(int) != 6) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
		return
	}

	// Obter ID do colaborador
	colaboradorID, _ := middleware.CurrentUser(c)

	// Obter ID do documento
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Obter motivo da rejeição
	var input struct {
		Motivo string `json:"motivo" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Motivo é obrigatório"})
		return
	}

	if err := h.documentoService.UpdateStatus(id, "rejeitado", colaboradorID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao rejeitar documento: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Documento rejeitado com sucesso"})
}

// Enviar - Marcar como enviado para finanças
func (h *DocumentoHandler) Enviar(c *gin.Context) {
	// Verificar se é admin
	cargoID, exists := c.Get("cargo_id")
	if !exists || (cargoID.(int) != 2 && cargoID.(int) != 5 && cargoID.(int) != 6) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
		return
	}

	// Obter ID do documento
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Obter observações
	var input struct {
		Observacoes string `json:"observacoes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	if err := h.documentoService.MarkAsSent(id, input.Observacoes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar documento como enviado: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Documento marcado como enviado para finanças"})
}

// Download - Fazer download do arquivo
func (h *DocumentoHandler) Download(c *gin.Context) {
	// Obter ID e cargo do colaborador
	colaboradorID, err := middleware.CurrentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	cargoID, exists := c.Get("cargo_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	// Obter ID do documento
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Buscar documento
	documento, err := h.documentoService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Documento não encontrado"})
		return
	}

	// Verificar permissão
	isAdmin := cargoID.(int) == 2 || cargoID.(int) == 5 || cargoID.(int) == 6
	if !isAdmin && documento.ColaboradorID != colaboradorID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
		return
	}

	// Verificar se arquivo existe
	if _, err := os.Stat(documento.CaminhoArquivo); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo não encontrado"})
		return
	}

	// Extrair nome do arquivo original
	fileName := fmt.Sprintf("%s-%s%s", documento.Titulo, documento.UUID, filepath.Ext(documento.CaminhoArquivo))

	// Servir arquivo
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Header("Content-Type", documento.MimeType)
	c.File(documento.CaminhoArquivo)
}
