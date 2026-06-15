// Zapalnik CRM Lead Clipper - Content Script
console.log("[Zapalnik] Advanced Content Script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractLead") {
    try {
      const isLinkedIn = window.location.hostname.includes("linkedin.com");
      let extractedName = "";
      let extractedBio = "";
      
      if (isLinkedIn) {
        // LinkedIn Specific Advanced Parser System
        
        // 1. Try to read structured JSON-LD data
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse(script.textContent || "");
            if (data) {
              // Sometimes it's a list or nested graph
              const items = Array.isArray(data) ? data : (data["@graph"] || [data]);
              for (const item of items) {
                if (item["@type"] === "Person" || item["@type"] === "ProfilePage" || item.name) {
                  if (item.name && !extractedName) {
                    extractedName = item.name.trim();
                  }
                  if (item.description && !extractedBio) {
                    extractedBio = item.description.trim();
                  }
                  if (item.jobTitle && !extractedBio) {
                    const titleText = Array.isArray(item.jobTitle) 
                      ? item.jobTitle.join(", ") 
                      : item.jobTitle;
                    if (titleText) {
                      extractedBio = titleText;
                    }
                  }
                }
              }
            }
          } catch (e) {
            // Ignore individual parsing errors for scripts
          }
        }

        // 2. Extract Name via DOM CSS Selectors (Priority Order)
        if (!extractedName) {
          const nameSelectors = [
            "main h1", 
            ".text-heading-xlarge", 
            "h1.text-heading-xlarge",
            ".pv-top-card-layout__title",
            ".ph5 h1",
            "[data-field='name']",
            ".pv-text-details__left-panel h1",
            ".top-card-layout__title",
            "h1.v-card-name"
          ];
          for (const selector of nameSelectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText && el.innerText.trim()) {
              extractedName = el.innerText.trim();
              break;
            }
          }
        }

        // 3. Name Cleanups (Remove pronouns like '(He/Him)', trailing degrees, emojis)
        if (extractedName) {
          // Remove pronoun patterns like (He/Him), (She/Her), (They/Them), (Ona/Jej), (On/Jego) or [He/Him]
          extractedName = extractedName.replace(/\s*[\(\[][\w/]+[\)\]]\s*$/gi, "");
          // Remove emojis
          extractedName = extractedName.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
          extractedName = extractedName.trim();
        }

        // 4. Meta Fallback for Name (e.g. from OpenGraph)
        if (!extractedName) {
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle && ogTitle.getAttribute("content")) {
            const content = ogTitle.getAttribute("content") || "";
            const parts = content.split("-");
            if (parts[0] && !parts[0].includes("LinkedIn")) {
              extractedName = parts[0].trim();
            }
          }
        }

        // 5. Final General Fallback for Name from Page Title
        if (!extractedName) {
          const title = document.title;
          const parts = title.split("|");
          if (parts[0] && !parts[0].trim().toLowerCase().includes("linkedin")) {
            extractedName = parts[0].trim();
          } else {
            extractedName = title.replace("- LinkedIn", "").replace("LinkedIn", "").trim();
          }
        }

        // 6. Extract Headline/Bio, About, and Experience sections using robust, update-resilient selectors
        let headline = "";
        const bioSelectors = [
          ".text-body-medium.break-words",
          ".pv-top-card-layout__headline",
          ".user-info-sub-title",
          ".ph5 .text-body-medium",
          "div.text-body-medium",
          "[data-field='headline']",
          ".pv-text-details__left-panel .text-body-medium",
          ".top-card-layout__headline"
        ];
        for (const selector of bioSelectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText && el.innerText.trim()) {
            headline = el.innerText.trim();
            break;
          }
        }

        // Resilient Section Text Extractor using Anchor IDs and visual Accessibility Headings
        function getLinkedInSectionResilient(sectionId, polishKeyword, englishKeyword) {
          // 1. Direct Anchor Target checking (built-in standard navigation points in LinkedIn markup)
          const anchor = document.getElementById(sectionId) || document.querySelector(`[id^="${sectionId}"]`);
          if (anchor) {
            const section = anchor.closest("section");
            if (section) {
              return cleanSectionDOM(section);
            }
          }

          // 2. Resilient semantic fallback: Scan all sections for h2 elements matching keywords
          const sections = document.querySelectorAll("section");
          for (const sec of sections) {
            const h2 = sec.querySelector("h2");
            if (h2 && h2.textContent) {
              const headingText = h2.textContent.toLowerCase();
              if (headingText.includes(polishKeyword.toLowerCase()) || headingText.includes(englishKeyword.toLowerCase())) {
                return cleanSectionDOM(sec);
              }
            }
          }
          return "";
        }

        function cleanSectionDOM(sectionContainer) {
          const clone = sectionContainer.cloneNode(true);
          
          // Remove interactive noise, editable state triggers, screen reader text, and style elements
          const elementsToRemove = clone.querySelectorAll("button, .visually-hidden, style, script, [role='button'], .artdeco-button, .pv-profile-section__actions");
          elementsToRemove.forEach(el => el.remove());
          
          // Clean standard helper links/spans like "see more" / "pokazać więcej"
          clone.querySelectorAll("span, a, p").forEach(el => {
            const txtValue = el.textContent ? el.textContent.trim().toLowerCase() : "";
            const isClickLabel = ["see more", "pokaż więcej", "show more", "wyświetl więcej", "see connections", "zobacz kontakty"].includes(txtValue);
            if (isClickLabel) {
              el.remove();
            }
          });

          // Normalize whitespace and retrieve clean innerText representation
          let txt = clone.innerText || clone.textContent || "";
          txt = txt.replace(/\r\n/g, "\n")
                   .replace(/\n\s*\n+/g, "\n\n")
                   .trim();
          return txt;
        }

        // Fetch pristine details from About (O mnie) & Experience (Doświadczenie)
        const rawAbout = getLinkedInSectionResilient("about", "O mnie", "About");
        const rawExperience = getLinkedInSectionResilient("experience", "Doświadczenie", "Experience");

        // Format a fully enriched profile bio context block for the Gemini scoring model
        let unifiedBio = "";
        if (headline) {
          unifiedBio += `${headline}\n\n`;
        } else if (extractedBio) {
          unifiedBio += `${extractedBio}\n\n`;
        }

        if (rawAbout) {
          const parsedAbout = rawAbout.replace(/^(About|O mnie|Informacje)\s*/i, "").trim();
          unifiedBio += `--- O mnie (About) ---\n${parsedAbout}\n\n`;
        }

        if (rawExperience) {
          const parsedExperience = rawExperience.replace(/^(Experience|Doświadczenie)\s*/i, "").trim();
          // Limit experience length slightly to ensure total tokens are optimal while remaining rich
          const optimizedExperience = parsedExperience.length > 1800 
            ? parsedExperience.substring(0, 1800) + "\n...[Dalsza i historyczna treść doświadczenia obcięta dla optymalizacji kontekstu AI]..."
            : parsedExperience;
          unifiedBio += `--- Doświadczenie (Experience) ---\n${optimizedExperience}`;
        }

        if (unifiedBio.trim()) {
          extractedBio = unifiedBio.trim();
        }

        // 8. Meta Fallback for Bio if absolutely empty
        if (!extractedBio) {
          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc && ogDesc.getAttribute("content")) {
            extractedBio = ogDesc.getAttribute("content") || "";
          }
        }
      } else {
        // Standard Webpage Fallback
        extractedName = document.title;
        const metaDesc = document.querySelector('meta[name="description"]') || 
                          document.querySelector('meta[property="og:description"]');
        if (metaDesc) {
          extractedBio = metaDesc.getAttribute("content") || "";
        }
      }

      // Safeguard against missing metadata or dirty strings
      if (extractedName) {
        extractedName = extractedName.replace(/\s+/g, ' ').trim();
      }
      if (extractedBio) {
        extractedBio = extractedBio.replace(/\s+/g, ' ').trim();
      }

      // Check highlighted/selected text on page for custom user override
      const selection = window.getSelection().toString().trim();
      
      sendResponse({
        success: true,
        name: extractedName || "Nieznany Lead",
        bio: extractedBio || "Brak informacji profilowych lub bio",
        selection: selection || "",
        url: window.location.href,
        source: isLinkedIn ? "LinkedIn" : "strony www"
      });
    } catch (err) {
      console.error("[Zapalnik] Scrape Error:", err);
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // Keep message channel open for async response
});
