package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"empresa-app/backend/internal/config"
	"empresa-app/backend/internal/handler"
	"empresa-app/backend/internal/middleware"
	"empresa-app/backend/internal/repository"
	"empresa-app/backend/internal/service"
)

func main() {
	// Carregar variáveis de ambiente
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis do ambiente")
	}

	// Inicializar conexão com banco de dados
	db, err := setupDatabase()
	if err != nil {
		log.Fatalf("Erro ao conectar ao banco de dados: %v", err)
	}
	defer db.Close()

	// Inicializar router
	router := setupRouter()

	// Inicializar repositórios
	repos := initRepositories(db)

	// Inicializar serviços
	services := initServices(repos)

	// LINHA ADICIONADA: Configurar middleware com o serviço de autenticação
	middleware.SetAuthService(services.Auth)

	// Inicializar handlers
	handlers := initHandlers(services)

	// Configurar rotas
	setupRoutes(router, handlers)

	// Iniciar servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Servidor iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}

func setupDatabase() (*sql.DB, error) {
	dbConfig := config.GetDBConfig()

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbConfig.Host, dbConfig.Port, dbConfig.User, dbConfig.Password, dbConfig.Name,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func setupRouter() *gin.Engine {
	router := gin.Default()

	// Configurar CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	return router
}

func initRepositories(db *sql.DB) *repository.Repositories {
	return &repository.Repositories{
		Colaborador: repository.NewColaboradorRepository(db),
		Documento:   repository.NewDocumentoRepository(db),
		Ponto:       repository.NewPontoRepository(db),
	}
}

func initServices(repos *repository.Repositories) *service.Services {
	return &service.Services{
		Auth:        service.NewAuthService(repos.Colaborador),
		Colaborador: service.NewColaboradorService(repos.Colaborador),
		Documento:   service.NewDocumentoService(repos.Documento),
		Ponto:       service.NewPontoService(repos.Ponto),
	}
}

func initHandlers(services *service.Services) *handler.Handlers {
	return &handler.Handlers{
		Auth:        handler.NewAuthHandler(services.Auth),
		Colaborador: handler.NewColaboradorHandler(services.Colaborador),
		Documento:   handler.NewDocumentoHandler(services.Documento),
		Ponto:       handler.NewPontoHandler(services.Ponto),
	}
}

func setupRoutes(router *gin.Engine, handlers *handler.Handlers) {
	// Rotas públicas
	router.POST("/api/auth/login", handlers.Auth.Login)

	// Grupo de rotas protegidas
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Rotas de colaborador
		api.GET("/me", handlers.Colaborador.GetMe)
		api.PUT("/me", handlers.Colaborador.UpdateMe)

		// Rotas de documentos
		api.POST("/documentos", handlers.Documento.Create)
		api.GET("/documentos", handlers.Documento.List)
		api.GET("/documentos/:id", handlers.Documento.GetByID)
		api.PUT("/documentos/:id/aprovar", handlers.Documento.Aprovar)
		api.PUT("/documentos/:id/rejeitar", handlers.Documento.Rejeitar)
		api.PUT("/documentos/:id/enviar", handlers.Documento.Enviar)
		api.GET("/documentos/:id/arquivo", handlers.Documento.Download)

		// Rotas de ponto
		api.POST("/pontos", handlers.Ponto.Registrar)
		api.GET("/pontos", handlers.Ponto.Listar)
	}
}
