/* global dcSpeed */
(function () {
  "use strict";
  const auditBtn  = document.getElementById("dc-audit-btn");
  const urlInput  = document.getElementById("dc-site-url");
  const resultWrap = document.getElementById("dc-result-wrap");
  const resultBox  = document.getElementById("dc-result");
  const statusEl   = document.getElementById("dc-result-status");
  const copyBtn    = document.getElementById("dc-copy-btn");
  if (!auditBtn) return;

  auditBtn.addEventListener("click", runAudit);
  urlInput.addEventListener("keydown", (e) => { if (e.key === "Enter") runAudit(); });

  function runAudit() {
    const url = urlInput.value.trim();
    if (!url) { urlInput.focus(); return; }

    auditBtn.disabled = true;
    auditBtn.innerHTML = '<span class="dc-spinner"></span>Analyzing performance…';
    resultWrap.classList.remove("dc-hidden");
    statusEl.textContent = "⏳ Running Core Web Vitals analysis…";
    resultBox.textContent = "";

    const data = new FormData();
    data.append("action",   "dc_speed_audit");
    data.append("nonce",    dcSpeed.nonce);
    data.append("site_url", url);
    data.append("theme",    document.getElementById("dc-theme").value);
    data.append("hosting",  document.getElementById("dc-hosting").value);

    fetch(dcSpeed.ajaxUrl, { method: "POST", body: data })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          statusEl.textContent = "✅ Speed Audit Complete";
          resultBox.textContent = json.data.result;
        } else {
          statusEl.textContent = "❌ Error";
          resultBox.textContent = "Error: " + (json.data?.message || "Unknown error.");
        }
      })
      .catch((err) => { statusEl.textContent = "❌ Network Error"; resultBox.textContent = err.toString(); })
      .finally(() => { auditBtn.disabled = false; auditBtn.innerHTML = "⚡ Generate Speed Audit"; });
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
