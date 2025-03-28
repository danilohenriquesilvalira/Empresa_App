package repository

import (
	"database/sql"
	"errors"
	"time"

	"empresa-app/backend/internal/model"
)

type DocumentoRepository struct {
	db *sql.DB
}

func NewDocumentoRepository(db *sql.DB) *DocumentoRepository {
	return &DocumentoRepository{db: db}
}

func (r *DocumentoRepository) Create(doc *model.Documento) error {
	query := `
		INSERT INTO documentos (
			colaborador_id, titulo, descricao, tipo_documento, data_documento,
			valor, caminho_arquivo, mime_type, tamanho_bytes, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, uuid, criado_em, atualizado_em
	`

	err := r.db.QueryRow(
		query,
		doc.ColaboradorID,
		doc.Titulo,
		doc.Descricao,
		doc.TipoDocumento,
		doc.DataDocumento,
		doc.Valor,
		doc.CaminhoArquivo,
		doc.MimeType,
		doc.TamanhoBytes,
		"pendente", // Status inicial
	).Scan(
		&doc.ID,
		&doc.UUID,
		&doc.CriadoEm,
		&doc.AtualizadoEm,
	)

	if err != nil {
		return err
	}

	return nil
}

func (r *DocumentoRepository) GetByID(id int) (*model.Documento, error) {
	query := `
		SELECT 
			id, uuid, colaborador_id, titulo, descricao, tipo_documento, data_documento,
			valor, caminho_arquivo, mime_type, tamanho_bytes, status, aprovado_por,
			data_aprovacao, enviado_para_financas, data_envio, observacoes_envio,
			dados_adicionais, criado_em, atualizado_em
		FROM documentos
		WHERE id = $1
	`

	doc := &model.Documento{}
	err := r.db.QueryRow(query, id).Scan(
		&doc.ID,
		&doc.UUID,
		&doc.ColaboradorID,
		&doc.Titulo,
		&doc.Descricao,
		&doc.TipoDocumento,
		&doc.DataDocumento,
		&doc.Valor,
		&doc.CaminhoArquivo,
		&doc.MimeType,
		&doc.TamanhoBytes,
		&doc.Status,
		&doc.AprovadoPor,
		&doc.DataAprovacao,
		&doc.EnviadoParaFinancas,
		&doc.DataEnvio,
		&doc.ObservacoesEnvio,
		&doc.DadosAdicionais,
		&doc.CriadoEm,
		&doc.AtualizadoEm,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("documento não encontrado")
		}
		return nil, err
	}

	return doc, nil
}

func (r *DocumentoRepository) List(colaboradorID *int, status string, limit, offset int) ([]*model.Documento, error) {
	query := `
		SELECT 
			id, uuid, colaborador_id, titulo, tipo_documento, data_documento,
			valor, caminho_arquivo, mime_type, status, criado_em
		FROM documentos
		WHERE 1=1
	`

	params := []interface{}{}
	paramCount := 1

	if colaboradorID != nil {
		query += " AND colaborador_id = $" + string(paramCount)
		params = append(params, *colaboradorID)
		paramCount++
	}

	if status != "" {
		query += " AND status = $" + string(paramCount)
		params = append(params, status)
		paramCount++
	}

	query += " ORDER BY criado_em DESC LIMIT $" + string(paramCount) + " OFFSET $" + string(paramCount+1)
	params = append(params, limit, offset)

	rows, err := r.db.Query(query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docs := []*model.Documento{}
	for rows.Next() {
		doc := &model.Documento{}
		err := rows.Scan(
			&doc.ID,
			&doc.UUID,
			&doc.ColaboradorID,
			&doc.Titulo,
			&doc.TipoDocumento,
			&doc.DataDocumento,
			&doc.Valor,
			&doc.CaminhoArquivo,
			&doc.MimeType,
			&doc.Status,
			&doc.CriadoEm,
		)
		if err != nil {
			return nil, err
		}
		docs = append(docs, doc)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return docs, nil
}

func (r *DocumentoRepository) UpdateStatus(id int, status string, aprovadoPor int) error {
	var query string
	var params []interface{}

	now := time.Now()

	if status == "aprovado" || status == "rejeitado" {
		query = `
			UPDATE documentos
			SET status = $1, aprovado_por = $2, data_aprovacao = $3, atualizado_em = CURRENT_TIMESTAMP
			WHERE id = $4
		`
		params = []interface{}{status, aprovadoPor, now, id}
	} else {
		query = `
			UPDATE documentos
			SET status = $1, atualizado_em = CURRENT_TIMESTAMP
			WHERE id = $2
		`
		params = []interface{}{status, id}
	}

	result, err := r.db.Exec(query, params...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("documento não encontrado")
	}

	return nil
}

func (r *DocumentoRepository) MarkAsSent(id int, observacoes string) error {
	query := `
		UPDATE documentos
		SET enviado_para_financas = true, data_envio = CURRENT_TIMESTAMP,
		    observacoes_envio = $1, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = $2
	`

	result, err := r.db.Exec(query, observacoes, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("documento não encontrado")
	}

	return nil
}
