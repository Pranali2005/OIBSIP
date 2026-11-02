"use strict";

const form = document.getElementById("form");
const input = document.getElementById("value");
const unitSelect = document.getElementById("unit");
const errorBox = document.getElementById("error");
const results = document.getElementById("results");

const SYMBOLS = { C: "°C", F: "°F", K: " K" };
const NAMES = { C: "Celsius", F: "Fahrenheit", K: "Kelvin" };
const ABS_ZERO_LIMIT = { C: -273.15, F: -459.67, K: 0 };

// Accepts values like 12, -5, +3.5, .5, 7. and 1e3 – rejects letters, empty text, etc.
const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

/* ---------- Conversion formulas ---------- */
function toCelsius(value, unit) {
  if (unit === "C") return value;
  if (unit === "F") return (value - 32) * 5 / 9;   // F -> C
  return value - 273.15;                            // K -> C
}

function fromCelsius(c) {
  return {
    C: c,
    F: c * 9 / 5 + 32,   // C -> F
    K: c + 273.15        // C -> K
  };
}

/* ---------- Validation ---------- */
// Returns { ok: true, number } or { ok: false, message }
function validate(rawText, unit) {
  const text = rawText.trim();

  if (text === "") {
    return { ok: false, message: "Please enter a temperature value." };
  }
  if (!NUMBER_PATTERN.test(text)) {
    return { ok: false, message: "Only numbers are allowed (for example 25, -4 or 36.6)." };
  }

  const number = Number(text);
  if (!Number.isFinite(number)) {
    return { ok: false, message: "That number is too large. Please enter a smaller value." };
  }

  // Absolute zero check (small tolerance for floating-point error)
  const celsius = toCelsius(number, unit);
  if (celsius < -273.15 - 1e-9) {
    return {
      ok: false,
      message: "That is below absolute zero, which is impossible. The lowest possible value is " +
        ABS_ZERO_LIMIT[unit] + SYMBOLS[unit].trim() + " (" + NAMES[unit] + ")."
    };
  }

  return { ok: true, number };
}

/* ---------- UI helpers ---------- */
function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  input.classList.add("invalid");
  input.setAttribute("aria-invalid", "true");
  results.hidden = true;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
  input.classList.remove("invalid");
  input.setAttribute("aria-invalid", "false");
}

function format(n) {
  // Round to 2 decimals, avoid "-0"
  const rounded = Math.round(n * 100) / 100;
  return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function showResults(values, sourceUnit) {
  ["C", "F", "K"].forEach(function (u) {
    const box = document.getElementById("out-" + u);
    box.querySelector("strong").textContent = format(values[u]) + SYMBOLS[u];
    box.classList.toggle("source", u === sourceUnit);
  });
  results.hidden = false;
}

/* ---------- Events ---------- */
function convert() {
  const unit = unitSelect.value;
  const check = validate(input.value, unit);
  if (!check.ok) {
    showError(check.message);
    return;
  }
  clearError();
  showResults(fromCelsius(toCelsius(check.number, unit)), unit);
}

form.addEventListener("submit", function (e) {
  e.preventDefault();   // Convert button (or Enter key) triggers the calculation
  convert();
});

// Real-time validation while typing
input.addEventListener("input", function () {
  if (input.value.trim() === "") {
    clearError();
    results.hidden = true;
    return;
  }
  const check = validate(input.value, unitSelect.value);
  if (check.ok) clearError(); else showError(check.message);
});

// Re-check when the unit changes (absolute zero limit depends on the unit)
unitSelect.addEventListener("change", function () {
  if (input.value.trim() !== "") convert();
});
