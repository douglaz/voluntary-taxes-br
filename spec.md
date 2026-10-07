# Quero Pagar Mais — Specification

This supersedes `idea-01.md`. Domain terms (**Contribuição**, **Contribuinte**, **Fundo**, **Referência**, **PagTesouro**) are defined in `CONTEXT.md`. Decision records live in `docs/adr/`.

## 1. What it is

A single static page that helps a person make a voluntary **Contribuição** to the federal **Fundo** de Combate e Erradicação da Pobreza. The page:

1. asks for an amount,
2. generates a **Referência**,
3. builds a PagTesouro URL that fills in the service, the Referência and the amount,
4. navigates the browser to `pagtesouro.tesouro.gov.br`, in the same tab.

The Contribuinte then types their name on PagTesouro, chooses how to pay, and pays there.

The site never receives, holds, proxies or confirms money. It is not affiliated with the government, and it never claims to be.

**The URL pre-fill is undocumented.** No Tesouro document describes these URL parameters. The behaviour was observed in PagTesouro's own Angular code and live form on 2026-10-06 (`docs/pagtesouro-observations.md`). The integration therefore depends on behaviour PagTesouro can change without notice, which is why §11 monitors it.

## 2. Destination

| | |
|---|---|
| Fundo | Fundo de Combate e Erradicação da Pobreza (ADCT art. 79, made permanent by EC 67/2010; LC 111/2001) |
| Ministry | Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome (Decreto 4.564/2003, as worded by Decreto 11.992/2024) |
| Órgão | 55000 |
| UG | 550008 |
| Serviço | 018235 |
| Official instructions | https://www.gov.br/mds/pt-br/acesso-a-informacao/receita-e-despesas/doacoes-ao-fundo-de-combate-e-erradicacao-da-pobreza |

PagTesouro's own record for the service (`GET https://pagtesouro.tesouro.gov.br/api/gru/portal/servicos/018235`) says:
- the Referência is required;
- a CPF/CNPJ is not required.

## 3. Non-goals

The site MUST NOT:
- receive or custody funds;
- generate a Pix key or Pix QR code;
- proxy the payment;
- ask for the contributor's name, CPF/CNPJ or banking data;
- store anything about the contributor;
- require an account;
- call any PagTesouro API from the browser, or hold any PagTesouro token;
- try to detect whether the payment succeeded, or ever say "Pagamento realizado com sucesso";
- describe the Contribuição as a tax, or say it settles, replaces or reduces a tax obligation;
- make any claim, either way, about income-tax deductibility;
- imitate gov.br branding or claim official status;
- embed PagTesouro in an iframe.

## 4. Flow

```text
Valor (quick amount or typed) → live echo → [Continuar no PagTesouro]
  → (only for an ambiguous amount, see §6.4) second click on "Confirmar R$ …"
  → PagTesouro form: service, Referência and amount filled in and locked
  → Contribuinte types their name there → chooses how to pay
```

**Why we don't ask for the name.** PagTesouro accepts `nomeContribuinte` in the URL, but every field it fills from the URL is disabled. A typo in a pre-filled name could not be corrected there. PagTesouro's form checks also skip disabled fields, so the browser would not check the name either; what its server does is unknown. Asking on our page saves no typing, because the name is typed once wherever it is asked. So we send only `servico`, `numeroReferencia` and `valorPrincipal`, and PagTesouro collects and checks the name. The name therefore never touches our page, the URL or the browser history.

**Why there's no confirmation screen.** The live echo shows the amount before the click, and PagTesouro shows it again before "Iniciar Pagamento". The one input that can be misread by ×1000 needs a second, explicit click (§6.4).

## 5. Page

### 5.1 Layout (mobile-first, one screen)

