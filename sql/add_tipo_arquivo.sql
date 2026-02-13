-- Adiciona coluna para armazenar o tipo MIME do arquivo (imagem ou PDF)
ALTER TABLE drfintra.tab_faq 
ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(50);

-- Atualizar registros existentes com imagem para image/jpeg (valor padrão)
UPDATE drfintra.tab_faq 
SET tipo_arquivo = 'image/jpeg' 
WHERE imagem IS NOT NULL AND tipo_arquivo IS NULL;

-- Comentário da coluna
COMMENT ON COLUMN drfintra.tab_faq.tipo_arquivo IS 'Tipo MIME do arquivo anexado (image/jpeg, image/png, application/pdf, etc)';
