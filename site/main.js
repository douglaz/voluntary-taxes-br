import {
  ERROR_MESSAGES,
  buildPagTesouroUrl,
  createReference,
  formatBRL,
  parseAmount,
  toValorPrincipal,
} from "./contribuicao.js";

const form = document.getElementById("contribuicao");
const field = document.getElementById("valor");
const echo = document.getElementById("eco");
const error = document.getElementById("erro");
const submit = document.getElementById("continuar");
const SUBMIT_LABEL = submit.textContent;

let armed = null; // centavos awaiting the second click of §6.4

function parse() {
  return parseAmount(field.value, navigator.language);
}

function disarm() {
  armed = null;
  submit.textContent = SUBMIT_LABEL;
}

function clearError() {
  error.textContent = "";
  field.removeAttribute("aria-invalid");
}

function updateEcho() {
  const result = parse();
  echo.textContent = result.error ? "" : `Você vai contribuir ${formatBRL(result.centavos)}`;
}

field.addEventListener("input", () => {
  disarm();
  clearError();
  updateEcho();
});

window.addEventListener("pageshow", updateEcho);

for (const button of form.querySelectorAll("button[data-valor]")) {
  button.addEventListener("click", () => {
    field.value = button.dataset.valor;
    disarm();
    clearError();
    updateEcho();
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = parse();
  if (result.error) {
    disarm();
    error.textContent = ERROR_MESSAGES[result.error];
    field.setAttribute("aria-invalid", "true");
    field.focus();
    return;
  }
  clearError();
  if (result.confirm && armed !== result.centavos) {
    armed = result.centavos;
    submit.textContent = `Confirmar ${formatBRL(result.centavos)}`;
    echo.textContent = `Você vai contribuir ${formatBRL(result.centavos)}. Confira o valor antes de continuar.`;
    return;
  }
  window.location.assign(buildPagTesouroUrl(createReference(), toValorPrincipal(result.centavos)));
});
