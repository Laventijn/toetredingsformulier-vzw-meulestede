/**
 * Google Apps Script backend voor het GitHub Pages-toetredingsformulier.
 * Gebruik:
 * 1. Maak een Google Sheet.
 * 2. Extensies > Apps Script.
 * 3. Plak deze code.
 * 4. Run setupSheet één keer en geef rechten.
 * 5. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Kopieer de Web app URL naar assets/js/config.js.
 *
 * Zet GEEN admin-sleutel in GitHub. De backoffice werkt rechtstreeks in Google Sheet.
 */

const SHEET_NAME = 'Aanvragen';
const PDF_FOLDER_NAME = 'Toetredingsformulieren vzw Meulestede';
const BACKOFFICE_EMAIL = 'valentijn@meulestede.gent';

const FIELDS = [
  ['timestamp_server', 'Timestamp server'],
  ['id', 'ID'],
  ['form_version', 'Formulier versie'],
  ['source', 'Bron'],
  ['submitted_at_client', 'Timestamp gebruiker'],
  ['org_name', 'Naam vereniging'],
  ['legal_form', 'Rechtsvorm'],
  ['enterprise_number', 'Ondernemingsnummer'],
  ['address', 'Adres'],
  ['postal_code', 'Postcode'],
  ['city', 'Gemeente'],
  ['website', 'Website/sociale media'],
  ['first_name', 'Voornaam'],
  ['last_name', 'Familienaam'],
  ['role', 'Functie'],
  ['email', 'E-mail'],
  ['phone', 'Telefoon'],
  ['mobile', 'GSM'],
  ['working_description', 'Werking'],
  ['goal_alignment', 'Aansluiting maatschappelijk doel'],
  ['engagement_goal', 'Engagement doel'],
  ['engagement_activity', 'Engagement activiteit'],
  ['engagement_delegate', 'Engagement vertegenwoordiger'],
  ['engagement_updates', 'Engagement wijzigingen'],
  ['engagement_rules', 'Engagement regels'],
  ['supporter_1', 'Steunend AV-lid 1'],
  ['supporter_2', 'Steunend AV-lid 2'],
  ['supporter_3', 'Steunend AV-lid 3'],
  ['signatory_name', 'Ondertekenaar'],
  ['submission_date', 'Datum ondertekening'],
  ['legal_confirmation', 'Bevestiging bevoegdheid'],
  ['privacy_consent', 'Privacy akkoord'],
  ['pdf_url', 'PDF Google Drive'],
  ['status', 'Status'],
  ['av_date', 'Datum AV-bekrachtiging'],
  ['notes', 'Notities']
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Meulestede backoffice')
    .addItem('Kolommen installeren/controleren', 'setupSheet')
    .addSeparator()
    .addItem('vCard maken van geselecteerde rijen', 'createVCardsFromSelection')
    .addItem('vCard maken van alle rijen', 'createVCardsFromAll')
    .addToUi();
}

