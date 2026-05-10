/* global dcMaint */
(function () {
  "use strict";
  const genBtn    = document.getElementById("dc-generate-btn");
  const resultWrap = document.getElementById("dc-result-wrap");
  const resultBox  = document.getElementById("dc-result");
  const statusEl   = document.getElementById("dc-result-status");
  const copyBtn    = document.getElementById("dc-copy-btn");
  if (!genBtn) return;

  genBtn.addEventListener("click", generate);

  function generate() {
    const clientName = document.getElementById("dc-client-name").value.trim();
    const siteName   = document.getElementById("dc-site-name").value.trim();
    if (!clientName || !siteName) {
      if (!clientName) document.getElementById("dc-client-name").focus();
      else document.getElementById("dc-site-name").focus();
      return;
    }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="dc-spinner"></span>Generating report…';
    resultWrap.classList.remove("dc-hidden");
    statusEl.textContent = "⏳ Writing your client report…";
    resultBox.textContent = "";

    const data = new FormData();
    data.append("action",           "dc_maint_generate");
    data.append("nonce",            dcMaint.nonce);
    data.append("client_name",      clientName);
    data.append("site_name",        siteName);
    data.append("month",            document.getElementById("dc-month").value);
    data.append("year",             document.getElementById("dc-year").value);
    data.append("plugins_updated",  document.getElementById("dc-plugins-updated").value);
    data.append("themes_updated",   document.getElementById("dc-themes-updated").value);
    data.append("backups_completed",document.getElementById("dc-backups").value);
    data.append("uptime_percent",   document.getElementById("dc-uptime").value);
    data.append("security_scans",   document.getElementById("dc-security-scans").value);
    data.append("issues_resolved",  document.getElementById("dc-issues").value);

    fetch(dcMaint.ajaxUrl, { method: "POST", body: data })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          statusEl.textContent = "✅ Report Ready — Copy & Send to Client";
          resultBox.textContent = json.data.result;
        } else {
          statusEl.textContent = "❌ Error";
          resultBox.textContent = "Error: " + (json.data?.message || "Unknown error.");
        }
      })
      .catch((err) => { statusEl.textContent = "❌ Network Error"; resultBox.textContent = err.toString(); })
      .finally(() => { genBtn.disabled = false; genBtn.innerHTML = "📊 Generate Client Report"; });
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
