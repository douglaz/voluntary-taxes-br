# Quero Pagar Mais

An independent website that helps a person send money, of their own free will, to the Brazilian federal Fundo de Combate e Erradicação da Pobreza, using the government's own payment portal.

## Language

**Contribuição**:
Money a **Contribuinte** chooses to send to the **Fundo**, with no legal obligation behind it.
_Avoid_: Doação (except where legal precision is needed), imposto, tributo, pagamento (for what happens on this site)

**Contribuinte**:
The person making a **Contribuição**.
_Avoid_: Doador, pagador, usuário (in copy)

**Fundo**:
The Fundo de Combate e Erradicação da Pobreza, the single destination of every **Contribuição**.
_Avoid_: Governo, Tesouro (as the destination)

**Referência**:
A number the **Contribuinte** may choose freely that labels one **Contribuição**. It is not a unique identifier: two **Contribuições** may share one.
_Avoid_: Protocolo, ID da transação, código

**PagTesouro**:
The Tesouro Nacional's official payment portal, where the **Contribuinte** actually pays. This site never handles the money.

## Flagged ambiguities

- **"Contribuição"/"Contribuinte" in tax law**: in Brazilian tax law a *contribuição* is a kind of tributo, and a *contribuinte* is a taxpayer. In this project a **Contribuição** is never a tributo. The official service name uses "Doações", so "doação" is the legally precise synonym.
- **"Pagar" in the brand name**: "Quero Pagar Mais" is deliberate wordplay. Outside the brand, the act on this site is a **Contribuição**, never a "pagamento"; the paying itself happens on **PagTesouro**.

## Example dialogue

> **Dev:** When the Contribuinte clicks the button, have they paid?
> **Domain expert:** No. They've started a Contribuição. The paying happens on PagTesouro, and we never learn whether it went through.
> **Dev:** And the Referência — is it unique per Contribuição?
> **Domain expert:** No. It's freely chosen, so two Contribuições can share one. Never treat it as a transaction ID.
> **Dev:** So can I write "Obrigado pelo seu imposto" on the page?
> **Domain expert:** Never. A Contribuição isn't a tributo, even though the brand jokes about paying more.
