# Voluntary Contribution to Brazil — Website Specification

## 1. Overview

Build a small, privacy-preserving website that makes it easy for a person to voluntarily contribute money to the Brazilian Federal Government through the official **Fundo de Combate e Erradicação da Pobreza**.

The website does **not** receive money, generate its own Pix charge, act as a payment intermediary, or claim to be affiliated with the Brazilian government.

Instead, it:

1. asks the user for their name and contribution amount
2. generates a unique numeric payment reference
3. constructs an official PagTesouro URL with the payment information pre-filled
4. redirects the user to `pagtesouro.tesouro.gov.br`
5. lets PagTesouro handle Pix, credit card, or GRU boleto

PagTesouro officially supports URL parameters including `servico`, `nomeContribuinte`, `numeroReferencia`, and `valorPrincipal`, specifically to allow external sites to send users to a pre-filled payment form.

The MDS currently identifies the destination as:

- Órgão Arrecadador: `55000`
- Unidade Gestora Arrecadadora: `550008`
- Serviço: `018235`
- Description: `Doações ao Fundo de Combate e Erradicação da Pobreza`

The MDS states that the user then supplies a name, freely chosen reference number and value, and may pay using Pix, credit card or GRU boleto.

---

# 2. Goals

The primary goal is to turn the existing multi-step government flow into essentially:

```text
Enter amount
      ↓
Enter name
      ↓
Continue
      ↓
Official PagTesouro form, already filled
      ↓
Pix / card / boleto
```

The application should optimize for:

- simplicity
- trust
- transparency
- privacy
- accessibility
- very small attack surface
- minimal maintenance

A first-time visitor should understand what the service does within a few seconds.

---

# 3. Non-goals

The MVP MUST NOT:

- receive or custody funds
- generate its own Pix key
- generate an arbitrary Pix QR code
- proxy the payment
- request banking credentials
- store payment details
- require an account
- require CPF/CNPJ
- claim that the contribution satisfies a tax obligation
- describe the payment as a legally owed tax
- impersonate a Brazilian government website
- claim government endorsement
- attempt to determine whether payment succeeded
- use the authenticated PagTesouro API

The contribution is a **voluntary donation to a federal fund**, not an additional tax assessment.

---

# 4. Terminology

User-facing copy should generally use:

**"contribuição voluntária"**

or:

**"doação voluntária"**

instead of claiming that the user is literally paying additional tax.

A playful project/domain name involving "imposto" is acceptable, but the payment page must explain the legal distinction.

Example:

> Quer pagar mais para o governo?  
> Faça uma contribuição voluntária ao Fundo de Combate e Erradicação da Pobreza.

---

# 5. Primary User Flow

## 5.1 Landing page

Display:

```text
Faça uma contribuição voluntária ao Brasil

Envie dinheiro diretamente ao Fundo de Combate
e Erradicação da Pobreza através do PagTesouro.

[ R$ 50 ] [ R$ 100 ] [ R$ 500 ] [ Outro valor ]

Valor
R$ [____________]

Nome
[_______________________________]

[ Continuar no PagTesouro ]

Você será enviado ao site oficial do Tesouro Nacional.
Este site não recebe nem processa seu dinheiro.
```

Suggested quick amounts:

- R$ 10
- R$ 50
- R$ 100
- R$ 500

Quick amounts are conveniences only.

The user must always be able to enter an arbitrary positive amount.

---

# 6. Form fields

## 6.1 Name

Field:

```text
Nome
```

Requirements:

- required
- trim leading/trailing whitespace
- Unicode allowed
- do not require CPF
- do not persist the value
- do not include it in analytics

Example:

```text
Maria da Silva
```

PagTesouro parameter:

```text
nomeContribuinte
```

---

## 6.2 Amount

Field:

```text
Valor
```

Requirements:

- required
- greater than zero
- maximum two decimal places
- support Brazilian input conventions
- display formatted as BRL
- convert internally to decimal notation required by PagTesouro

Examples:

```text
10
10,50
1.000,00
```

must become:

