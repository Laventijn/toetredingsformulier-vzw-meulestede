(function () {
  function value(form, name) {
    const field = form.elements[name];
    if (!field) return "";
    if (field.type === "checkbox") return field.checked ? "Ja" : "Nee";
    return String(field.value || "").trim();
  }

  function checked(form, name) {
    const field = form.elements[name];
    return field && field.checked ? "☑" : "☐";
  }

  function addWrapped(doc, label, text, x, y, maxWidth) {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text || "—", maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 5.2) + 4;
  }

  function addLine(doc, label, text, x, y) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(text || "—"), x + 52, y);
    return y + 7;
  }

  function ensurePage(doc, y) {
    if (y > 270) {
      doc.addPage();
      return 20;
    }
    return y;
  }

  function drawPdfHeader(doc, pageWidth) {
    doc.setFillColor(31, 78, 121);
    doc.rect(0, 0, pageWidth, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("VZW Meulestede", 14, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Toetredingsformulier lidmaatschap Algemene Vergadering", 14, 18);

    doc.setFontSize(10);
    doc.text("Meulesteedsesteenweg 517", pageWidth - 14, 10, { align: "right" });
    doc.text("9000 Gent", pageWidth - 14, 15, { align: "right" });
    doc.text("info@meulestede.gent", pageWidth - 14, 20, { align: "right" });

    doc.setTextColor(0, 0, 0);
  }

  function drawBoardReservedSection(doc, startY, pageWidth, margin) {
    const x = margin;
    const w = pageWidth - margin * 2;
    let y = startY;

    doc.setDrawColor(170);
    doc.setFillColor(248, 248, 248);
    doc.rect(x, y, w, 78, "FD");

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(90);
    doc.text("Voorbehouden voor het bestuur van vzw Meulestede", x + 4, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);

    doc.rect(x + 4, y, 44, 12);
    doc.text("Ontvangen op", x + 5, y + 7);
    doc.rect(x + 48, y, 44, 12);
    doc.rect(x + 92, y, 44, 12);
    doc.text("Door", x + 93, y + 7);
    doc.rect(x + 136, y, 44, 12);

    y += 18;

    doc.rect(x + 4, y, 44, 12);
    doc.text("Behandeld door", x + 5, y + 7);
    doc.rect(x + 48, y, 44, 12);
    doc.rect(x + 92, y, 44, 12);
    doc.text("Datum AV-", x + 93, y + 5);
    doc.text("bekrachtiging", x + 93, y + 9);
    doc.rect(x + 136, y, 44, 12);

    y += 18;

    doc.rect(x + 4, y, 10, 10);
    doc.rect(x + 14, y, w - 18, 10);
    doc.text("Aanvaard door de AV", x + 17, y + 6.5);

    y += 10;

    doc.rect(x + 4, y, 10, 10);
    doc.rect(x + 14, y, w - 18, 10);
    doc.text("Geweigerd / uitgesteld (zie notities)", x + 17, y + 6.5);

    y += 16;

    doc.setFont("helvetica", "bold");
    doc.text("Notities:", x + 4, y);
    y += 3;
    doc.rect(x + 4, y, w - 8, 18);

    doc.setTextColor(0, 0, 0);
    return y + 22;
  }

  window.generateMembershipPdf = function generateMembershipPdf(form) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 18;
    const maxWidth = 174;
    let y = 36;

    drawPdfHeader(doc, pageWidth);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Gegevens van de vereniging / organisatie", left, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    y = addLine(doc, "Naam", value(form, "org_name"), left, y);
    y = addLine(doc, "Rechtsvorm", value(form, "legal_form"), left, y);
    y = addLine(doc, "Ondernemingsnr.", value(form, "enterprise_number"), left, y);
    y = addLine(doc, "Adres", value(form, "address"), left, y);
    y = addLine(doc, "Postcode/gemeente", `${value(form, "postal_code")} ${value(form, "city")}`.trim(), left, y);
    y = addLine(doc, "Website", value(form, "website"), left, y);
    y += 3;

    y = ensurePage(doc, y);
    doc.setFont("helvetica", "bold");
    doc.text("2. Contactpersoon en afgevaardigde voor de AV", left, y);
    y += 8;
    y = addLine(doc, "Naam", `${value(form, "first_name")} ${value(form, "last_name")}`.trim(), left, y);
    y = addLine(doc, "Functie", value(form, "role"), left, y);
    y = addLine(doc, "E-mail", value(form, "email"), left, y);
    y = addLine(doc, "Telefoon", value(form, "phone"), left, y);
    y = addLine(doc, "GSM", value(form, "mobile"), left, y);
    y += 3;

    y = ensurePage(doc, y);
    doc.setFont("helvetica", "bold");
    doc.text("3. Werking en maatschappelijk doel", left, y);
    y += 8;
    y = addWrapped(doc, "Korte omschrijving van de werking", value(form, "working_description"), left, y, maxWidth);
    y = ensurePage(doc, y);
    y = addWrapped(doc, "Aansluiting bij maatschappelijk doel", value(form, "goal_alignment"), left, y, maxWidth);

    y = ensurePage(doc, y + 4);
    doc.setFont("helvetica", "bold");
    doc.text("4. Engagementen als lid van de Algemene Vergadering", left, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const engagements = [
      ["engagement_goal", "Wij onderschrijven het maatschappelijk doel: gemeenschapsvorming en armoedebestrijding."],
      ["engagement_activity", "Wij organiseren minstens één activiteit per jaar binnen het patrimonium van vzw Meulestede."],
      ["engagement_delegate", "Wij vaardigen een vaste vertegenwoordiger af naar de Algemene Vergadering."],
      ["engagement_updates", "Wij communiceren relevante informatie en wijzigingen tijdig door."],
      ["engagement_rules", "Wij respecteren de statuten en het huishoudelijk reglement."]
    ];
    engagements.forEach(([name, text]) => {
      y = ensurePage(doc, y);
      const lines = doc.splitTextToSize(`${checked(form, name)} ${text}`, maxWidth);
      doc.text(lines, left, y);
      y += lines.length * 5.2 + 3;
    });

    y = ensurePage(doc, y + 4);
    doc.setFont("helvetica", "bold");
    doc.text("5. Lidgeld", left, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("Er wordt geen lidgeld gevraagd.", left, y);
    y += 10;

    y = ensurePage(doc, y);
    doc.setFont("helvetica", "bold");
    doc.text("6. Gesteund door", left, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    y = addLine(doc, "AV-lid 1", value(form, "supporter_1"), left, y);
    y = addLine(doc, "AV-lid 2", value(form, "supporter_2"), left, y);
    y = addLine(doc, "AV-lid 3", value(form, "supporter_3"), left, y);
    y += 3;

    y = ensurePage(doc, y);
    doc.setFont("helvetica", "bold");
    doc.text("7. Ondertekening", left, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    y = addLine(doc, "Ondertekenaar", value(form, "signatory_name"), left, y);
    y = addLine(doc, "Datum", value(form, "submission_date"), left, y);
    y += 2;
    doc.text(`${checked(form, "legal_confirmation")} Rechtsgeldig gemachtigd en gegevens correct.`, left, y);
    y += 7;
    doc.text(`${checked(form, "privacy_consent")} Akkoord met verwerking voor kandidatuur en ledenadministratie.`, left, y);
    y += 16;

    y = ensurePage(doc, y);
    doc.setDrawColor(160);
    doc.line(left, y, left + 75, y);
    doc.line(left + 98, y, left + 173, y);
    y += 5;
    doc.setFontSize(9);
    doc.text("Handtekening", left, y);
    doc.text("Stempel, optioneel", left + 98, y);

    y += 10;
    if (y > pageHeight - 95) {
      doc.addPage();
      y = 20;
    }

    drawBoardReservedSection(doc, y + 6, pageWidth, 14);

    const safeOrg = value(form, "org_name").replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "aanvraag";
    const fileName = `toetredingsformulier-vzw-meulestede-${safeOrg}.pdf`;
    doc.save(fileName);
  };
})();
