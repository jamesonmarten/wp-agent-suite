/* global dcCtb */
(function () {
  "use strict";
  const genBtn    = document.getElementById("dc-generate-btn");
  const reqInput  = document.getElementById("dc-request");
  const resultWrap = document.getElementById("dc-result-wrap");
  const resultBox  = document.getElementById("dc-result");
  const statusEl   = document.getElementById("dc-result-status");
  const copyBtn    = document.getElementById("dc-copy-btn");
  if (!genBtn) return;

  genBtn.addEventListener("click", generate);

  function generate() {
    const request = reqInput.value.trim();
    if (!request) { reqInput.focus(); return; }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="dc-spinner"></span>Writing your code…';
    resultWrap.classList.remove("dc-hidden");
    statusEl.textContent = "⏳ Writing production-ready code…";
    resultBox.textContent = "";

    const data = new FormData();
    data.append("action",        "dc_ctb_generate");
    data.append("nonce",         dcCtb.nonce);
    data.append("request",       request);
    data.append("theme",         document.getElementById("dc-theme").value);
    data.append("theme_version", document.getElementById("dc-theme-version").value);
    data.append("context",       document.getElementById("dc-context").value);

    fetch(dcCtb.ajaxUrl, { method: "POST", body: data })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          statusEl.textContent = "✅ Code Ready — Copy & Implement";
          resultBox.textContent = json.data.result;
        } else {
          statusEl.textContent = "❌ Error";
          resultBox.textContent = "Error: " + (json.data?.message || "Unknown error.");
        }
      })
      .catch((err) => { statusEl.textContent = "❌ Network Error"; resultBox.textContent = err.toString(); })
      .finally(() => { genBtn.disabled = false; genBtn.innerHTML = "🎨 Generate CSS & Child Theme Code"; });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(resultBox.textContent || "").then(() => {
        copyBtn.textContent = "✓ Copied!"; copyBtn.classList.add("copied");
        setTimeout(() => { copyBtn.textContent = "Copy Code"; copyBtn.classList.remove("copied"); }, 2000);
      });
    });
  }
})();
