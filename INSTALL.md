# Installatiekort

## Lokaal testen

```bash
cd vzw-meulestede-toetreding-github-pages
python -m http.server 8080
```

Open `http://localhost:8080`.

## Git init en push

Windows batch scripts:

```bat
scripts\bewaar-lokaal.bat
scripts\push-github.bat
```

Of handmatig:

```bash
git init
git add .
git commit -m "Init online toetredingsformulier"
git branch -M main
git remote add origin https://github.com/Laventijn/toetredingsformulier-vzw-meulestede.git
git push -u origin main
```

Of met GitHub CLI:

```bash
gh repo create toetredingsformulier-vzw-meulestede --public --source=. --remote=origin --push
```

## GitHub Pages

Repository > Settings > Pages:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

## Google Apps Script

1. Maak Google Sheet.
2. Extensies > Apps Script.
3. Plak `google-apps-script/Code.gs`.
4. Run `setupSheet`.
5. Deploy als Web App.
6. Plak Web App URL in `assets/js/config.js`.