function setupSheet() {
  const sheet = getSheet_();
  const headers = FIELDS.map(field => field[1]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet_();
    ensureHeaders_(sheet);
    const p = (e && e.parameter) ? e.parameter : {};
    const data = buildSubmissionData_(p);
    sheet.appendRow(rowFromData_(data));

    const rowIndex = sheet.getLastRow();
    const pdfFile = createSubmissionPdf_(data);
    data.pdf_url = pdfFile.getUrl();
    updateRowFromData_(sheet, rowIndex, data);
    sendSubmissionEmails_(data, pdfFile);

    return HtmlService.createHtmlOutput('<!doctype html><html><body>OK</body></html>');
  } catch (err) {
    return HtmlService.createHtmlOutput('<!doctype html><html><body>Fout: ' + escapeHtml_(err.message) + '</body></html>');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return HtmlService.createHtmlOutput('<!doctype html><html><body>OK - vzw Meulestede formulier backend actief</body></html>');
}

function buildSubmissionData_(p) {
  const data = {};
  FIELDS.forEach(([key]) => {
    data[key] = p[key] || '';
  });
  data.timestamp_server = new Date();
  data.id = Utilities.getUuid();
  data.status = 'Nieuw';
  return data;
}

function rowFromData_(data) {
  return FIELDS.map(([key]) => data[key] || '');
}

function updateRowFromData_(sheet, rowIndex, data) {
  sheet.getRange(rowIndex, 1, 1, FIELDS.length).setValues([rowFromData_(data)]);
}

function createSubmissionPdf_(data) {
  const folder = getPdfFolder_();
  const safeOrg = sanitizeFileName_(data.org_name || 'aanvraag');
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  const fileName = `toetredingsformulier-vzw-meulestede-${safeOrg}-${timestamp}.pdf`;
  const doc = DocumentApp.create(fileName.replace(/\.pdf$/i, ''));
  const docFile = DriveApp.getFileById(doc.getId());

  try {
    buildPdfDocument_(doc, data);
    doc.saveAndClose();

    const pdfBlob = docFile.getBlob().getAs(MimeType.PDF).setName(fileName);
    const pdfFile = folder.createFile(pdfBlob);
    docFile.setTrashed(true);
    return pdfFile;
  } catch (err) {
    docFile.setTrashed(true);
    throw err;
  }
}

function buildPdfDocument_(doc, data) {
  const body = doc.getBody();
  body.clear();

  const title = body.appendParagraph('VZW Meulestede');
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Toetredingsformulier lidmaatschap Algemene Vergadering');
  body.appendParagraph('Meulesteedsesteenweg 517, 9000 Gent - info@meulestede.gent');
  body.appendHorizontalRule();

  appendSection_(body, '1. Gegevens van de vereniging / organisatie', [
    ['Naam', data.org_name],
    ['Rechtsvorm', data.legal_form],
    ['Ondernemingsnummer', data.enterprise_number],
    ['Adres', data.address],
    ['Postcode/gemeente', [data.postal_code, data.city].filter(Boolean).join(' ')],
    ['Website/sociale media', data.website]
  ]);

  appendSection_(body, '2. Contactpersoon en afgevaardigde voor de AV', [
    ['Naam', [data.first_name, data.last_name].filter(Boolean).join(' ')],
    ['Functie', data.role],
    ['E-mail', data.email],
    ['Telefoon', data.phone],
    ['GSM', data.mobile]
  ]);

  appendSection_(body, '3. Werking en maatschappelijk doel', [
    ['Werking', data.working_description],
    ['Aansluiting maatschappelijk doel', data.goal_alignment]
  ]);

  appendSection_(body, '4. Engagementen als lid van de Algemene Vergadering', [
    ['Maatschappelijk doel onderschreven', data.engagement_goal],
    ['Jaarlijkse activiteit', data.engagement_activity],
    ['Vaste vertegenwoordiger AV', data.engagement_delegate],
    ['Wijzigingen tijdig doorgeven', data.engagement_updates],
    ['Statuten en huishoudelijk reglement', data.engagement_rules]
  ]);

  appendSection_(body, '5. Lidgeld', [
    ['Lidgeld', 'Er wordt geen lidgeld gevraagd.']
  ]);

  appendSection_(body, '6. Gesteund door', [
    ['Steunend AV-lid 1', data.supporter_1],
    ['Steunend AV-lid 2', data.supporter_2],
    ['Steunend AV-lid 3', data.supporter_3]
  ]);

  appendSection_(body, '7. Ondertekening', [
    ['Ondertekenaar', data.signatory_name],
    ['Datum', data.submission_date],
    ['Bevestiging bevoegdheid', data.legal_confirmation],
    ['Privacy akkoord', data.privacy_consent]
  ]);

  body.appendParagraph('Voorbehouden voor het bestuur van vzw Meulestede')
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable([
    ['Ontvangen op', '', 'Door', ''],
    ['Behandeld door', '', 'Datum AV-bekrachtiging', ''],
    ['[ ] Aanvaard door de AV', '', '', ''],
    ['[ ] Geweigerd / uitgesteld (zie notities)', '', '', ''],
    ['Notities', '', '', '']
  ]);
}

function appendSection_(body, title, rows) {
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  rows.forEach(([label, value]) => {
    const paragraph = body.appendParagraph('');
    paragraph.appendText(label + ': ').setBold(true);
    paragraph.appendText(String(value || '-'));
  });
}

function sendSubmissionEmails_(data, pdfFile) {
  const subject = `Toetredingsformulier vzw Meulestede - ${data.org_name || data.signatory_name || 'nieuwe aanvraag'}`;
  const applicantEmail = String(data.email || '').trim();
  const plainBody = [
    'Er is een nieuw toetredingsformulier ingediend.',
    '',
    `Vereniging: ${data.org_name || '-'}`,
    `Contactpersoon: ${[data.first_name, data.last_name].filter(Boolean).join(' ') || '-'}`,
    `E-mail: ${data.email || '-'}`,
    `PDF in Google Drive: ${pdfFile.getUrl()}`
  ].join('\n');

  MailApp.sendEmail({
    to: BACKOFFICE_EMAIL,
    subject,
    body: plainBody,
    attachments: [pdfFile.getBlob()]
  });

  if (applicantEmail) {
    MailApp.sendEmail({
      to: applicantEmail,
      subject: 'Kopie van uw toetredingsformulier voor vzw Meulestede',
      body: [
        'Beste,',
        '',
        'Bedankt voor uw aanvraag tot toetreding tot de Algemene Vergadering van vzw Meulestede.',
        'In bijlage vindt u een PDF-kopie van het ingediende formulier.',
        '',
        'Met vriendelijke groeten',
        'vzw Meulestede'
      ].join('\n'),
      attachments: [pdfFile.getBlob()]
    });
  }
}

function getPdfFolder_() {
  const ssFile = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
  const parents = ssFile.getParents();
  const parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  const folders = parent.getFoldersByName(PDF_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : parent.createFolder(PDF_FOLDER_NAME);
}

function sanitizeFileName_(value) {
  return String(value || 'aanvraag')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'aanvraag';
}

function createVCardsFromAll() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  createVcardFile_(values.slice(1), getHeaderMap_(values[0]));
}

function createVCardsFromSelection() {
  const sheet = getSheet_();
  const selection = sheet.getActiveRange();
  if (!selection) {
    SpreadsheetApp.getUi().alert('Selecteer eerst één of meerdere rijen met aanvragen.');
    return;
  }

  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rows = selection.getValues().filter((_, idx) => selection.getRow() + idx !== 1);
  createVcardFile_(rows, getHeaderMap_(header));
}

function createVcardFile_(rows, headerMap) {
  const vcards = rows
    .filter(row => get_(row, headerMap, 'E-mail') || get_(row, headerMap, 'GSM') || get_(row, headerMap, 'Telefoon'))
    .map(row => rowToVcard_(row, headerMap))
    .join('\n');

  if (!vcards) {
    SpreadsheetApp.getUi().alert('Geen contactgegevens gevonden in de selectie.');
    return;
  }

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  const blob = Utilities.newBlob(vcards, 'text/vcard', `vzw-meulestede-contacten-${timestamp}.vcf`);
  const file = DriveApp.createFile(blob);
  SpreadsheetApp.getUi().alert('vCard-bestand gemaakt in Google Drive:\n' + file.getUrl());
}

function rowToVcard_(row, h) {
  const first = get_(row, h, 'Voornaam');
  const last = get_(row, h, 'Familienaam');
  const fullName = [first, last].filter(Boolean).join(' ') || get_(row, h, 'Ondertekenaar') || get_(row, h, 'Naam vereniging');
  const org = get_(row, h, 'Naam vereniging');
  const role = get_(row, h, 'Functie');
  const email = get_(row, h, 'E-mail');
  const mobile = get_(row, h, 'GSM');
  const phone = get_(row, h, 'Telefoon');
  const website = get_(row, h, 'Website/sociale media');
  const address = get_(row, h, 'Adres');
  const postal = get_(row, h, 'Postcode');
  const city = get_(row, h, 'Gemeente');
  const note = 'Kandidaat-lid AV vzw Meulestede. Status: ' + get_(row, h, 'Status');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc_(last)};${esc_(first)};;;`,
    `FN:${esc_(fullName)}`,
    org ? `ORG:${esc_(org)}` : '',
    role ? `TITLE:${esc_(role)}` : '',
    email ? `EMAIL;TYPE=INTERNET:${esc_(email)}` : '',
    mobile ? `TEL;TYPE=CELL:${esc_(mobile)}` : '',
    phone ? `TEL;TYPE=WORK,VOICE:${esc_(phone)}` : '',
    (address || postal || city) ? `ADR;TYPE=WORK:;;${esc_(address)};${esc_(city)};;${esc_(postal)};Belgium` : '',
    website ? `URL:${esc_(website)}` : '',
    `NOTE:${esc_(note)}`,
    'END:VCARD'
  ].filter(Boolean);

  return lines.join('\n');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  const headers = FIELDS.map(field => field[1]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

function getHeaderMap_(header) {
  const map = {};
  header.forEach((name, index) => { map[String(name).trim()] = index; });
  return map;
}

function get_(row, h, headerName) {
  const index = h[headerName];
  return index === undefined ? '' : String(row[index] || '').trim();
}

function esc_(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
