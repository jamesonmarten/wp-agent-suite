/* global dcPlugRec */
(function () {
  "use strict";
  const genBtn   = document.getElementById("dc-generate-btn");
  const bizInput = document.getElementById("dc-business-type");
  const resultWrap = document.getElementById("dc-result-wrap");
  const resultBox  = document.getElementById("dc-result");
  const statusEl   = document.getElementById("dc-result-status");
  const copyBtn    = document.getElementById("dc-copy-btn");
  if (!genBtn) return;

  genBtn.addEventListener("click", generate);

  function generate() {
    const businessType = bizInput.value.trim();
    if (!businessType) { bizInput.focus(); return; }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="dc-spinner"></span>Building your plugin stack…';
    resultWrap.classList.remove("dc-hidden");
    statusEl.textContent = "⏳ Curating your plugin stack…";
    resultBox.textContent = "";

    const data = new FormData();
    data.append("action",        "dc_plugrec_generate");
    data.append("nonce",         dcPlugRec.nonce);
    data.append("business_type", businessType);
    data.append("goals",         document.getElementById("dc-goals").value);
    data.append("budget",        document.getElementById("dc-budget").value);
    data.append("tech_level",    document.getElementById("dc-tech-level").value);

    fetch(dcPlugRec.ajaxUrl, { method: "POST", body: data })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          statusEl.textContent = "✅ Plugin Stack Ready";
          resultBox.textContent = json.data.result;
        } else {
          statusEl.textContent = "❌ Error";
          resultBox.textContent = "Error: " + (json.data?.message || "Unknown error.");
        }
      })
      .catch((err) => { statusEl.textContent = "❌ Network Error"; resultBox.textContent = err.toString(); })
      .finally(() => { genBtn.disabled = false; genBtn.innerHTML = "🔌 Generate Plugin Stack"; });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(resultBox.textContent || "").then(() => {
        copyBtn.textContent = "✓ Copied!"; copyBtn.classList.add("copied");
        setTimeout(() => { copyBtn.textContent = "Copy Report"; copyBtn.classList.remove("copied"); }, 2000);
      });
    });
  }
})();
