package service

import (
	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/repository"
	"errors"
)

type DocumentoService struct {
	documentoRepo *repository.DocumentoRepository
}

func NewDocumentoService(documentoRepo *repository.DocumentoRepository) *DocumentoService {
	return &DocumentoService{documentoRepo: documentoRepo}
}

func (s *DocumentoService) Create(documento *model.Documento) error {
	// Validar dados
	if documento.Titulo == "" {
		return errors.New("título é obrigatório")
	}

	if documento.TipoDocumento == "" {
		return errors.New("tipo de documento é obrigatório")
	}

	return s.documentoRepo.Create(documento)
}

func (s *DocumentoService) GetByID(id int) (*model.Documento, error) {
	return s.documentoRepo.GetByID(id)
}

func (s *DocumentoService) List(colaboradorID *int, status string, limit, offset int) ([]*model.Documento, error) {
	return s.documentoRepo.List(colaboradorID, status, limit, offset)
}

func (s *DocumentoService) UpdateStatus(id int, status string, aprovadoPor int) error {
	// Validar status
	if status != "aprovado" && status != "rejeitado" && status != "pendente" {
		return errors.New("status inválido")
	}

	return s.documentoRepo.UpdateStatus(id, status, aprovadoPor)
}

func (s *DocumentoService) MarkAsSent(id int, observacoes string) error {
	// Verificar se documento existe e está aprovado
	doc, err := s.documentoRepo.GetByID(id)
	if err != nil {
		return err
	}

	if doc.Status != "aprovado" {
		return errors.New("apenas documentos aprovados podem ser enviados para finanças")
	}

	return s.documentoRepo.MarkAsSent(id, observacoes)
}
