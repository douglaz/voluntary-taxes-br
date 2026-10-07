# PagTesouro observations (2026-10-06)

No Tesouro document describes the Portal GRU URL parameters; the only official API manual covers the authenticated API. Everything below was observed in PagTesouro's public Angular bundle, its public service-record endpoint and live loads of the pre-filled form. No payment was started.

## Route and parameters

- **App and routing.** `https://pagtesouro.tesouro.gov.br/portal-gru/` is an Angular app with hash routing (`useHash:!0`).
- **The redirect.** `#/pagamento-gru?…` redirects to `#/pagamento-gru/formulario?…` and keeps the parameters: `e.servico&&this.router.navigate(["/pagamento-gru/formulario"],{replaceUrl:!0,queryParamsHandling:"preserve"})`.
- **The code chain.**
  1. `index.html` loads `main-TNKP3UTJ.js`.
  2. `main-TNKP3UTJ.js` lazy-loads the form: `path:"pagamento-gru",loadChildren:()=>import("./chunk-VM5AIFZ4.js")`.
  3. `chunk-VM5AIFZ4.js` reads the URL: `this.route.queryParams.subscribe(e=>{let i=e.servico;…this.numeroReferenciaUrl=e.numeroReferencia,…this.valorPrincipalUrl=e.valorPrincipal`.
- **Parameters read.** `servico`, `cpfCnpjContribuinte`, `nomeContribuinte`, `numeroReferencia`, `competencia`, `vencimento`, `valorPrincipal`, `descontosAbatimentos`, `moraMulta`, `jurosEncargos`. `vencimento` is `YYYY-MM-DD`.

## Values from the URL

- **Every field filled from the URL is locked.** The code calls `setValue(…)` and then `disable()`, so the payer cannot edit it on PagTesouro.
- **Amounts** are parsed with `+this.valorPrincipalUrl`:
  - `1234.56` displays as "R$ 1.234,56".
  - `100,00` and `1,234.56` become `NaN`.
- **Browser-side checks are skipped.** Disabled controls are left out of form validation, and submit sends `getRawValue()`. A 61-character name and the reference `ABC-123456789012345678901` both displayed without error. What the server does with such values is unknown.
- **Limits that apply only to typed values:** name 2–45 characters; reference digits only, at most 20; CPF/CNPJ at most 18 characters; amount mask `currency 13.2` with floor `0.01`.
- **Name encoding:**
  - `+` and `%20` decode to a space.
  - `%2B` gives a literal `+`.
  - UTF-8 percent-encoding works: `Jo%C3%A3o%20%26%20Maria` displays as "João & Maria".
  - A Latin-1 `%E3` breaks the app.

## Service 018235

From `GET https://pagtesouro.tesouro.gov.br/api/gru/portal/servicos/018235`:

- **Codes and names:**
  - `codigoServico: "018235"`
  - `nomeServico: "DOAÇÕES AO FUNDO DE COMBATE E ERRADIC. DA POBREZA"`
  - `codigoOrgao: "55000"`, "MIN.DESENV.E ASSIT.SOCIAL,FAM.E COMBATE FOME"
  - UG 550008, "SECRETARIA NAC. DE SEGUR. ALIMENTAR E NUTRIC."
- **Required fields:** `numeroReferenciaObrigatorio: true`, `cpfCnpjContribuinteObrigatorio: false`.
- **Unknown codes:** `GET …/servicos/999999` returns `404 [{"codigo":"C0005","descricao":"Serviço inexistente."}]`.
- **How the form shows them:** `código - título` lines for Órgão, UG and Serviço.
- **Payment methods:** the MDS lists Pix, credit card and boleto GRU. Nobody has observed which ones PagTesouro offers for this service.
- **Limits:** Tesouro's GRU Digital guide (2021) says "Não tem limite de valores".

## Sources

- MDS donation page: https://www.gov.br/mds/pt-br/acesso-a-informacao/receita-e-despesas/doacoes-ao-fundo-de-combate-e-erradicacao-da-pobreza
- Decreto 4.564/2003, as worded by Decreto 11.992/2024: https://www.planalto.gov.br/ccivil_03/decreto/2003/d4564.htm
- EC 67/2010: https://www.planalto.gov.br/ccivil_03/constituicao/Emendas/Emc/emc67.htm
- LC 111/2001: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp111.htm
- GRU Digital guide: https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/42152_1320029/7_GRU_Digital.pdf
