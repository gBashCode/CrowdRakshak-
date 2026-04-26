git rm --cached backend/seed_log.txt
git add .
git commit -m "Add seed_log.txt to gitignore"
git pull --rebase origin main
git push
