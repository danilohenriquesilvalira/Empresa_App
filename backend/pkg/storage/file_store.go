package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

// FileStorage gerencia o armazenamento de arquivos em disco
type FileStorage struct {
	baseDir string
}

// NewFileStorage cria uma nova instância do gerenciador de arquivos
func NewFileStorage(baseDir string) *FileStorage {
	return &FileStorage{
		baseDir: baseDir,
	}
}

// SaveFile salva um arquivo no armazenamento
func (fs *FileStorage) SaveFile(reader io.Reader, originalName, mimeType string) (string, error) {
	// Gerar nome único para arquivo
	fileUUID := uuid.New().String()
	fileExt := filepath.Ext(originalName)
	fileName := fileUUID + fileExt

	// Determinar subdiretório baseado no tipo MIME
	subDir := "others"
	if mimeType == "application/pdf" {
		subDir = "pdf"
	} else if mimeType == "image/jpeg" || mimeType == "image/png" {
		subDir = "images"
	}

	// Criar diretório de upload se não existir
	uploadDir := filepath.Join(fs.baseDir, subDir)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("erro ao criar diretório: %w", err)
	}

	// Caminho completo do arquivo
	filePath := filepath.Join(uploadDir, fileName)

	// Criar arquivo de destino
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("erro ao criar arquivo: %w", err)
	}
	defer dst.Close()

	// Copiar conteúdo
	if _, err = io.Copy(dst, reader); err != nil {
		// Remover arquivo em caso de erro
		os.Remove(filePath)
		return "", fmt.Errorf("erro ao salvar arquivo: %w", err)
	}

	return filePath, nil
}

// GetFile retorna um arquivo do armazenamento
func (fs *FileStorage) GetFile(filePath string) (*os.File, error) {
	// Verificar se arquivo existe
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("arquivo não encontrado: %w", err)
	}

	// Abrir arquivo
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("erro ao abrir arquivo: %w", err)
	}

	return file, nil
}

// DeleteFile remove um arquivo do armazenamento
func (fs *FileStorage) DeleteFile(filePath string) error {
	// Verificar se arquivo existe
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // Arquivo já não existe
	}

	// Remover arquivo
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("erro ao remover arquivo: %w", err)
	}

	return nil
}