```text
10.00
10.50
1000.00
```

for `valorPrincipal`.

PagTesouro specifies that monetary URL parameters use `.` as the decimal separator and no thousands separator.

Avoid binary floating-point calculations for monetary parsing where possible.

Represent the amount internally as integer centavos.

Example:

```text
R$ 123,45
```

becomes:

```text
12345 centavos
```

and later:

```text
123.45
```

---

# 7. Reference number

PagTesouro/MDS requires a numeric payment reference and states that it may be freely chosen by the contributor.

The application should generate it automatically.

Recommended format:

```text
YYYYMMDDHHmmss
```

Example:

```text
20261006182742
```

Properties:

- numeric only
- 14 digits
- generated immediately before redirect
- sufficiently unique for normal website usage
- user does not need to see or modify it

A collision does not create a security issue, but accidental collisions should be avoided.

Implementation:

```ts
function createReference(date = new Date()): string {
  const p = (v: number) => String(v).padStart(2, "0")

  return [
    date.getFullYear(),
    p(date.getMonth() + 1),
    p(date.getDate()),
    p(date.getHours()),
    p(date.getMinutes()),
    p(date.getSeconds()),
  ].join("")
}
```

---

# 8. PagTesouro integration

## 8.1 Base URL

Use the officially documented Portal GRU endpoint:

```text
https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru
```

The PagTesouro documentation explicitly supports parameterizing this URL to pre-fill the payment form.

---

## 8.2 Service

The service parameter MUST be:

```text
servico=018235
```

This corresponds to:

```text
Doações ao Fundo de Combate e Erradicação da Pobreza
```

The associated government identifiers are:

```text
Órgão: 55000
UG:    550008
```

The MDS currently publishes these identifiers for donations to the fund.

Because PagTesouro automatically derives the collecting agency and management unit from the service identifier, the MVP only needs to send `servico`.

---

# 9. Generated URL

The site should generate:

```text
https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru
    ?servico=018235
    &nomeContribuinte=<NAME>
    &numeroReferencia=<REFERENCE>
    &valorPrincipal=<AMOUNT>
```

Example:

```text
https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru?servico=018235&nomeContribuinte=Maria+da+Silva&numeroReferencia=20261006182742&valorPrincipal=100.00
```

Use `URLSearchParams`.

Example:

```ts
const params = new URLSearchParams({
  servico: "018235",
  nomeContribuinte: name,
  numeroReferencia: reference,
  valorPrincipal: amount,
})

const url =
  "https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru?" +
  params.toString()
```

Never concatenate user-provided strings directly into the URL without encoding.

---

# 10. Redirect

After successful local validation:

```ts
window.location.assign(url)
```

Opening in the same tab is preferred.

The destination must remain visibly on:

```text
pagtesouro.tesouro.gov.br
```

The application must never embed PagTesouro in an iframe.

---

# 11. Confirmation screen

Before redirecting, the site MAY show a lightweight confirmation:

```text
Sua contribuição

Valor
R$ 100,00

Destino
Fundo de Combate e Erradicação da Pobreza

O pagamento será concluído no site oficial
pagtesouro.tesouro.gov.br.

[ Continuar ]
```

For the smallest possible MVP this screen can be omitted.

---

# 12. Payment

The website itself does not select or execute Pix.

After redirection, PagTesouro presents the payment mechanisms available for the service.

According to the MDS, these currently include:

- Pix
- credit card
- GRU boleto


Therefore, the primary button should preferably say:

```text
Continuar no PagTesouro
```

rather than:

```text
Pagar com Pix
```

The latter incorrectly implies that this site itself has already created a Pix payment.

---

# 13. Trust and transparency

Trust is particularly important because the site is asking users to initiate a financial transaction.

Immediately below the primary button show:

```text
O pagamento acontece diretamente no PagTesouro,
no domínio oficial pagtesouro.tesouro.gov.br.

Nós não recebemos, intermediamos ou armazenamos seu dinheiro.
```

Also show the destination:

