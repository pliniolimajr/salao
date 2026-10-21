# Site comercial do Studio Modesto

## Build e publicação

`npm run build` gera o aplicativo e oito páginas públicas com HTML pré-renderizado em `dist/`, além de `404.html` e uma entrada privada `app.html`. A configuração da Vercel atende os arquivos públicos e envia `/login` e `/admin` para a aplicação. Endereços inexistentes recebem HTTP 404.

Configure `VITE_SITE_URL` com o endereço HTTPS definitivo, sem caminho. O mesmo valor alimenta a versão do navegador e o gerador de HTML. Com essa variável, o build inclui URLs canônicas, imagem de compartilhamento, dados estruturados do negócio e sitemap. Sem ela, o site funciona, mas esses itens que dependem do domínio ficam omitidos. Não use um domínio de exemplo na publicação.

O catálogo e a agenda são carregados no navegador. Preços e disponibilidade não são congelados no HTML do build. Use as variáveis públicas do Supabase descritas em `.env.example`; nunca uma chave de serviço.

Validação: `npm run lint`, `npm run build` e inspeção da versão de produção, inclusive com JavaScript desativado. O servidor de desenvolvimento usa renderização no navegador; para conferir o HTML estático, teste os arquivos de `dist/`.

## Conteúdo que precisa vir do salão

- Fotografias reais do espaço, equipe e atendimentos, com autorização para uso.
- História, nomes e especialidades confirmados para enriquecer O Studio.
- Trabalhos reais autorizados para criar a galeria de resultados.
- Avaliações com origem verificável e identificação autorizada.
- Confirmação do endereço, horários e regras do programa de fidelidade antes de publicar.

As imagens atuais são ilustrativas. Não devem ser apresentadas como portfólio de trabalhos do Studio. A página Resultados será criada quando houver material real.

## Compartilhamento e manutenção

`public/share-card.png` é a imagem de compartilhamento (1200 × 630); o layout editável está em `scripts/share-card.html`. `public/favicon.svg` contém o monograma do site. As rotas e seus metadados ficam em `src/config/public-routes.json`. Ao adicionar uma página pública, atualize essa lista e as rotas em `PublicRoutes.tsx`.

Login e administração recebem `noindex` e ficam fora do sitemap. Isso não substitui autenticação; as rotas protegidas e regras do Supabase continuam responsáveis pelo acesso aos dados.
