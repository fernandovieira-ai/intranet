-- Script de Setup do Banco de Dados para Railway
-- Execute este script no PostgreSQL do Railway após criar o banco

-- 1. Criar Schema
CREATE SCHEMA IF NOT EXISTS drfintra;

-- 2. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS drfintra.tab_usuario (
    id SERIAL PRIMARY KEY,
    nom_usuario VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    ind_bloqueado CHAR(1) DEFAULT 'N' CHECK (ind_bloqueado IN ('S', 'N')),
    ind_ativo CHAR(1) DEFAULT 'S' CHECK (ind_ativo IN ('S', 'N')),
    ind_adm CHAR(1) DEFAULT 'N' CHECK (ind_adm IN ('S', 'N')),
    foto_perfil BYTEA,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP,
    CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuario_nome ON drfintra.tab_usuario(nom_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON drfintra.tab_usuario(email);
CREATE INDEX IF NOT EXISTS idx_usuario_ativo ON drfintra.tab_usuario(ind_ativo) WHERE ind_ativo = 'S';

-- 4. Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS drfintra.tab_mensagem (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    usuario_id INTEGER REFERENCES drfintra.tab_usuario(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ind_ativo CHAR(1) DEFAULT 'S' CHECK (ind_ativo IN ('S', 'N'))
);

-- 5. Criar tabela de informativos
CREATE TABLE IF NOT EXISTS drfintra.tab_informativo (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    link VARCHAR(500),
    usuario_id INTEGER REFERENCES drfintra.tab_usuario(id),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ind_ativo CHAR(1) DEFAULT 'S' CHECK (ind_ativo IN ('S', 'N'))
);

-- 6. Criar tabela de FAQ/Erros
CREATE TABLE IF NOT EXISTS drfintra.tab_faq_erro (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    solucao TEXT,
    tipo_arquivo VARCHAR(50),
    caminho_arquivo VARCHAR(500),
    usuario_id INTEGER REFERENCES drfintra.tab_usuario(id),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ind_ativo CHAR(1) DEFAULT 'S' CHECK (ind_ativo IN ('S', 'N'))
);

-- 7. Criar tabela de plantão
CREATE TABLE IF NOT EXISTS drfintra.tab_plantao (
    id SERIAL PRIMARY KEY,
    data_plantao DATE NOT NULL,
    usuario_id INTEGER REFERENCES drfintra.tab_usuario(id),
    observacao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Comentários nas tabelas
COMMENT ON SCHEMA drfintra IS 'Schema da Intranet DigitalRF';
COMMENT ON TABLE drfintra.tab_usuario IS 'Tabela de usuários do sistema';
COMMENT ON TABLE drfintra.tab_mensagem IS 'Tabela de mensagens/avisos';
COMMENT ON TABLE drfintra.tab_informativo IS 'Tabela de informativos e links úteis';
COMMENT ON TABLE drfintra.tab_faq_erro IS 'Tabela de FAQ e tratamento de erros';
COMMENT ON TABLE drfintra.tab_plantao IS 'Tabela de escala de plantão';

-- 9. Verificar se tudo foi criado
SELECT 
    'Schema criado' as status,
    schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'drfintra'
UNION ALL
SELECT 
    'Tabela criada' as status,
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'drfintra'
ORDER BY status, schema_name;

-- 10. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '✅ Setup do banco de dados concluído com sucesso!';
    RAISE NOTICE '📝 Próximo passo: Criar usuário administrador';
    RAISE NOTICE '💡 Use o script: railway run node scripts/criar_admin.js';
END $$;
