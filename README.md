# Missão Praia

Site de uma página para listar casas na praia que o grupo está avaliando.

## Ver localmente

Abra `index.html` no navegador, ou rode:

```bash
python3 -m http.server 8080
```

Depois acesse [http://localhost:8080](http://localhost:8080).

## Adicionar uma casa

Edite `listings.js` e inclua um objeto no array `LISTINGS`:

```js
{
  id: "casa-3",
  nome: "Casa com deck",
  local: "Ubatuba, SP",
  preco: "R$ 2.400 / fim de semana",
  pessoas: 8,
  link: "https://...",
  notas: "Perto da praia, aceita pets",
  status: "avaliando" // avaliando | favorita | descartada
}
```

## Publicar de graça (GitHub Pages)

1. Crie um repositório no GitHub (pode ser público).
2. Envie estes arquivos para o repositório.
3. Em **Settings → Pages**, escolha:
   - Source: **Deploy from a branch**
   - Branch: `main` (ou `master`) / pasta `/ (root)`
4. Em alguns minutos o site fica em:

`https://SEU_USUARIO.github.io/NOME_DO_REPO/`

Alternativas também gratuitas: [Cloudflare Pages](https://pages.cloudflare.com/), [Netlify](https://www.netlify.com/) ou [Vercel](https://vercel.com/) — basta apontar o repositório; não precisa de build.
