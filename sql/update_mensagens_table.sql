-- Atualizar tabela de mensagens para adicionar campos de data
-- Execute este script apenas uma vez

-- Adicionar colunas de data se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'bagatolliplaca'
                   AND table_name = 'tab_mensagem'
                   AND column_name = 'created_at') THEN
        ALTER TABLE bagatolliplaca.tab_mensagem
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'bagatolliplaca'
                   AND table_name = 'tab_mensagem'
                   AND column_name = 'updated_at') THEN
        ALTER TABLE bagatolliplaca.tab_mensagem
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END$$;

-- Remover constraint UNIQUE do username (usuário pode ter várias mensagens)
ALTER TABLE bagatolliplaca.tab_mensagem
DROP CONSTRAINT IF EXISTS tab_mensagem_username_key;

-- Atualizar mensagens existentes com data atual se estiverem NULL
UPDATE bagatolliplaca.tab_mensagem
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE bagatolliplaca.tab_mensagem
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Comentários nas colunas
COMMENT ON COLUMN bagatolliplaca.tab_mensagem.id IS 'ID único da mensagem';
COMMENT ON COLUMN bagatolliplaca.tab_mensagem.username IS 'Nome do usuário que criou a mensagem';
COMMENT ON COLUMN bagatolliplaca.tab_mensagem.mensagem IS 'Texto da mensagem';
COMMENT ON COLUMN bagatolliplaca.tab_mensagem.imagem IS 'Imagem anexada (bytea)';
COMMENT ON COLUMN bagatolliplaca.tab_mensagem.created_at IS 'Data de criação';
COMMENT ON COLUMN bagatolliplaca.tab_mensagem.updated_at IS 'Data de última atualização';