```text
Destino oficial

Fundo de Combate e Erradicação da Pobreza
Ministério do Desenvolvimento e Assistência Social

Órgão: 55000
UG: 550008
Serviço: 018235
```

Include a link to the official MDS donation instructions.

---

# 14. Independent-site disclaimer

Footer:

```text
Este é um site independente e não possui vínculo,
afiliação ou endosso do Governo Federal.

O pagamento é realizado diretamente através do
PagTesouro, serviço oficial da Secretaria do Tesouro Nacional.
```

Do not use:

- GOV.BR logos
- official seals in ways suggesting affiliation
- Brazilian government design identity in a deceptive way
- "site oficial"
- `gov.br`-like branding

The Brazilian flag/colors can be used decoratively as long as affiliation is not implied.

---

# 15. Privacy

The MVP SHOULD collect no persistent personal information.

Specifically:

- no database
- no login
- no cookies
- no localStorage
- no sessionStorage
- no fingerprinting
- no advertising
- no payment data
- no server-side form submission

The name exists only in browser memory until redirect.

The value exists only in browser memory until redirect.

They are then intentionally included in the PagTesouro URL.

---

# 16. Analytics

Recommended MVP:

```text
No analytics.
```

If analytics are introduced later, they MUST NOT capture:

- contributor name
- amount
- generated reference
- target PagTesouro URL
- URL query/fragment containing personal information

Aggregate page-view metrics are acceptable.

---

# 17. Architecture

Recommended architecture:

```text
Browser
   |
   | static HTTPS
   v
Website
   |
   | constructs URL locally
   |
   +-----------------------> PagTesouro
                               |
                               +--> Pix
                               +--> Credit Card
                               +--> GRU
```

No application server is necessary.

---

# 18. Recommended technology

MVP:

```text
TypeScript
Vite
HTML
CSS
```

No frontend framework is necessary.

Alternatively:

```text
plain HTML + CSS + JavaScript
```

is completely sufficient.

Avoid introducing React/Next.js/etc. unless other functionality justifies it.

---

# 19. Suggested project structure

```text
/
├── index.html
├── src/
│   ├── main.ts
│   ├── pagtesouro.ts
│   ├── money.ts
│   └── styles.css
├── tests/
│   ├── money.test.ts
│   └── pagtesouro.test.ts
├── public/
│   ├── favicon.svg
│   └── social-card.png
├── package.json
├── README.md
└── LICENSE
```

---

# 20. Core domain function

Payment-link generation should be isolated from UI code.

Example:

```ts
export interface Contribution {
  name: string
  amountCentavos: number
  reference: string
}

const PAGTESOURO_URL =
  "https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru"

const SERVICE = "018235"

export function buildPagTesouroUrl(
  contribution: Contribution
): string {
  const amount =
    (contribution.amountCentavos / 100).toFixed(2)

  const params = new URLSearchParams({
    servico: SERVICE,
    nomeContribuinte: contribution.name.trim(),
    numeroReferencia: contribution.reference,
    valorPrincipal: amount,
  })

  return `${PAGTESOURO_URL}?${params.toString()}`
}
```

---

# 21. Money parsing

Do not use naive transformations such as:

```ts
parseFloat(input.replace(",", "."))
```

for arbitrary Brazilian-formatted values.

A dedicated parser should normalize input safely.

Accepted examples:

```text
10
10,5
10,50
1000
1.000
1.000,00
R$ 1.000,00
```

Normalized:

```text
1000.00
```

Store:

```text
100000
```

centavos.

Reject:

```text
0
-10
abc
10,999
```

---

# 22. Validation errors

Errors should be inline and specific.

Examples:

```text
Informe seu nome.
```

```text
Informe um valor maior que R$ 0,00.
```

```text
Use no máximo duas casas decimais.
```

Do not erase valid form fields after an error.

Focus the first invalid input.

---

# 23. Accessibility

Target WCAG 2.2 AA.

Minimum requirements:

- semantic `<form>`
- explicit `<label>`
- keyboard navigation
- visible focus indicators
- sufficient contrast
- errors connected with `aria-describedby`
- buttons at least ~44 px high on mobile
- no information conveyed through color alone
- correct `lang="pt-BR"`