```text
                 Quero Pagar Mais

Faça uma contribuição voluntária ao Brasil

Quer contribuir além dos impostos que você já paga?
Envie qualquer valor diretamente ao Fundo de Combate e Erradicação
da Pobreza, pelo PagTesouro, o sistema de pagamentos do Tesouro Nacional.

[ R$ 10 ] [ R$ 50 ] [ R$ 100 ] [ R$ 500 ]

Valor (R$)
[____________]
Você vai contribuir R$ 100,00            ← live echo, aria-live="polite"

[        Continuar no PagTesouro        ]

Você será levado ao site oficial pagtesouro.tesouro.gov.br.
Lá, digite seu nome e escolha como pagar. O valor e o número de
referência chegam preenchidos e não podem ser alterados lá — para
mudar o valor, volte a esta página.
Este site não recebe, não intermedeia e não armazena seu dinheiro.

────────────────────────────────────────

Para onde vai o dinheiro?
Fundo de Combate e Erradicação da Pobreza
Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome
Órgão 55000 · UG 550008 · Serviço 018235

No PagTesouro, confira estas linhas (como aparecem lá, abreviadas):
55000 - MIN.DESENV.E ASSIT.SOCIAL,FAM.E COMBATE FOME
550008 - SECRETARIA NAC. DE SEGUR. ALIMENTAR E NUTRIC.
018235 - DOAÇÕES AO FUNDO DE COMBATE E ERRADIC. DA POBREZA

[ Instruções oficiais do MDS ]

────────────────────────────────────────

Este é um site independente, sem vínculo, afiliação ou endosso do
Governo Federal. O pagamento é feito diretamente no PagTesouro,
serviço oficial da Secretaria do Tesouro Nacional.
A contribuição é voluntária e não substitui nenhum imposto ou
obrigação tributária.
Privacidade: este site não usa cookies nem analytics e não pede dados
pessoais. Como qualquer site, o provedor de hospedagem (Cloudflare)
registra dados técnicos de acesso, como o endereço IP.
Código aberto · Avise um problema
```

- **The three PagTesouro lines are quoted verbatim, including "ASSIT."** That is how PagTesouro spells it. The drift check (§11) asserts these strings.
- **"Código aberto"** links to the public GitHub repo. **"Avise um problema"** is a `mailto:` to a Cloudflare Email Routing alias on the site's domain, so visitors without a GitHub account can report problems.
- **"escolha como pagar"** stays generic until the launch check (§12) confirms which methods PagTesouro offers for 018235. The MDS lists Pix, card and boleto, but nobody has observed them for this service.
- **Copy rules:**
  - Address the person as "você".
  - Say "contribuição voluntária", never "imposto" or "tributo", for the act.
  - The brand's "Pagar" is wordplay.
  - Do not name the bank-app Pix recipient, which nobody has observed and which may vary by bank.

### 5.2 Without JavaScript

```html
<noscript>Este site precisa de JavaScript para montar o link do PagTesouro.
Sem ele, siga as <a href="…MDS URL…">instruções oficiais do MDS</a>.</noscript>
```

A GET form cannot put parameters after the `#`, so there is no pure-HTML fallback.

### 5.3 Accessibility (WCAG 2.2 AA)

- `<html lang="pt-BR">`, a semantic `<form novalidate>`, and an explicit `<label for>`.
- Visible focus, sufficient contrast, and no information carried by colour alone.
- Buttons at least 44 px high. The CTA is full-width on small screens.
- Quick amounts are `<button type="button">`. They set the field and update the echo.
- The echo is `aria-live="polite"`. It is recomputed on `input` and on `pageshow`, because a value restored by the back button fires no `input` event.
- Errors appear inline under the field, linked with `aria-describedby`, with `aria-invalid="true"` set on the field. On submit, focus moves to the field. The value is never cleared.

### 5.4 Visual

Clean and minimal: no fintech clutter, no fake banking UI. Content width 480–640 px, usable from 320 px. Brazilian colours may be decorative only. No gov.br logos, seals or design identity, and no third-party fonts.

