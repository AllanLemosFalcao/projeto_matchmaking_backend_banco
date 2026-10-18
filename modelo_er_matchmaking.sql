

-- Criação do banco de dados para a Plataforma SaaS de Matchmaking
CREATE DATABASE IF NOT EXISTS plataforma_matchmaking;
USE plataforma_matchmaking;

-- 1. Tabela: USUARIO
CREATE TABLE USUARIO (
    id_usuario CHAR(36) PRIMARY KEY, -- UUID
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('startup', 'investidor', 'admin') NOT NULL,
    status ENUM('ativo', 'inativo', 'suspenso') DEFAULT 'ativo',
    foto_url TEXT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
);

-- 2. Tabela: CONSENTIMENTO_LGPD
CREATE TABLE CONSENTIMENTO_LGPD (
    id_consentimento CHAR(36) PRIMARY KEY, -- UUID
    id_usuario CHAR(36) NOT NULL,
    tipo_consentimento VARCHAR(50) NOT NULL,
    versao_termo VARCHAR(30) NOT NULL,
    aceite BOOLEAN NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

-- 3. Tabela: SEGMENTO
CREATE TABLE SEGMENTO (
    id_segmento CHAR(36) PRIMARY KEY, -- UUID
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255)
);

-- 4. Tabela: STARTUP
CREATE TABLE STARTUP (
    id_startup CHAR(36) PRIMARY KEY, -- UUID
    id_usuario CHAR(36) UNIQUE NOT NULL,
    nome_fantasia VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    descricao TEXT,
    estagio ENUM('ideacao', 'validacao', 'tracao', 'escala') NOT NULL,
    investimento_pretendido DECIMAL(15, 2),
    cidade VARCHAR(100),
    uf CHAR(2),
    composicao_equipe VARCHAR(255),
	mercado VARCHAR(255),
	modelo_negocio VARCHAR(255),
	participacao_oferecida DECIMAL(5,2),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

-- 5. Tabela: STARTUP_SEGMENTO (Associativa)
CREATE TABLE STARTUP_SEGMENTO (
    id_startup CHAR(36) NOT NULL,
    id_segmento CHAR(36) NOT NULL,
    principal BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_startup, id_segmento),
    FOREIGN KEY (id_startup) REFERENCES STARTUP(id_startup) ON DELETE CASCADE,
    FOREIGN KEY (id_segmento) REFERENCES SEGMENTO(id_segmento) ON DELETE CASCADE
);

-- 6. Tabela: PLANO_NEGOCIO
CREATE TABLE PLANO_NEGOCIO (
    id_plano CHAR(36) PRIMARY KEY, -- UUID
    id_startup CHAR(36) NOT NULL,
    versao INTEGER DEFAULT 1,
    proposta_valor TEXT,
    modelo_receita TEXT,
    publico_alvo TEXT,
    estrategia_monetizacao TEXT,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_startup) REFERENCES STARTUP(id_startup) ON DELETE CASCADE
);

-- 7. Tabela: INVESTIDOR
CREATE TABLE INVESTIDOR (
    id_investidor CHAR(36) PRIMARY KEY, -- UUID
    id_usuario CHAR(36) UNIQUE NOT NULL,
    tipo_investidor ENUM('anjo', 'vc', 'corporate', 'outro') NOT NULL,
    tese_investimento TEXT,
    faixa_minima DECIMAL(15, 2),
    faixa_maxima DECIMAL(15, 2),
    cidade VARCHAR(100),
    uf CHAR(2),
    perfil_publico BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

-- 8. Tabela: INVESTIDOR_SEGMENTO (Associativa)
CREATE TABLE INVESTIDOR_SEGMENTO (
    id_investidor CHAR(36) NOT NULL,
    id_segmento CHAR(36) NOT NULL,
    prioridade INTEGER DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_investidor, id_segmento),
    FOREIGN KEY (id_investidor) REFERENCES INVESTIDOR(id_investidor) ON DELETE CASCADE,
    FOREIGN KEY (id_segmento) REFERENCES SEGMENTO(id_segmento) ON DELETE CASCADE
);

-- 9. Tabela: INTERESSE
CREATE TABLE INTERESSE (
    id_interesse CHAR(36) PRIMARY KEY, -- UUID
    id_startup CHAR(36) NOT NULL,
    id_investidor CHAR(36) NOT NULL,
    iniciado_por ENUM('startup', 'investidor') NOT NULL,
    status ENUM('pendente', 'aceito', 'recusado') DEFAULT 'pendente',
    mensagem TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_startup) REFERENCES STARTUP(id_startup) ON DELETE CASCADE,
    FOREIGN KEY (id_investidor) REFERENCES INVESTIDOR(id_investidor) ON DELETE CASCADE,
    UNIQUE (id_startup, id_investidor) -- Evita múltiplos registros de interesse ativo entre os mesmos
);

-- 10. Tabela: MATCH
CREATE TABLE MATCH_CONEXAO ( -- Usando MATCH_CONEXAO pois MATCH é palavra reservada em alguns SGBDs dependendo do contexto
    id_match CHAR(36) PRIMARY KEY, -- UUID
    id_startup CHAR(36) NOT NULL,
    id_investidor CHAR(36) NOT NULL,
    score_compatibilidade DECIMAL(5,2),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    origem ENUM('organico', 'recomendacao_sistema', 'evento') DEFAULT 'organico',
    data_match TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_startup) REFERENCES STARTUP(id_startup) ON DELETE CASCADE,
    FOREIGN KEY (id_investidor) REFERENCES INVESTIDOR(id_investidor) ON DELETE CASCADE
);

-- 11. Tabela: CONVERSA
CREATE TABLE CONVERSA (
    id_conversa CHAR(36) PRIMARY KEY, -- UUID
    id_match CHAR(36) UNIQUE NOT NULL,
    status ENUM('aberta', 'arquivada', 'bloqueada') DEFAULT 'aberta',
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_match) REFERENCES MATCH_CONEXAO(id_match) ON DELETE CASCADE
);

-- 12. Tabela: MENSAGEM
CREATE TABLE MENSAGEM (
    id_mensagem CHAR(36) PRIMARY KEY, -- UUID
    id_conversa CHAR(36) NOT NULL,
    id_remetente_usuario CHAR(36) NOT NULL,
    conteudo TEXT NOT NULL,
    lida_em TIMESTAMP NULL DEFAULT NULL,
    enviada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_conversa) REFERENCES CONVERSA(id_conversa) ON DELETE CASCADE,
    FOREIGN KEY (id_remetente_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

-- 13. Tabela: AVALIACAO_BETA
CREATE TABLE AVALIACAO_BETA (
    id_avaliacao CHAR(36) PRIMARY KEY, -- UUID
    id_usuario CHAR(36) NOT NULL,
    tipo_usuario_teste ENUM('startup', 'investidor') NOT NULL,
    nota_usabilidade INTEGER CHECK(nota_usabilidade BETWEEN 1 AND 5),
    nota_utilidade INTEGER CHECK(nota_utilidade BETWEEN 1 AND 5),
    comentario TEXT,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

CREATE TABLE INVESTIDOR_ESTAGIO (
    id_investidor CHAR(36) NOT NULL,
    estagio ENUM('ideacao', 'validacao', 'MVP', 'tracao inicial', 'crescimento / scale') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_investidor, estagio),
    FOREIGN KEY (id_investidor) REFERENCES INVESTIDOR(id_investidor) ON DELETE CASCADE
);