---

# 24. Responsive design

The primary experience is mobile-first because many users will complete Pix payments from a phone.

Target:

```text
320px → desktop
```

The form should remain usable at all widths.

Preferred content width:

```text
480–640px
```

The main CTA should occupy the full available width on small screens.

---

# 25. Visual design

Style:

- extremely clean
- trustworthy
- minimal
- friendly
- no "fintech" visual clutter
- no fake banking UI

Suggested page hierarchy:

```text
        small logo/name

Faça uma contribuição
voluntária ao Brasil

Short explanation

[ R$10 ] [ R$50 ] [ R$100 ] [ R$500 ]

Valor
[ R$ 100,00 ]

Nome
[ Maria da Silva ]

[ Continuar no PagTesouro ]

🔒 Pagamento realizado no domínio oficial
   pagtesouro.tesouro.gov.br

--------------------------------------------

Para onde vai o dinheiro?
Fundo de Combate e Erradicação da Pobreza

[ Saiba mais no gov.br ]

--------------------------------------------

Independent-site disclaimer
Source code
Privacy
```

---

# 26. Security

Even though the site has no backend, apply normal web-security practices.

## Required

- HTTPS only
- encode all dynamic URL values
- no `innerHTML` with user input
- dependency lockfile
- automated dependency scanning
- Content Security Policy
- `Referrer-Policy`
- no third-party scripts
- no third-party fonts

Suggested headers:

```text
Content-Security-Policy:
  default-src 'self';
  img-src 'self' data:;
  style-src 'self';
  script-src 'self';
  connect-src 'none';
  frame-src 'none';
  object-src 'none';
  base-uri 'none';
  form-action 'none';

Referrer-Policy: no-referrer

X-Content-Type-Options: nosniff

Permissions-Policy:
  camera=(),
  microphone=(),
  geolocation=()
```

`connect-src 'none'` is viable because the site itself requires no API requests.

Navigation to PagTesouro is still possible.

---

# 27. No backend

The MVP MUST NOT introduce a backend merely to create the redirect URL.

All required data is available client-side.

Advantages:

- no server-side personal data
- no secrets
- no API keys
- nearly zero infrastructure
- cheap/free hosting
- easy auditing
- easy open-source deployment

---

# 28. Hosting

Suitable platforms include:

- Cloudflare Pages
- GitHub Pages
- Netlify
- any static web server

Requirements:

- custom domain
- TLS
- HSTS
- immutable caching for versioned assets
- short/no caching for `index.html`

---

# 29. Government API integration

The PagTesouro authenticated API is explicitly **out of scope for MVP**.

The official API exists for collecting government agencies and requires authorization associated with the government management unit. The PagTesouro documentation also warns that its bearer token belongs on the backend and must not be exposed to the citizen's browser.

Therefore:

```text
DO NOT place a PagTesouro token in frontend JavaScript.
```

and:

```text
DO NOT attempt to call authenticated PagTesouro APIs
from the static application.
```

---

# 30. Payment confirmation

The application cannot reliably know whether the user completed payment.

Therefore it MUST NOT display:

```text
Pagamento realizado com sucesso
```

merely because the user left the site.

For MVP:

```text
Website → PagTesouro
```

is a one-way handoff.

Payment confirmation would require a different integration architecture and authorization.

---

# 31. Testing

## Unit tests

Test:

### Money parsing

```text
"10"          -> 1000
"10,50"       -> 1050
"1.000,00"    -> 100000
"R$ 12,34"    -> 1234
```

### URL generation

Given:

```text
name = "Maria da Silva"
amount = 10000
reference = "20261006182742"
```

result MUST contain:

```text
servico=018235
nomeContribuinte=Maria+da+Silva
numeroReferencia=20261006182742
valorPrincipal=100.00
```

---

# 32. Integration test

Before production deployment, manually verify that:

