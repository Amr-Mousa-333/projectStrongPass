// ====== Helpers ======
const hasUpper = s => /[A-Z]/.test(s);
const hasLower = s => /[a-z]/.test(s);
const hasDigit = s => /[0-9]/.test(s);
const hasSymbol = s => /[^A-Za-z0-9]/.test(s);

function scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (hasUpper(pw)) score++;
  if (hasLower(pw)) score++;
  if (hasDigit(pw)) score++;
  if (hasSymbol(pw)) score++;
  return score; // 0..5
}

function ratingFromScore(score) {
  if (score === 5) return { label: "قوية 💪", width: 100, cls: "bg-success" };
  if (score >= 3) return { label: "متوسطة ⚡", width: 60, cls: "bg-warning" };
  return { label: "ضعيفة ❌", width: 20, cls: "bg-danger" };
}

function updateCriteria(pw) {
  const setIcon = (ok, el) => {
    el.classList.toggle("bi-check-circle", ok);
    el.classList.toggle("bi-x-circle", !ok);
    el.classList.toggle("text-success", ok);
    el.classList.toggle("text-danger", !ok);
  };
  setIcon(pw.length >= 8, document.getElementById("crit-len"));
  setIcon(hasUpper(pw), document.getElementById("crit-upper"));
  setIcon(hasLower(pw), document.getElementById("crit-lower"));
  setIcon(hasDigit(pw), document.getElementById("crit-digit"));
  setIcon(hasSymbol(pw), document.getElementById("crit-symbol"));
}

// ====== Checker wiring ======
const pwInput = document.getElementById("pw");
const meter = document.getElementById("meter");
const rating = document.getElementById("rating");

function refreshChecker() {
  const pw = pwInput.value || "";
  const s = scorePassword(pw);
  const r = ratingFromScore(s);
  meter.style.width = r.width + "%";
  meter.classList.remove("bg-danger", "bg-warning", "bg-success");
  meter.classList.add(r.cls);
  rating.textContent = "القوة: " + r.label;
  updateCriteria(pw);
}

pwInput.addEventListener("input", refreshChecker);
refreshChecker();

document.getElementById("toggleVis").addEventListener("click", () => {
  const type = pwInput.getAttribute("type") === "password" ? "text" : "password";
  pwInput.setAttribute("type", type);
});

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast("تم النسخ ✓");
  } catch {
    showToast("تعذّر النسخ");
  }
}

document.getElementById("copyPw").addEventListener("click", () => copyText(pwInput.value));

// ====== Generator ======
const rng = window.crypto || window.msCrypto;

function generatePassword(opts) {
  let lower = "abcdefghijklmnopqrstuvwxyz";
  let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let digits = "0123456789";
  let symbols = "!@#$%^&*()-_=+[]{};:,.<>?/|~`";
  const ambiguous = /[O0Il1|]/g;

  let pool = "";
  if (opts.lower) pool += lower;
  if (opts.upper) pool += upper;
  if (opts.digits) pool += digits;
  if (opts.symbols) pool += symbols;

  if (opts.noAmbiguous) {
    lower = lower.replace(ambiguous, "");
    upper = upper.replace(ambiguous, "");
    digits = digits.replace(ambiguous, "");
    symbols = symbols.replace(ambiguous, "");
    pool = pool.replace(ambiguous, "");
  }

  if (pool.length === 0) return "";

  const must = [];
  if (opts.lower) must.push(pick(lower));
  if (opts.upper) must.push(pick(upper));
  if (opts.digits) must.push(pick(digits));
  if (opts.symbols) must.push(pick(symbols));

  const remaining = opts.length - must.length;
  const rest = Array.from({ length: Math.max(0, remaining) }, () => pick(pool));

  const all = must.concat(rest);
  for (let i = all.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join("");
}

function pick(str) { return str[randInt(str.length)]; }
function randInt(max) {
  const arr = new Uint32Array(1);
  rng.getRandomValues(arr);
  return Math.floor(arr[0] / (0xFFFFFFFF + 1) * max);
}

const lenRange = document.getElementById("length");
const lenLabel = document.getElementById("lenLabel");
const genOut = document.getElementById("genOut");
const genStrength = document.getElementById("genStrength");

const optRefs = {
  lower: document.getElementById("incLower"),
  upper: document.getElementById("incUpper"),
  digits: document.getElementById("incDigits"),
  symbols: document.getElementById("incSymbols"),
  noAmbiguous: document.getElementById("noAmbiguous")
};

lenRange.addEventListener("input", () => lenLabel.textContent = lenRange.value);
document.getElementById("genBtn").addEventListener("click", () => {
  const opts = {
    length: +lenRange.value,
    lower: optRefs.lower.checked,
    upper: optRefs.upper.checked,
    digits: optRefs.digits.checked,
    symbols: optRefs.symbols.checked,
    noAmbiguous: optRefs.noAmbiguous.checked
  };
  const pw = generatePassword(opts);
  genOut.value = pw;
  const s = scorePassword(pw);
  genStrength.textContent = "القوة: " + ratingFromScore(s).label;
});

document.getElementById("copyGen").addEventListener("click", () => copyText(genOut.value));

// ====== Lightweight toast ======
function showToast(text) {
  const el = document.createElement("div");
  el.className = "position-fixed bottom-0 start-50 translate-middle-x mb-4 px-3 py-2 bg-dark text-white rounded-3 shadow";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
