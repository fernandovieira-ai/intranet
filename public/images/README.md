# Como Adicionar Seu Logo e Favicon

## Logo da Empresa

### Opção 1: Substituir o logo SVG

Substitua o arquivo `public/images/logo.svg` pelo seu próprio logo em formato SVG.

### Opção 2: Usar imagem PNG/JPG

1. Coloque sua imagem em `public/images/` com o nome `logo.png` ou `logo.jpg`
2. Edite o arquivo `public/index.html` e altere a linha:
   ```html
   <img
     src="images/logo.svg"
     alt="Logo"
     class="logo"
     id="logoImg"
     onerror="this.style.display='none'"
   />
   ```
   Para:
   ```html
   <img src="images/logo.png" alt="Logo" class="logo" id="logoImg" />
   ```

### Ajustar tamanho do logo

No arquivo `public/css/style.css`, encontre a classe `.logo` e ajuste:

```css
.logo {
  max-width: 150px; /* Altere este valor */
  max-height: 150px; /* Altere este valor */
  width: auto;
  height: auto;
  object-fit: contain;
}
```

## Favicon (Ícone da aba do navegador)

Para adicionar o ícone da sua empresa que aparece na aba do navegador:

### 1. Criar os arquivos de favicon

Você precisa criar 3 arquivos de ícone com estes nomes exatos:

- `favicon.ico` (formato ICO, 16x16 pixels)
- `favicon-16x16.png` (formato PNG, 16x16 pixels)
- `favicon-32x32.png` (formato PNG, 32x32 pixels)

### 2. Onde colocar os arquivos

Coloque todos os arquivos de favicon na pasta `public/images/`

### 3. Como criar os favicons

**Opção A - Usando ferramenta online (mais fácil):**
1. Acesse: https://www.favicon-generator.org/ ou https://realfavicongenerator.net/
2. Faça upload do logo da sua empresa
3. Baixe os arquivos gerados
4. Renomeie para os nomes acima e coloque na pasta `public/images/`

**Opção B - Usando software de edição:**
1. Abra seu logo em um editor de imagens (Photoshop, GIMP, etc)
2. Redimensione para 32x32 pixels
3. Salve como PNG: `favicon-32x32.png`
4. Redimensione para 16x16 pixels
5. Salve como PNG: `favicon-16x16.png`
6. Use uma ferramenta online para converter PNG em ICO: `favicon.ico`

### 4. Verificar se funcionou

Depois de adicionar os arquivos:
1. Reinicie o navegador (Ctrl+Shift+Delete para limpar cache)
2. Acesse o site novamente
3. O ícone da empresa deve aparecer na aba do navegador

## Formatos recomendados

- **SVG**: Melhor qualidade em qualquer tamanho (para logos)
- **PNG**: Com fundo transparente (recomendado para favicons)
- **ICO**: Formato tradicional para favicons
- **JPG**: Para logos com fundo