1. open the generated link
2. browser goes to `pagtesouro.tesouro.gov.br`
3. service is recognized as `018235`
4. destination corresponds to the poverty-eradication fund
5. name is pre-filled
6. reference is pre-filled
7. value is pre-filled
8. clicking `Iniciar Pagamento` exposes Pix
9. no additional data unexpectedly needs to be supplied

No automated integration test should execute an actual payment.

---

# 33. Acceptance criteria

MVP is complete when:

- [ ] visitor can enter a name
- [ ] visitor can enter a BRL amount
- [ ] common Brazilian money formats are accepted
- [ ] amount is represented without floating-point errors
- [ ] reference number is generated automatically
- [ ] service is always `018235`
- [ ] correct PagTesouro URL is constructed
- [ ] all parameters are URL encoded
- [ ] user is redirected exclusively to `https://pagtesouro.tesouro.gov.br`
- [ ] PagTesouro displays the expected pre-filled information
- [ ] Pix is available through PagTesouro
- [ ] website never receives payment
- [ ] no backend exists
- [ ] no personal information is persisted
- [ ] no cookies are created
- [ ] no analytics receive form values
- [ ] independent-site disclaimer is visible
- [ ] official destination is clearly disclosed
- [ ] mobile UX works correctly
- [ ] basic accessibility checks pass

---

# 34. Suggested copy

## Hero

**Faça uma contribuição voluntária ao Brasil**

Quer contribuir além dos impostos que você já paga?

Envie qualquer valor diretamente ao Fundo de Combate e Erradicação da Pobreza através do PagTesouro.

---

## CTA

**Continuar no PagTesouro**

---

## Trust message

Você será enviado para `pagtesouro.tesouro.gov.br`, o sistema oficial do Tesouro Nacional.

Este site não recebe nem processa seu dinheiro.

---

## Explanation

### Para onde vai a contribuição?

O pagamento é destinado ao **Fundo de Combate e Erradicação da Pobreza**, usando o serviço oficial `018235` do PagTesouro.

---

## Disclaimer

Este site é uma iniciativa independente e não possui vínculo ou endosso do Governo Federal.

A contribuição é voluntária e não substitui nem reduz qualquer obrigação tributária.

---

# 35. Possible project names

Neutral:

```text
Contribua Brasil
Contribuição Voluntária
Doe ao Brasil
```

More playful:

```text
Pague Mais
Mais Imposto
Imposto Voluntário
Quero Pagar Mais
```

If a playful tax-related name is used, the page itself must continue to describe the transaction accurately as a voluntary contribution/donation rather than a tax liability.

---

# 36. Future extensions

## 36.1 Multiple destinations

Represent destinations as configuration:

```ts
interface Destination {
  id: string
  name: string
  agency: string
  ug: string
  service: string
  description: string
}
```

Possible future UI:

```text
Para onde você quer contribuir?

○ Combate à pobreza
○ Educação
○ Saúde
○ Meio ambiente
...
```

Only destinations confirmed through official government sources should be listed.

---

## 36.2 Shareable contribution link

Allow:

```text
example.org/?valor=100
```

which initializes the form to:

```text
R$ 100,00
```

Do **not** include the contributor's name in shareable URLs.

---

## 36.3 QR code for this website

A QR code MAY point to:

```text
https://example.org/?valor=100
```

This is different from generating a Pix QR code.

---

## 36.4 Direct Pix generation

A future version could investigate formal cooperation with the relevant government entity to obtain authorized PagTesouro API access.

Only after that should direct Pix creation be considered.

That architecture would require:

```text
Browser
   ↓
Application backend
   ↓
Authenticated PagTesouro API
   ↓
Payment
```

Any PagTesouro bearer token MUST remain server-side.

---

# 37. MVP guiding principle

The entire application should remain conceptually equivalent to:

```ts
const payment = {
  destination: "018235",
  name,
  amount,
  reference: createReference(),
}

redirect(buildPagTesouroUrl(payment))
```

Everything else exists to make that operation understandable, safe, accessible and trustworthy.

The ideal MVP is small enough that a technically competent person can audit essentially the entire application in a few minutes.
