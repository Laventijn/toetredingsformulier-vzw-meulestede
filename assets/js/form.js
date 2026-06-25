(function () {
  const form = document.getElementById("membershipForm");
  const status = document.getElementById("formStatus");
  const pdfBtn = document.getElementById("downloadPdfBtn");
  const dateField = form.elements["submission_date"];
  const clientTimeField = document.getElementById("submitted_at_client");
  const backendUrl = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_SCRIPT_URL;
  let iframeLoadedOnce = false;

  function setStatus(message, kind) {
    status.textContent = message || "";
    status.className = kind || "";
  }

  function setDefaults() {
    if (dateField && !dateField.value) {
      dateField.value = new Date().toISOString().slice(0, 10);
    }
  }

  function validateForm() {
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Vul de verplichte velden en bevestigingen aan.", "error");
      return false;
    }
    return true;
  }

  pdfBtn.addEventListener("click", function () {
    if (!validateForm()) return;
    window.generateMembershipPdf(form);
    setStatus("PDF gedownload. U kunt het formulier nu ook indienen.", "success");
  });

  form.addEventListener("submit", function (event) {
    if (!validateForm()) {
      event.preventDefault();
      return;
    }

    if (!backendUrl) {
      event.preventDefault();
      setStatus("Er is nog geen Google Apps Script URL ingesteld in assets/js/config.js. De PDF-download werkt wel al.", "error");
      return;
    }

    clientTimeField.value = new Date().toISOString();
    form.action = backendUrl;
    setStatus("Aanvraag wordt verzonden…", "");
  });

  document.getElementById("hiddenSubmitFrame").addEventListener("load", function () {
    if (!iframeLoadedOnce) {
      iframeLoadedOnce = true;
      return;
    }
    setStatus("Aanvraag verzonden ter verwerking. Download de PDF indien u dat nog niet deed.", "success");
    form.reset();
    setDefaults();
  });

  setDefaults();
})();
