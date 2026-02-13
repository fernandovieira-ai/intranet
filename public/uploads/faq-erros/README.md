# Pasta de Uploads - FAQ Erros

Esta pasta armazena os arquivos (imagens e PDFs) anexados aos registros de FAQ de Erros.

## Estrutura

- Arquivos nomeados como: `{id}_{hash}.{extensao}`
- Exemplo: `123_a1b2c3d4e5f6g7h8.pdf`

## Tipos Aceitos

- Imagens: JPG, PNG, GIF, WEBP
- Documentos: PDF

## Tamanho Máximo

- 10 MB por arquivo

## Gerenciamento

- Arquivos são criados automaticamente pelo sistema ao fazer upload
- Arquivos antigos são deletados automaticamente ao substituir
- Arquivos são removidos ao clicar em "Remover" no modal de edição
- Caminhos são armazenados no banco: `drfintra.tab_faq.caminho_arquivo`

## Backup

Faça backup desta pasta regularmente junto com o banco de dados.
