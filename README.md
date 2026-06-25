# Toetredingsformulier AV – vzw Meulestede

Statische GitHub Pages-site voor het online toetredingsformulier van vzw Meulestede.

De site doet drie dingen:

1. kandidaat-leden vullen het formulier online in;
2. de kandidaat kan zelf een ingevulde PDF downloaden;
3. de aanvraag wordt doorgestuurd naar een Google Sheet voor de backoffice.

De backoffice kan vanuit Google Sheets een Excelbestand downloaden en via het Apps Script-menu vCards maken.

## Projectstructuur

```text
.
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── config.js
│       ├── form.js
│       └── pdf.js
├── google-apps-script/Code.gs
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── .env.example
├── .gitignore
├── .nojekyll
└── README.md
```

## 1. Lokaal openen

Er is geen buildstap nodig. Open de map in VS Code en gebruik Live Server, of start lokaal:

```bash
python -m http.server 8080
```

Open daarna:

```text
http://localhost:8080
```

## 2. Google Sheet en Apps Script-backend

1. Maak een nieuwe Google Sheet, bijvoorbeeld `Aanvragen AV vzw Meulestede`.
2. Ga naar **Extensies > Apps Script**.
3. Plak de inhoud van `google-apps-script/Code.gs`.
4. Sla op.
5. Run `setupSheet` één keer en geef toestemming.
6. Klik **Deploy > New deployment > Web app**.
7. Kies:
   - **Execute as:** Me
   - **Who has access:** Anyone
8. Kopieer de Web app URL.
9. Vul die URL in `assets/js/config.js` in bij `GOOGLE_SCRIPT_URL`.

Voorbeeld:

```js
window.APP_CONFIG = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
  ORGANISATION_EMAIL: "info@meulestede.gent"
};
```

Zet geen wachtwoorden, tokens of geheime sleutels in `config.js`. Alles in GitHub Pages is publiek zichtbaar.

## 3. Excel-export backoffice

Open de Google Sheet en kies:

```text
Bestand > Downloaden > Microsoft Excel (.xlsx)
```

## 4. vCard-export backoffice

In de Google Sheet verschijnt na herladen het menu:

```text
Meulestede backoffice
```

Daarmee kunt u:

- vCards maken van geselecteerde rijen;
- vCards maken van alle rijen.

Het script maakt een `.vcf`-bestand in Google Drive en toont de link.

## 5. Git lokaal installeren en pushen

### Optie A: repository manueel maken op GitHub

Maak op GitHub een nieuwe repository, bijvoorbeeld:

```text
toetredingsformulier-vzw-meulestede
```

Daarna lokaal:

```bash
git init
git add .
git commit -m "Init online toetredingsformulier"
git branch -M main
git remote add origin git@github.com:<jouw-gebruiker>/toetredingsformulier-vzw-meulestede.git
git push -u origin main
```

Gebruik HTTPS als u geen SSH gebruikt:

```bash
git remote add origin https://github.com/<jouw-gebruiker>/toetredingsformulier-vzw-meulestede.git
```

### Optie B: met GitHub CLI

```bash
gh repo create toetredingsformulier-vzw-meulestede --public --source=. --remote=origin --push
```

## 6. GitHub Pages activeren

Ga in de repository naar:

```text
Settings > Pages
```

Kies:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

De site komt dan typisch online op:

```text
https://<jouw-gebruiker>.github.io/toetredingsformulier-vzw-meulestede/
```

Voor een organisatie of gebruiker-site kan de repository ook `<jouw-gebruiker>.github.io` heten. Dan komt de site op:

```text
https://<jouw-gebruiker>.github.io/
```

## 7. Aanpassingen

Wijzig vooral:

- teksten in `index.html`;
- kleuren in `assets/css/styles.css`;
- backend-URL in `assets/js/config.js`;
- velden/kolommen in `google-apps-script/Code.gs`.

## 8. Privacy en veiligheid

- Formulierdata wordt niet opgeslagen in GitHub.
- De PDF wordt lokaal in de browser gegenereerd.
- De aanvraag wordt doorgestuurd naar de Google Sheet.
- Zet geen geheime sleutels in de front-end.
- Beperk de toegang tot de Google Sheet tot de backoffice.
