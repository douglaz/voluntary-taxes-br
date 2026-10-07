# Quero Pagar Mais

Uma página estática que ajuda qualquer pessoa a fazer uma contribuição voluntária ao Fundo de
Combate e Erradicação da Pobreza, pelo PagTesouro, o sistema de pagamentos do Tesouro Nacional.
A pessoa escolhe um valor, a página gera um número de referência e a leva ao PagTesouro com o
serviço (018235), a referência e o valor já preenchidos. O nome é digitado lá, e o pagamento
acontece lá.

Este site não recebe, não intermedeia e não armazena dinheiro nem dados pessoais. É um site
independente, sem vínculo com o Governo Federal. A contribuição é voluntária e não substitui
nenhuma obrigação tributária.

Não há backend, dependências, build, cookies, analytics nem requisições a terceiros: `site/` é
servido como está, e o código-fonte visível no navegador é o código completo. A especificação
está em `spec.md`; o glossário em `CONTEXT.md`; as decisões em `docs/adr/`.

## Testes

```sh
node --test
```

Cobre `site/contribuicao.js` (parsing do valor, Referência, URL do PagTesouro). Só usa
`node:test` e `node:assert`.

## Verificação de deriva do PagTesouro

O pré-preenchimento por URL não é documentado pelo Tesouro, então `scripts/drift.sh` confere
diariamente (via `.github/workflows/drift.yml`) que o registro do serviço 018235 e o código do
PagTesouro continuam como observados. Localmente:

```sh
scripts/drift.sh            # serviço 018235; sai com 0 se tudo confere
scripts/drift.sh 999999     # força uma falha na checagem 1
```

Precisa de `bash`, `curl`, `jq` e GNU `grep`.

## Valores a confirmar antes do lançamento

Dois valores em `site/index.html` foram escolhidos antes de o repositório e o domínio existirem.
Confirme ou troque:

- **"Código aberto"**: `https://github.com/douglaz/voluntary-taxes-br`
- **"Avise um problema"**: `mailto:problema@queropagarmais.com`

## Configuração manual (dono do projeto)

1. **GitHub.** Crie o repositório público, faça o push deste branch e confira que o workflow
   `drift` aparece em Actions. Em Settings → Notifications → Actions → Email, marque
   "Only notify for failed workflows" (vem desligado).
2. **Cloudflare Pages.** Crie um projeto a partir do repositório: framework preset "None", sem
   build command, output directory `site/`. Os cabeçalhos de `site/_headers` são aplicados
   automaticamente.
3. **Domínio.** Registre `queropagarmais.com` pelo Cloudflare Registrar (ver
   `docs/adr/0001-dot-com-domain.md`), com renovação automática plurianual, e adicione-o como
   custom domain do projeto Pages.
4. **Redirecionamento.** Crie um Bulk Redirect de `*.pages.dev` para o domínio, para que exista
   uma única origem.
5. **E-mail.** Em Email Routing, crie o alias usado em "Avise um problema" apontando para a sua
   caixa.
6. **Heartbeat.** Em healthchecks.io, crie um check com período de 1 dia e grace de 1 dia e
   guarde a URL de ping no secret `HC_PING_URL` do repositório (Settings → Secrets and
   variables → Actions).
7. **Cabeçalhos.** Depois de cada deploy:

   ```sh
   curl -sI https://queropagarmais.com/
   ```

   Todos os cabeçalhos de `site/_headers` devem aparecer.

## Checklist de lançamento (manual; bloqueia o lançamento)

1. **Headers.** Deploy, then `curl -sI` on the domain shows every header in `site/_headers`,
   and `*.pages.dev` redirects to the domain.
2. **Real contribution.** On a phone, from the **deployed** page, contribute about R$ 1 (not
   refundable) through the site-generated URL:
   - PagTesouro shows the three lines of the "Para onde vai o dinheiro?" block exactly.
   - The Referência and amount are filled in and locked.
   - The name field is empty and editable.
   - No CPF is required.
3. **Payment.** Click "Iniciar Pagamento" and confirm:
   - the server accepts the locked values;
   - Pix is offered, with copia-e-cola for paying on the same phone.

   Complete the payment. Then update "escolha como pagar" with the methods actually offered.
4. **Baseline.** Record the API JSON and the `main-*.js` and `chunk-*.js` file names of that
   day, and commit them under `docs/pagtesouro-baseline/`. They are public data. That way a
   later drift alarm can be compared against the verified version.
5. **Alert path.** Run the drift workflow with `servico=999999`, confirm the failure email
   arrives, then run it normally and confirm healthchecks.io received the ping.
6. **Keypads.** Type amounts on a real iPhone and a real Android phone, each with Portuguese
   and English language/region settings, and confirm the results of spec §6.5 and the echo.

## Licença

MIT. Veja `LICENSE`.
