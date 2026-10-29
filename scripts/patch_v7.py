P='/home/claude/futbol-mundo-store/index.html'
s=open(P,encoding='utf-8').read()
css=open('scripts/v7.css',encoding='utf-8').read(); js=open('scripts/v7.js',encoding='utf-8').read()
assert s.count('</head>')==1 and s.count('</body>')==1
pre="<script>try{var l=localStorage.getItem('fm_lang')||sessionStorage.getItem('fm_lang_auto');if(l&&l!=='en')document.documentElement.classList.add('i18n-wait');setTimeout(function(){document.documentElement.classList.remove('i18n-wait')},2500)}catch(e){}</script>\n"
s=s.replace('</head>','<style>\n'+css+'\n</style>\n'+pre+'</head>').replace('</body>','<script>\n'+js+'\n</script>\n</body>')
open(P,'w',encoding='utf-8').write(s); print('ok')
