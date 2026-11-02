#!/usr/bin/env bash
# Drift check (spec §11): does PagTesouro still describe service 018235 as we quote it,
# and does its code still read our URL parameters? Usage: scripts/drift.sh [servico]
set -euo pipefail

SERVICO=${1:-018235}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

echo "drift: check 1, service record $SERVICO"
curl -fsS --retry 3 --retry-all-errors -m 30 \
  https://pagtesouro.tesouro.gov.br/api/gru/portal/servicos/$SERVICO > s.json
jq -e '.codigoServico == "018235"
  and .nomeServico == "DOAÇÕES AO FUNDO DE COMBATE E ERRADIC. DA POBREZA"
  and .codigoOrgao == "55000"
  and .tituloOrgao == "MIN.DESENV.E ASSIT.SOCIAL,FAM.E COMBATE FOME"
  and .codigoUg == "550008"
  and .tituloUg == "SECRETARIA NAC. DE SEGUR. ALIMENTAR E NUTRIC."
  and .cpfCnpjContribuinteObrigatorio == false' s.json > /dev/null
echo "drift: check 1 ok"

echo "drift: check 2, PagTesouro code still reads servico, numeroReferencia and valorPrincipal"
B=https://pagtesouro.tesouro.gov.br/portal-gru
M=$(curl -fsS $B/ | grep -oE 'main-[A-Z0-9]+\.js' | head -1)
C=$(curl -fsS $B/$M | grep -oE 'path:"pagamento-gru",loadChildren:\(\)=>import\("\./chunk-[A-Z0-9]+\.js' | grep -oE 'chunk-[A-Z0-9]+\.js')
curl -fsS $B/$C > c.js
grep -qF '"/pagamento-gru/formulario"],{replaceUrl:!0,queryParamsHandling:"preserve"}' c.js
grep -qE 'queryParams\.subscribe\(([A-Za-z_$][A-Za-z0-9_$]*)=>\{let [A-Za-z_$][A-Za-z0-9_$]*=\1\.servico' c.js
for p in numeroReferencia valorPrincipal; do
  grep -qE "${p}Url=[A-Za-z_\$][A-Za-z0-9_\$]*\.$p\b" c.js
done
echo "drift: check 2 ok ($M -> $C)"