## 6. Amount

The input is `<input type="text" inputmode="decimal" autocomplete="off">`. A `type="number"` input rejects commas.

The amount is held internally as an integer number of **centavos**. Never use binary floating point for parsing, validation or the URL value.

### 6.1 `parseAmount(input, locale)`

`locale` is `navigator.language` in the page and an argument in tests. The function returns `{ centavos, confirm }` or `{ error }`.

1. **Normalise.** Remove `R$` (case-insensitive) and all whitespace (`\s`, which includes U+00A0 and U+202F).
2. **Charset.** The result must match `^[0-9][0-9.,]*[0-9]$|^[0-9]$`. It must start and end with a digit and contain only digits, `.` and `,`.
3. **Decimal separator.** Only `.` and `,` are ever separators; never use `Intl`'s group character.
   - **Both `.` and `,` present:** the one that occurs last is the decimal separator. It must occur exactly once. The other is grouping.
   - **One kind present, more than once:** it is grouping, and there is no decimal part.
   - **One kind present, exactly once, followed by:**
     - **1–2 digits:** it is the decimal separator, in every locale.
     - **exactly 3 digits:** ambiguous, so the locale decides. Get the locale's decimal separator from `new Intl.NumberFormat(locale).formatToParts(1.5)`. If it is neither `.` nor `,`, use `,` (pt-BR).
       - If it **equals** this separator, the input has 3 decimal places, which is an error.
       - Otherwise this separator is grouping, and the result gets `confirm: true`.
     - **4 or more digits:** error.
   - **None present:** an integer number of reais.
4. **Grouping.** When there is a grouping separator, the first group has 1–3 digits and does not start with `0`; every later group has exactly 3 digits. So `0.500` and `1.00.000` are rejected, and `en-IN`'s `1,00,000` is not supported.
5. **Decimals.** 1–2 digits, padded to 2.
6. **Bounds.**
   - **Above the cap:** more than 13 integer digits (ignoring leading zeros) is an error. The cap is `9999999999999.99`, the most PagTesouro's `currency 13.2` input mask can display. PagTesouro documents no payment limit ("Não tem limite de valores").
   - **Zero:** an error.

### 6.2 Error messages

| Condition | Message |
|---|---|
| empty or zero | Informe um valor maior que R$ 0,00. |
| bad charset or format, bad grouping | Valor inválido. Exemplos: 50, 10,50 ou 1.000,00. |
| 3 decimals (locale decided) or 4+ digits after the only separator | Use no máximo duas casas decimais (ex.: 10,50) ou escreva sem pontos (ex.: 1000). |
| above the cap | Valor acima do máximo aceito pelo PagTesouro. |

Errors show only on submit. While the contributor is typing, an unparseable value just blanks the echo. Inputs like `10,` or `1.` must not flash an error mid-typing.

### 6.3 Echo and formatting

- **Echo:** `Você vai contribuir R$ 1.000,00`. It always uses pt-BR format, whatever the locale, because that matches the page language and what PagTesouro shows next. Format it from the integer: reais via `Intl.NumberFormat("pt-BR")`, plus `,` and the zero-padded centavos.
- **`valorPrincipal`:** `${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`, for example `1000.00`. PagTesouro reads it with `+value`, so only a `.` decimal and no grouping work.

### 6.4 Confirmation

When `confirm` is true (a single separator followed by exactly 3 digits, read as thousands), the first submit does not navigate. Instead:

- The button relabels to **"Confirmar R$ 10.500,00"**.
- The echo adds "Confira o valor antes de continuar."
- A second submit navigates.
- Any edit to the field, or a quick-amount click, restores the normal label and requires confirmation again.

This catches `10.500` typed for `10.50`, which PagTesouro would otherwise lock in as the wrong amount. Don't use `window.confirm()`: in-app browsers whose WebView lacks a dialog handler, possibly WhatsApp's and Instagram's, return `false` without showing anything, so the contributor could never proceed.

