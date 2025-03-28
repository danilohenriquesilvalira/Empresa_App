package model

import "time"

// Colaborador representa um funcionário da empresa
type Colaborador struct {
	ID             int       `json:"id"`
	UUID           string    `json:"uuid"`
	Nome           string    `json:"nome" binding:"required"`
	Email          string    `json:"email" binding:"required,email"`
	Senha          string    `json:"senha,omitempty"`
	CargoID        int       `json:"cargo_id" binding:"required"`
	DataAdmissao   time.Time `json:"data_admissao"`
	Status         string    `json:"status"`
	FotoPerfil     string    `json:"foto_perfil"`
	Telefone       string    `json:"telefone"`
	DadosBancarios []byte    `json:"dados_bancarios"`
	CriadoEm       time.Time `json:"criado_em"`
	AtualizadoEm   time.Time `json:"atualizado_em"`
}

// Cargo representa um cargo na empresa
type Cargo struct {
	ID           int       `json:"id"`
	Nome         string    `json:"nome"`
	Descricao    string    `json:"descricao"`
	CriadoEm     time.Time `json:"criado_em"`
	AtualizadoEm time.Time `json:"atualizado_em"`
}

// Documento representa um documento ou recibo digitalizado
type Documento struct {
	ID                  int        `json:"id"`
	UUID                string     `json:"uuid"`
	ColaboradorID       int        `json:"colaborador_id"`
	Titulo              string     `json:"titulo" binding:"required"`
	Descricao           string     `json:"descricao"`
	TipoDocumento       string     `json:"tipo_documento" binding:"required"`
	DataDocumento       time.Time  `json:"data_documento" binding:"required"`
	Valor               float64    `json:"valor"`
	CaminhoArquivo      string     `json:"caminho_arquivo"`
	MimeType            string     `json:"mime_type"`
	TamanhoBytes        int        `json:"tamanho_bytes"`
	Status              string     `json:"status"`
	AprovadoPor         *int       `json:"aprovado_por"`
	DataAprovacao       *time.Time `json:"data_aprovacao"`
	EnviadoParaFinancas bool       `json:"enviado_para_financas"`
	DataEnvio           *time.Time `json:"data_envio"`
	ObservacoesEnvio    string     `json:"observacoes_envio"`
	DadosAdicionais     []byte     `json:"dados_adicionais"`
	CriadoEm            time.Time  `json:"criado_em"`
	AtualizadoEm        time.Time  `json:"atualizado_em"`
}

// RegistroPonto representa um registro de ponto de entrada/saída
type RegistroPonto struct {
	ID            int       `json:"id"`
	ColaboradorID int       `json:"colaborador_id"`
	Tipo          string    `json:"tipo" binding:"required"`
	DataHora      time.Time `json:"data_hora"`
	Localizacao   []byte    `json:"localizacao"`
	IPOrigem      string    `json:"ip_origem"`
	Dispositivo   string    `json:"dispositivo"`
	Observacao    string    `json:"observacao"`
	CriadoEm      time.Time `json:"criado_em"`
}

// LoginRequest representa os dados de login
type LoginRequest struct {
	Email string `json:"email" binding:"required,email"`
	Senha string `json:"senha" binding:"required"`
}

// LoginResponse representa a resposta do login com o token
type LoginResponse struct {
	Token string       `json:"token"`
	User  *Colaborador `json:"user"`
}

// DocumentoCreateRequest representa a requisição para criar documento
type DocumentoCreateRequest struct {
	Titulo        string `form:"titulo" binding:"required"`
	Descricao     string `form:"descricao"`
	TipoDocumento string `form:"tipo_documento" binding:"required"`
	DataDocumento string `form:"data_documento" binding:"required"` // formato: 2006-01-02
	Valor         string `form:"valor"`
}

// PontoRegistroRequest representa a requisição para registro de ponto
type PontoRegistroRequest struct {
	Tipo        string `json:"tipo" binding:"required"`
	DataHora    string `json:"data_hora"`
	Localizacao string `json:"localizacao"`
	Observacao  string `json:"observacao"`
}

// UpdateResponse representa uma resposta genérica de atualização
type UpdateResponse struct {
	Message string `json:"message"`
}
