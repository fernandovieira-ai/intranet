-- Adiciona coluna para armazenar o caminho do arquivo no sistema de arquivos
ALTER TABLE drfintra.tab_faq 
ADD COLUMN IF NOT EXISTS caminho_arquivo VARCHAR(255);

-- Adiciona coluna para tipo MIME se não existir
ALTER TABLE drfintra.tab_faq 
ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(50);

-- Comentários das colunas
COMMENT ON COLUMN drfintra.tab_faq.caminho_arquivo IS 'Caminho relativo do arquivo (imagem ou PDF) no servidor';
COMMENT ON COLUMN drfintra.tab_faq.tipo_arquivo IS 'Tipo MIME do arquivo anexado (image/jpeg, image/png, application/pdf, etc)';

-- Nota: A coluna 'imagem' (BYTEA) pode ser mantida para compatibilidade,
-- mas novos uploads usarão apenas caminho_arquivo
