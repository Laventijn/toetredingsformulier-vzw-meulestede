param(
  [string]$RepoName = "toetredingsformulier-vzw-meulestede",
  [Parameter(Mandatory=$true)]
  [string]$RemoteUrl
)

git init
git add .
git commit -m "Init online toetredingsformulier"
git branch -M main
git remote add origin $RemoteUrl
git push -u origin main