### 6.5 Required test cases

| Input | Locale | Result |
|---|---|---|
| `10` | any | 1000 |
| `10,5` / `10,50` | any | 1050 |
| `10.50` | pt-BR | 1050 |
| `10,50` | en-US | 1050 |
| `1000` | any | 100000 |
| `1.000` | pt-BR | 100000, confirm |
| `1.000` | en-US | error: decimals |
| `1,000` | en-US | 100000, confirm |
| `10,999` | pt-BR | error: decimals |
| `10,999` | en-US | 1099900, confirm |
| `10.500` | pt-BR | 1050000, confirm |
| `1.000,00` / `R$ 1.000,00` / `1 000,50` | pt-BR | 100000 / 100000 / 100050 |
| `1,000.50` | any | 100050 |
| `1.000.000` / `1,000,000` | any | 100000000 |
| `1.000.50` / `1.00.000` | any | error: format |
| `0.500` | pt-BR | error: format (grouping can't start with `0`) |
| `0.500` | en-US | error: decimals |
| `10,` / `.50` / `abc` / `-10` | any | error: format |
| `0` / `0,00` | any | error: zero |
| `0,50` | any | 50 |
| `10.5000` | any | error: decimals |
| `12345678901234` | any | error: cap |
| `1.000` | ar-EG | 100000, confirm (locale decimal is `٫`, so pt-BR rules apply) |

## 7. Referência

`createReference(date = new Date())` returns `YYYYMMDDHHmmss` in the browser's local time: 14 digits, generated on click and not shown on our page. PagTesouro shows it on the form and the GRU. It is not unique: two clicks in the same second share one, which is harmless.

## 8. PagTesouro URL

```js
const BASE = "https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru"
const params = new URLSearchParams({ servico: "018235", numeroReferencia, valorPrincipal })
window.location.assign(`${BASE}?${params}`)
```

- **The route** is `#/pagamento-gru`, the one the MDS links to. PagTesouro forwards it to `#/pagamento-gru/formulario` and keeps the parameters (`queryParamsHandling:"preserve"`); §11 checks that the forwarding still happens.
- **Before navigating, assert:**
  - `numeroReferencia` matches `^\d{1,20}$`;
  - `valorPrincipal` matches `^\d{1,13}\.\d{2}$` and is greater than zero.

  PagTesouro skips its own browser-side checks on values that come from the URL, so ours are the only ones.
- **Never send `nomeContribuinte` or `cpfCnpjContribuinte`.**

## 9. Privacy

- **Nothing to store or track:** no cookies, no `localStorage`/`sessionStorage`/IndexedDB, no analytics (including Cloudflare Web Analytics), and no third-party requests.
- **Browser history:** the amount and the Referência end up in the PagTesouro URL fragment. That is intended, and the URL contains no personal data.
- **Host logs:** the hosting provider logs request metadata, and the footer says so.

## 10. Stack, hosting, security

### 10.1 Files

```text
/
├── site/                     deployed as-is (Cloudflare Pages output dir; no build command)
│   ├── index.html
│   ├── styles.css
│   ├── main.js               DOM wiring only
│   ├── contribuicao.js       pure: parseAmount, createReference, buildPagTesouroUrl, formatBRL
│   ├── favicon.svg
│   └── _headers
├── contribuicao.test.js      node --test (imports ./site/contribuicao.js)
├── .github/workflows/drift.yml
├── docs/                     adr/, pagtesouro-observations.md, pagtesouro-baseline/
├── .gitignore                includes .context/ and .gstack/
├── LICENSE
└── README.md
```

- **Zero npm dependencies and no build step.** The served files are the source, and view-source is a complete audit. `idea-01.md`'s lockfile and dependency-scanning requirements are replaced by having no dependencies.
- **Tests:** `node --test`. Node's full ICU covers `Intl`. Tests assert centavos and URLs, not formatted strings, because Node's locale data (CLDR) can differ from browsers'. If Node needs it, a `package.json` containing only `{"type":"module"}` is allowed.
- **Caching:** everything gets short caching with revalidation. Files have no content hashes, so immutable asset caching does not apply.

### 10.2 Host must send `_headers`

The site is hosted on **Cloudflare Pages**, deploying from the public GitHub repo on the owner's existing account, with output directory `site/`. Clickjacking is cheap to block, so it is blocked, but the real threats are account takeover, domain takeover and lookalike clones. The protections live in `site/_headers`:

```text
/*
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'none'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'none'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  Cache-Control: no-cache
```

- **Never GitHub Pages.** It cannot send custom headers, and a `<meta>` CSP cannot set `frame-ancestors`, so moving there would silently drop protection while the site looks identical.
- **Netlify** reads the same basic `_headers` syntax and is the fallback.
- **After every deploy**, verify with `curl -sI https://<domain>/`.
- **The `*.pages.dev` hostname** is redirected to the custom domain (Cloudflare Bulk Redirect), so there is one origin.
- **No `innerHTML`.** Set text with `textContent` only.

### 10.3 Domain and accounts

- **Domain:** `queropagarmais.com` (if available) through Cloudflare Registrar, with whois redacted. See ADR 0001 (`docs/adr/0001-dot-com-domain.md`) for why not `.com.br`.
- **Renewal:** multi-year auto-renew.
- **2FA** (hardware key preferred) on GitHub and Cloudflare.
- **Email:** Cloudflare Email Routing provides the "Avise um problema" alias.

## 11. Drift monitoring

`.github/workflows/drift.yml` runs **daily at an off-hour minute** (e.g. `17 9 * * *`) and on `workflow_dispatch`. A `servico` input defaults to `018235`; set it to `999999` to force a failure. Scheduled runs get no inputs, so the job sets `SERVICO: ${{ inputs.servico || '018235' }}`.

**1. Service record**

```sh
curl -fsS --retry 3 --retry-all-errors -m 30 \
  https://pagtesouro.tesouro.gov.br/api/gru/portal/servicos/$SERVICO > s.json
jq -e '.codigoServico == "018235"
  and .nomeServico == "DOAÇÕES AO FUNDO DE COMBATE E ERRADIC. DA POBREZA"
  and .codigoOrgao == "55000"
  and .cpfCnpjContribuinteObrigatorio == false' s.json
```

- **Also assert** the UG code `550008` and the Órgão and UG titles quoted in §5.1. Take the exact field names (`tituloOrgao`, the UG code and title fields) from the live response when implementing.
- **Retirement:** a retired service returns `404` with `C0005 Serviço inexistente`, which makes `curl -f` fail.
- **Not asserted:** `numeroReferenciaObrigatorio`. If it flipped, nothing would break.

**2. PagTesouro code still reads our parameters.** Three plain GETs, about 105 KB:

```sh
B=https://pagtesouro.tesouro.gov.br/portal-gru
M=$(curl -fsS $B/ | grep -oE 'main-[A-Z0-9]+\.js' | head -1)
C=$(curl -fsS $B/$M | grep -oE 'path:"pagamento-gru",loadChildren:\(\)=>import\("\./chunk-[A-Z0-9]+\.js' | grep -oE 'chunk-[A-Z0-9]+\.js')
curl -fsS $B/$C > c.js
grep -qF '"/pagamento-gru/formulario"],{replaceUrl:!0,queryParamsHandling:"preserve"}' c.js
grep -qE 'queryParams\.subscribe\(([A-Za-z_$][A-Za-z0-9_$]*)=>\{let [A-Za-z_$][A-Za-z0-9_$]*=\1\.servico' c.js
for p in numeroReferencia valorPrincipal; do
  grep -qE "${p}Url=[A-Za-z_\$][A-Za-z0-9_\$]*\.$p\b" c.js
done
```

- **Never grep bare parameter names.** They also appear as form-control names and would still match after a URL-parameter rename.
- **A pattern that isn't found is an alarm.** A change in how PagTesouro bundles its code then raises a false alarm rather than missing a real break.
- **Not covered here:** whether PagTesouro's server accepts our values, and which payment methods it offers. Those are covered only by §12. Known gap: these checks are static. A headless-browser run that reaches "Iniciar Pagamento" would cover them, if breakage ever slips past.

**3. Heartbeat.** The last step of a successful run pings a healthchecks.io check (secret `HC_PING_URL`; period 1 day, grace 1 day). If the pings stop for any reason, including GitHub disabling scheduled workflows after 60 days without repository activity, healthchecks.io emails the owner.

**Alert delivery:**
- The owner commits the workflow; scheduled-run notifications go to the workflow's creator.
- The owner sets GitHub → Settings → Notifications → Actions → Email → "Only notify for failed workflows". It is off by default.
- If the workflow is disabled, the owner re-enables it with "Enable workflow" or `gh workflow enable`.

## 12. Launch checklist (manual; blocks launch)

1. **Headers.** Deploy, then `curl -sI` on the domain shows every header in §10.2, and `*.pages.dev` redirects to the domain.
2. **Real contribution.** On a phone, from the **deployed** page, contribute about R$ 1 (not refundable) through the site-generated URL:
   - PagTesouro shows the three §5.1 lines exactly.
   - The Referência and amount are filled in and locked.
   - The name field is empty and editable.
   - No CPF is required.
3. **Payment.** Click "Iniciar Pagamento" and confirm:
   - the server accepts the locked values;
   - Pix is offered, with copia-e-cola for paying on the same phone.

   Complete the payment. Then update "escolha como pagar" with the methods actually offered.
4. **Baseline.** Record the API JSON and the `main-*.js` and `chunk-*.js` file names of that day, and commit them under `docs/pagtesouro-baseline/`. They are public data. That way a later drift alarm can be compared against the verified version.
5. **Alert path.** Run the drift workflow with `servico=999999`, confirm the failure email arrives, then run it normally and confirm healthchecks.io received the ping.
6. **Keypads.** Type amounts on a real iPhone and a real Android phone, each with Portuguese and English language/region settings, and confirm the §6.5 results and the echo.

## 13. Acceptance criteria

- [ ] Visitor can pick a quick amount or type any amount from R$ 0,01 up to the cap.
- [ ] Every row of §6.5 passes in `node --test`.
- [ ] The echo shows the parsed amount in pt-BR format while typing, including after back-navigation.
- [ ] An ambiguous 3-digit amount asks for confirmation.
- [ ] The Referência is 14 digits and generated on click.
- [ ] The URL is exactly `BASE?servico=018235&numeroReferencia=…&valorPrincipal=…` with no name or CPF, built with `URLSearchParams`.
- [ ] Navigation goes only to `https://pagtesouro.tesouro.gov.br`, in the same tab.
- [ ] No backend, no cookies, no storage, no analytics, no third-party requests.
- [ ] The independence disclaimer, the tax line, the privacy line, the destination block and the MDS link are visible.
- [ ] All `_headers` are served, `pages.dev` redirects, and `<noscript>` works.
- [ ] The drift workflow passes, the forced failure emails the owner, and the heartbeat is received.
- [ ] Every item of §12 is done.
- [ ] Basic accessibility checks pass (§5.3), and the page works from 320 px up.

## 14. Later, not now

- **More destinations.** Only funds confirmed by official sources.
- **Shareable `?valor=` link.** It must use a locale-free format such as `?valor=100.00`, never `1.000`, and never include a name.
- **QR code to this site.** Not a Pix QR.
- **Direct Pix creation.** Only with authorised PagTesouro API access and a backend that keeps the token server-side.
