package repository

import (
	"database/sql"
	"errors"
	"fmt"
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
		INSERT INTO recibos (
			usuario_id, titulo, descricao, categoria, data, 
			valor, anexo_url, dados_adicionais, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
		doc.DadosAdicionais,
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
			r.id, r.usuario_id, r.titulo, r.descricao, r.categoria, r.data,
			r.valor, r.anexo_url, r.status, r.aprovado_por, r.data_aprovacao,
			r.criado_em, r.atualizado_em, u.uuid
		FROM recibos r
		JOIN usuarios u ON r.usuario_id = u.id
		WHERE r.id = $1
	`

	doc := &model.Documento{}
	var dataAprovacao sql.NullTime
	var aprovadoPor sql.NullInt32
	var enviadoParaFinancas bool
	var dataEnvio sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&doc.ID,
		&doc.ColaboradorID,
		&doc.Titulo,
		&doc.Descricao,
		&doc.TipoDocumento,
		&doc.DataDocumento,
		&doc.Valor,
		&doc.CaminhoArquivo,
		&doc.Status,
		&aprovadoPor,
		&dataAprovacao,
		&doc.CriadoEm,
		&doc.AtualizadoEm,
		&doc.UUID,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("documento não encontrado")
		}
		return nil, err
	}

	// Converter nullable fields
	if aprovadoPor.Valid {
		val := int(aprovadoPor.Int32)
		doc.AprovadoPor = &val
	}

	if dataAprovacao.Valid {
		doc.DataAprovacao = &dataAprovacao.Time
	}

	doc.EnviadoParaFinancas = enviadoParaFinancas
	if dataEnvio.Valid {
		doc.DataEnvio = &dataEnvio.Time
	}

	return doc, nil
}

func (r *DocumentoRepository) List(colaboradorID *int, status string, limit, offset int) ([]*model.Documento, error) {
	query := `
		SELECT 
			r.id, r.usuario_id, r.titulo, r.categoria, r.data,
			r.valor, r.anexo_url, r.status, r.criado_em, u.uuid
		FROM recibos r
		JOIN usuarios u ON r.usuario_id = u.id
		WHERE 1=1
	`

	params := []interface{}{}
	paramCount := 1

	if colaboradorID != nil {
		query += fmt.Sprintf(" AND r.usuario_id = $%d", paramCount)
		params = append(params, *colaboradorID)
		paramCount++
	}

	if status != "" && status != "todos" {
		query += fmt.Sprintf(" AND r.status = $%d", paramCount)
		params = append(params, status)
		paramCount++
	}

	query += " ORDER BY r.criado_em DESC"

	if limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", paramCount)
		params = append(params, limit)
		paramCount++

		if offset > 0 {
			query += fmt.Sprintf(" OFFSET $%d", paramCount)
			params = append(params, offset)
		}
	}

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
			&doc.ColaboradorID,
			&doc.Titulo,
			&doc.TipoDocumento,
			&doc.DataDocumento,
			&doc.Valor,
			&doc.CaminhoArquivo,
			&doc.Status,
			&doc.CriadoEm,
			&doc.UUID,
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
			UPDATE recibos
			SET status = $1, aprovado_por = $2, data_aprovacao = $3, atualizado_em = CURRENT_TIMESTAMP
			WHERE id = $4
		`
		params = []interface{}{status, aprovadoPor, now, id}
	} else {
		query = `
			UPDATE recibos
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
		UPDATE recibos
		SET dados_adicionais = jsonb_set(
			COALESCE(dados_adicionais, '{}'::jsonb),
			'{enviado_para_financas}',
			jsonb_build_object('enviado', true, 'data', CURRENT_TIMESTAMP, 'observacoes', $1)
		),
		atualizado_em = CURRENT_TIMESTAMP
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
