import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPagTesouroUrl,
  createReference,
  formatBRL,
  parseAmount,
  toValorPrincipal,
} from "./site/contribuicao.js";

const ANY = ["pt-BR", "en-US", "ar-EG"];

function ok(input, locale, centavos, confirm = false) {
  assert.deepEqual(parseAmount(input, locale), { centavos, confirm }, `${input} (${locale})`);
}

function error(input, locale, error) {
  assert.deepEqual(parseAmount(input, locale), { error }, `${input} (${locale})`);
}

// §6.5 rows
test("10 → 1000 (any)", () => ANY.forEach((l) => ok("10", l, 1000)));
test("10,5 / 10,50 → 1050 (any)", () => ANY.forEach((l) => { ok("10,5", l, 1050); ok("10,50", l, 1050); }));
test("10.50 pt-BR → 1050", () => ok("10.50", "pt-BR", 1050));
test("10,50 en-US → 1050", () => ok("10,50", "en-US", 1050));
test("1000 → 100000 (any)", () => ANY.forEach((l) => ok("1000", l, 100000)));
test("1.000 pt-BR → 100000, confirm", () => ok("1.000", "pt-BR", 100000, true));
test("1.000 en-US → error: decimals", () => error("1.000", "en-US", "decimals"));
test("1,000 en-US → 100000, confirm", () => ok("1,000", "en-US", 100000, true));
test("10,999 pt-BR → error: decimals", () => error("10,999", "pt-BR", "decimals"));
test("10,999 en-US → 1099900, confirm", () => ok("10,999", "en-US", 1099900, true));
test("10.500 pt-BR → 1050000, confirm", () => ok("10.500", "pt-BR", 1050000, true));
test("1.000,00 / R$ 1.000,00 / 1 000,50 pt-BR", () => {
  ok("1.000,00", "pt-BR", 100000);
  ok("R$ 1.000,00", "pt-BR", 100000);
  ok("1 000,50", "pt-BR", 100050);
  ok("r$ 1 000,50", "pt-BR", 100050);
});
test("1,000.50 → 100050 (any)", () => ANY.forEach((l) => ok("1,000.50", l, 100050)));
test("1.000.000 / 1,000,000 → 100000000 (any)", () =>
  ANY.forEach((l) => { ok("1.000.000", l, 100000000); ok("1,000,000", l, 100000000); }));
test("1.000.50 / 1.00.000 → error: format (any)", () =>
  ANY.forEach((l) => { error("1.000.50", l, "format"); error("1.00.000", l, "format"); }));
test("0.500 pt-BR → error: format", () => error("0.500", "pt-BR", "format"));
test("0.500 en-US → error: decimals", () => error("0.500", "en-US", "decimals"));
test("10, / .50 / abc / -10 → error: format (any)", () =>
  ANY.forEach((l) => ["10,", ".50", "abc", "-10"].forEach((i) => error(i, l, "format"))));
test("0 / 0,00 → error: zero (any)", () => ANY.forEach((l) => { error("0", l, "zero"); error("0,00", l, "zero"); }));
test("empty → error: zero (any)", () => ANY.forEach((l) => { error("", l, "zero"); error("  ", l, "zero"); }));
test("0,50 → 50 (any)", () => ANY.forEach((l) => ok("0,50", l, 50)));
test("10.5000 → error: decimals (any)", () => ANY.forEach((l) => error("10.5000", l, "decimals")));
test("12345678901234 → error: cap (any)", () => ANY.forEach((l) => error("12345678901234", l, "cap")));
test("1.000 ar-EG → 100000, confirm", () => ok("1.000", "ar-EG", 100000, true));

// Edges around §6.1
test("cap boundary: 13 integer digits pass, leading zeros ignored", () => {
  ok("9999999999999,99", "pt-BR", 999999999999999);
  ok("0001234567890123", "pt-BR", 123456789012300);
  ok("9.999.999.999.999,99", "pt-BR", 999999999999999);
  error("10.000.000.000.000,00", "pt-BR", "cap");
});
test("1.000,500 → error: decimals (both separators, 3-digit decimal part)", () =>
  ANY.forEach((l) => error("1.000,500", l, "decimals")));
test("grouping with both separators must still be well-formed", () => {
  error("1.00,50", "pt-BR", "format");
  error("1,000.50.5", "pt-BR", "format");
});

// §7
test("createReference: local time, 14 digits, zero-padded", () => {
  const reference = createReference(new Date(2026, 0, 5, 7, 8, 9));
  assert.equal(reference, "20260105070809");
  assert.match(reference, /^\d{14}$/);
  assert.equal(createReference(new Date(2026, 10, 25, 23, 59, 1)), "20261125235901");
  assert.match(createReference(), /^\d{14}$/);
});

// §8
test("buildPagTesouroUrl: exact URL, only the three keys", () => {
  const url = buildPagTesouroUrl("20261007120000", "100.00");
  assert.equal(
    url,
    "https://pagtesouro.tesouro.gov.br/portal-gru/#/pagamento-gru?servico=018235&numeroReferencia=20261007120000&valorPrincipal=100.00",
  );
  assert.doesNotMatch(url, /nomeContribuinte|cpfCnpjContribuinte/);
  assert.ok(url.startsWith("https://pagtesouro.tesouro.gov.br/"));
});
test("buildPagTesouroUrl rejects a non-digit reference", () => {
  assert.throws(() => buildPagTesouroUrl("ABC-123", "100.00"), /Referência/);
  assert.throws(() => buildPagTesouroUrl("", "100.00"), /Referência/);
});
test("buildPagTesouroUrl rejects a 21-digit reference and accepts 20", () => {
  assert.throws(() => buildPagTesouroUrl("1".repeat(21), "100.00"), /Referência/);
  assert.match(buildPagTesouroUrl("1".repeat(20), "100.00"), /numeroReferencia=1{20}&/);
});
test("buildPagTesouroUrl rejects a malformed amount", () => {
  for (const amount of ["100,00", "100", "1,000.00", "1000.0", "1000.000", "12345678901234.00"]) {
    assert.throws(() => buildPagTesouroUrl("20261007120000", amount), /valorPrincipal/, amount);
  }
});
test("buildPagTesouroUrl rejects a zero amount", () => {
  assert.throws(() => buildPagTesouroUrl("20261007120000", "0.00"), /valorPrincipal/);
  assert.match(buildPagTesouroUrl("20261007120000", "0.01"), /valorPrincipal=0\.01$/);
});

// §6.3
test("toValorPrincipal: dot decimal, no grouping, padded centavos", () => {
  assert.equal(toValorPrincipal(100000), "1000.00");
  assert.equal(toValorPrincipal(50), "0.50");
  assert.equal(toValorPrincipal(1), "0.01");
  assert.equal(toValorPrincipal(999999999999999), "9999999999999.99");
});
test("formatBRL: pt-BR grouping dot and decimal comma", () => {
  assert.equal(formatBRL(100000), "R$ 1.000,00");
  assert.equal(formatBRL(50), "R$ 0,50");
  assert.equal(formatBRL(1050000), "R$ 10.500,00");
  assert.equal(formatBRL(7), "R$ 0,07");
});
