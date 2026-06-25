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
    const row = FIELDS.map(([key]) => {
      if (key === 'timestamp_server') return new Date();
      if (key === 'id') return Utilities.getUuid();
      if (key === 'status') return 'Nieuw';
      return p[key] || '';
    });
    sheet.appendRow(row);
    return HtmlService.createHtmlOutput('<!doctype html><html><body>OK</body></html>');
  } catch (err) {
    return HtmlService.createHtmlOutput('<!doctype html><html><body>Fout: ' + escapeHtml_(err.message) + '</body></html>');
  } finally {
    lock.releaseLock();
  }
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
  if (sheet.getLastRow() === 0 || !sheet.getRange(1, 1).getValue()) setupSheet();
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
