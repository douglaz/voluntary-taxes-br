// Pure functions of the Contribuição flow: amount parsing, Referência, PagTesouro URL.
// Amounts are an integer Number of centavos; nothing here goes through binary floating point.

export const SERVICO = "018235";
export const PAGTESOURO_BASE = "https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru";

export const ERROR_MESSAGES = {
  zero: "Informe um valor maior que R$ 0,00.",
  format: "Valor inválido. Exemplos: 50, 10,50 ou 1.000,00.",
  decimals: "Use no máximo duas casas decimais (ex.: 10,50) ou escreva sem pontos (ex.: 1000).",
  cap: "Valor acima do máximo aceito pelo PagTesouro.",
};

const MAX_INTEGER_DIGITS = 13;

function localeDecimalSeparator(locale) {
  let separator;
  try {
    separator = new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal")?.value;
  } catch {
    separator = undefined;
  }
  return separator === "." || separator === "," ? separator : ",";
}

function count(text, char) {
  return text.split(char).length - 1;
}

// Returns { centavos, confirm } or { error } with error in zero | format | decimals | cap.
export function parseAmount(input, locale) {
  const text = String(input ?? "").replace(/r\$/gi, "").replace(/\s/g, "");
  if (text === "") return { error: "zero" };
  if (!/^[0-9][0-9.,]*[0-9]$|^[0-9]$/.test(text)) return { error: "format" };

  const dots = count(text, ".");
  const commas = count(text, ",");
  let integer = text;
  let decimals = "";
  let grouping = null;
  let confirm = false;

  if (dots > 0 && commas > 0) {
    const decimal = text.lastIndexOf(".") > text.lastIndexOf(",") ? "." : ",";
    if (count(text, decimal) !== 1) return { error: "format" };
    grouping = decimal === "." ? "," : ".";
    [integer, decimals] = text.split(decimal);
  } else if (dots + commas > 1) {
    grouping = dots > 0 ? "." : ",";
  } else if (dots + commas === 1) {
    const separator = dots > 0 ? "." : ",";
    const [before, after] = text.split(separator);
    if (after.length <= 2) {
      integer = before;
      decimals = after;
    } else if (after.length === 3) {
      if (localeDecimalSeparator(locale) === separator) return { error: "decimals" };
      grouping = separator;
      confirm = true;
    } else {
      return { error: "decimals" };
    }
  }

  if (grouping !== null) {
    const [first, ...rest] = integer.split(grouping);
    if (!/^[1-9][0-9]{0,2}$/.test(first) || !rest.every((g) => /^[0-9]{3}$/.test(g))) {
      return { error: "format" };
    }
    integer = first + rest.join("");
  }

  if (decimals.length > 2) return { error: "decimals" };
  decimals = decimals.padEnd(2, "0");

  const significant = integer.replace(/^0+/, "");
  if (significant.length > MAX_INTEGER_DIGITS) return { error: "cap" };

  const centavos = Number(significant + decimals);
  if (centavos === 0) return { error: "zero" };
  return { centavos, confirm };
}

// pt-BR display, whatever the locale: grouping dot, decimal comma.
export function formatBRL(centavos) {
  const reais = new Intl.NumberFormat("pt-BR").format(Math.floor(centavos / 100));
  return `R$ ${reais},${String(centavos % 100).padStart(2, "0")}`;
}

// PagTesouro reads valorPrincipal with +value: dot decimal, no grouping.
export function toValorPrincipal(centavos) {
  return `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, "0")}`;
}

// YYYYMMDDHHmmss in the browser's local time.
export function createReference(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export function buildPagTesouroUrl(numeroReferencia, valorPrincipal) {
  if (!/^\d{1,20}$/.test(numeroReferencia)) {
    throw new RangeError(`Referência inválida: ${numeroReferencia}`);
  }
  if (!/^\d{1,13}\.\d{2}$/.test(valorPrincipal) || !/[1-9]/.test(valorPrincipal)) {
    throw new RangeError(`valorPrincipal inválido: ${valorPrincipal}`);
  }
  const params = new URLSearchParams({ servico: SERVICO, numeroReferencia, valorPrincipal });
  return `${PAGTESOURO_BASE}?${params}`;
}
