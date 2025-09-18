# Deploy do Site React no HostGator

## Passo a Passo do Deploy

### 1. Preparação Local

1. Faça a build do projeto:
   ```bash
   npm run build
   ```

2. O arquivo `.htaccess` já foi criado na raiz do projeto e deve ser incluído no deploy.

### 2. No Painel do HostGator

1. Faça login no seu painel de controle do HostGator
2. Procure por "File Manager" (Gerenciador de Arquivos)
3. Navegue até a pasta `public_html` (ou o diretório do seu domínio)

### 3. Upload dos Arquivos

1. Faça upload dos seguintes arquivos e pastas:
   - Todo o conteúdo da pasta `build/`
   - O arquivo `.htaccess`

2. A estrutura de pastas deve ficar assim no seu servidor:
   ```
   public_html/
   ├── index.html
   ├── .htaccess
   └── static/
       ├── css/
       │   └── main.*.css
       ├── js/
       │   └── main.*.js
       └── media/
           └── (seus arquivos de mídia)
   ```

### 4. Verificação

1. Após o upload, limpe o cache do navegador
2. Acesse seu site através do domínio configurado
3. Verifique se todas as páginas estão funcionando corretamente

### 5. Atualização Futura

Para atualizar o site:
1. Faça uma nova build local: `npm run build`
2. Faça upload dos arquivos atualizados no servidor
3. Limpe o cache do navegador
