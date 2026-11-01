set -e
cd ~/promo
npm i --no-audit --no-fund playwright@1.49.0 ffmpeg-static >/dev/null 2>&1
(ROOT=$HOME/repo node server.mjs > server.log 2>&1 &) ; sleep 3
node flow.cjs rec
node encode.cjs
ls -la screen.mp4 sheet.jpg
if [ -n "$UP_VIDEO" ]; then curl -sS -o /dev/null -w "video %{http_code}\n" -X PUT -H "Content-Type: video/mp4" --data-binary @screen.mp4 "$UP_VIDEO"; fi
