-- Adicionar coluna foto_perfil na tabela tab_usuario
-- Esta coluna armazenará a foto de perfil do usuário em formato binário

ALTER TABLE drfintra.tab_usuario 
ADD COLUMN IF NOT EXISTS foto_perfil BYTEA;

COMMENT ON COLUMN drfintra.tab_usuario.foto_perfil IS 'Foto de perfil do usuário em formato binário (BYTEA)';
