// Zapalnik CRM Lead Clipper - Popup JS
document.addEventListener("DOMContentLoaded", () => {
  const crmUrlInput = document.getElementById("crm-url");
  const configBox = document.getElementById("config-box");
  const btnConfigToggle = document.getElementById("btn-config-toggle");
  
  const leadNameInput = document.getElementById("lead-name");
  const leadBioInput = document.getElementById("lead-bio");
  const leadSourceInput = document.getElementById("lead-source");
  const selectionBanner = document.getElementById("selection-banner");
  
  const btnSubmit = document.getElementById("btn-submit");
  const form = document.getElementById("lead-form");
  
  const statusLoading = document.getElementById("status-loading");
  const statusSuccess = document.getElementById("status-success");
  const statusError = document.getElementById("status-error");
  const successActions = document.getElementById("success-actions");
  const btnClosePopup = document.getElementById("btn-close-popup");
  const leadResultDetails = document.getElementById("lead-result-details");

  // Helper to safely access chrome extension APIs under a web preview
  const chromeApi = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) ? chrome : {
    storage: {
      local: {
        get: (keys, callback) => {
          const result = {};
          keys.forEach(k => {
            result[k] = localStorage.getItem(`ext_${k}`);
          });
          callback(result);
        },
        set: (obj, callback) => {
          Object.keys(obj).forEach(k => {
            localStorage.setItem(`ext_${k}`, obj[k]);
          });
          if (callback) callback();
        }
      }
    },
    tabs: {
      query: (queryInfo, callback) => {
        callback([{
          id: 1,
          url: window.location.href,
          title: window.document.title
        }]);
      },
      sendMessage: (tabId, message, callback) => {
        if (callback) {
          callback({ success: false });
        }
      }
    },
    runtime: {
      lastError: null
    }
  };

  // Default app URL fallback if none is stored
  const DEFAULT_CRM_URL = "https://ais-dev-5a3kcxohnyi3vbu2hf36jp-517254573619.europe-west2.run.app";

  // 1. Load CRM URL from Local Storage
  chromeApi.storage.local.get(["crmUrl"], (result) => {
    if (result.crmUrl) {
      crmUrlInput.value = result.crmUrl;
    } else {
      crmUrlInput.value = DEFAULT_CRM_URL;
      chromeApi.storage.local.set({ crmUrl: DEFAULT_CRM_URL });
    }
  });

  // 2. Save CRM URL dynamically on change
  crmUrlInput.addEventListener("input", () => {
    let url = crmUrlInput.value.trim();
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    chromeApi.storage.local.set({ crmUrl: url });
  });

  // 3. Toggle Configuration Panel
  btnConfigToggle.addEventListener("click", () => {
    if (configBox.style.display === "block") {
      configBox.style.display = "none";
      btnConfigToggle.textContent = "⚙ Konfiguracja";
    } else {
      configBox.style.display = "block";
      btnConfigToggle.textContent = "✖ Zamknij";
    }
  });

  // 4. Request scraping from Content Script on current tab
  chromeApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const activeTab = tabs[0];
      
      // If the current tab is our app itself, auto-save its URL!
      if (activeTab.url && (activeTab.url.includes(".run.app") || activeTab.url.includes("localhost"))) {
        try {
          const parsedUrl = new URL(activeTab.url);
          const savedOrigin = parsedUrl.origin;
          crmUrlInput.value = savedOrigin;
          chromeApi.storage.local.set({ crmUrl: savedOrigin });
        } catch (e) {
          console.error("Failed to parse app URL:", e);
        }
      }

      // Detect Source automatically from active tab address
      if (activeTab.url) {
        if (activeTab.url.includes("linkedin.com")) {
          leadSourceInput.value = "LinkedIn";
        } else {
          leadSourceInput.value = "strony www";
        }
      }

      // Send Scraping request to injected content.js
      chromeApi.tabs.sendMessage(activeTab.id, { action: "extractLead" }, (response) => {
        // Handle runtime error when content script is not injected (e.g. chrome:// urls)
        if (chromeApi.runtime.lastError) {
          console.log("Could not communicate with content script:", chromeApi.runtime.lastError.message);
          // Standard tab fallback
          leadNameInput.value = activeTab.title.split("|")[0].trim();
          leadBioInput.value = `Zalegalizowany ze strony: ${activeTab.url}`;
          return;
        }

        if (response && response.success) {
          if (response.name) {
            leadNameInput.value = response.name;
          }
          
          if (response.selection) {
            // Priority given to selected text
            leadBioInput.value = response.selection;
            selectionBanner.style.display = "block";
          } else if (response.bio) {
            leadBioInput.value = response.bio;
          } else {
            leadBioInput.value = `Lead znaleziony na: ${response.url}`;
          }

          if (response.source) {
            leadSourceInput.value = response.source;
          }
        }
      });
    }
  });

  // 5. Submit Lead to Zapalnik / Closer (CRM) Endpoint
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Hide previous statuses
    statusSuccess.style.display = "none";
    statusError.style.display = "none";
    successActions.style.display = "none";
    
    // Validate target URL
    let targetCrmUrl = crmUrlInput.value.trim();
    if (!targetCrmUrl) {
      showError("Musisz skonfigurować adres CRM w zakładce 'Konfiguracja'.");
      return;
    }
    
    if (targetCrmUrl.endsWith("/")) {
      targetCrmUrl = targetCrmUrl.slice(0, -1);
    }

    const payload = {
      name: leadNameInput.value.trim(),
      bio: leadBioInput.value.trim(),
      source: leadSourceInput.value
    };

    // Show loading
    statusLoading.style.display = "flex";
    btnSubmit.disabled = true;

    fetch(`${targetCrmUrl}/api/inbound-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Serwer zwrócił błąd HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      statusLoading.style.display = "none";
      statusSuccess.style.display = "block";
      successActions.style.display = "grid";
      
      // Render details returned from Gemini (e.g. score and qualification)
      const score = data.score || 0;
      const isHT = data.isHighTicket ? "TAK (High-Ticket)" : "NIE (Low-Quality)";
      leadResultDetails.innerHTML = `
        AI Score: <strong>${score}/100</strong><br>
        Kwalifikacja: <strong>${isHT}</strong><br>
        ID leadu: ${data.id || "N/A"}
      `;
      
      // Play a tiny toast-like alert inside popup
      console.log("Success add lead", data);
    })
    .catch((error) => {
      console.error("Error posting lead:", error);
      statusLoading.style.display = "none";
      statusError.style.display = "block";
      statusError.textContent = `Błąd przesłania: ${error.message}`;
      btnSubmit.disabled = false;
    });
  });

  // 6. Secondary actions
  btnClosePopup.addEventListener("click", () => {
    window.close();
  });

  function showError(msg) {
    statusError.style.display = "block";
    statusError.textContent = msg;
  }
});
