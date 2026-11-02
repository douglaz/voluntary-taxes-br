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
   `drift` aparece em Actions. Depois, nas configurações da sua conta no GitHub
   (github.com/settings/notifications), em Notifications → Actions → Email, marque
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
   variables → Actions). Enquanto o secret `HC_PING_URL` não existir, o passo Heartbeat do
   workflow falha (`curl` com URL vazia sai com código 2): crie o secret antes da primeira
   execução agendada ou espere e-mails de falha até lá.
7. **Cabeçalhos.** Depois de cada deploy:

   ```sh
   curl -sI https://queropagarmais.com/
   ```

   Todos os cabeçalhos de `site/_headers` devem aparecer.

## Checklist de lançamento (manual; bloqueia o lançamento)

1. **Cabeçalhos.** Depois do deploy, `curl -sI` no domínio mostra todos os cabeçalhos de
   `site/_headers`, e `*.pages.dev` redireciona para o domínio.
2. **Contribuição real.** Num celular, a partir da página **publicada**, contribua cerca de
   R$ 1 (não reembolsável) pela URL gerada pelo site:
   - o PagTesouro mostra exatamente as três linhas do bloco "Para onde vai o dinheiro?";
   - a Referência e o valor vêm preenchidos e travados;
   - o campo de nome está vazio e editável;
   - nenhum CPF é exigido.
3. **Pagamento.** Clique em "Iniciar Pagamento" e confirme:
   - o servidor aceita os valores travados;
   - o Pix é oferecido, com copia-e-cola para pagar no mesmo celular.

   Conclua o pagamento. Depois atualize "escolha como pagar" com os meios realmente oferecidos.
4. **Linha de base.** Registre o JSON da API e os nomes dos arquivos `main-*.js` e `chunk-*.js`
   daquele dia e faça commit deles em `docs/pagtesouro-baseline/`. São dados públicos. Assim
   um alarme de drift posterior pode ser comparado com a versão verificada.
5. **Caminho do alerta.** Execute o workflow de drift com `servico=999999`, confirme que o
   e-mail de falha chega, depois execute normalmente e confirme que o healthchecks.io recebeu
   o ping.
6. **Teclados.** Digite valores num iPhone e num Android reais, cada um com idioma/região em
   português e em inglês, e confirme os resultados da spec §6.5 e o eco.

## Licença

MIT. Veja `LICENSE`.
