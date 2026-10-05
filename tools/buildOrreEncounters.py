"""Build factual encounter rows from cached Serebii tables, with reviewed corrections."""
from pathlib import Path
from bs4 import BeautifulSoup
import re,json
output={'Colosseum':[],'XD':[]}
for game,file in [('Colosseum','colosseum-pokemon'),('XD','xd-pokemon')]:
 soup=BeautifulSoup(Path('/private/tmp/'+file+'.html').read_text(encoding='latin1'),'html.parser')
 for tr in soup.find_all('tr'):
  cells=tr.find_all('td',recursive=False)
  if len(cells)!=7:continue
  vals=[c.get_text(' ',strip=True) for c in cells]
  if not re.fullmatch(r'#\d{3}',vals[1]):continue
  dex=int(vals[1][1:]);level=re.search(r'Lv\. (\d+)',vals[3])
  entry={'dex':dex,'place':vals[4],'kind':'Shadow Pokémon','trainer':vals[5]}
  if level:entry['level']=int(level[1])
  if vals[5]=='You':entry.update(kind='Starter',place='Starting team');entry.pop('trainer')
  if game=='Colosseum':
   if dex in [251,25,385]:continue # Bonus-disc distributions are not ordinary encounters.
   if dex==250:entry.update(kind='Mt. Battle reward',place='Mt. Battle · Battle Mode');entry.pop('trainer')
   if dex==311:entry.update(kind='Gift',trainer='Duking',place='Pyrite Town')
   if vals[2].endswith(' e'):
    entry.update(place='Phenac City · e-Reader room',kind='Shadow Pokémon · Japanese e-Reader',level={175:20,179:37,212:50}[dex]);entry.pop('trainer')
   if vals[2].endswith(' +'):entry['kind']='Shadow Pokémon · Postgame'
  if game=='XD':
   if dex==299:entry.update(place='Pyrite Colosseum / Realgam Colosseum / Poké Spots',trainer='Miror B.')
   if dex==175:entry['kind']='Shadow gift'
   if dex==239:entry.update(kind='In-game trade',level=20,trainer='Hordel',note='Trade Togepi / Togetic',inlineNote=True)
   if dex==133:entry['place']='Pokémon HQ Lab'
  output[game].append(entry)
# Poké Spot rates and corrected common-species level caps: Bulbapedia Poké Spot.
for place,mons in [('Rock Poké Spot',[(27,10,23,50),(207,10,20,35),(328,10,20,15)]),('Oasis Poké Spot',[(187,10,20,50),(231,10,20,35),(283,10,20,15)]),('Cave Poké Spot',[(41,10,21,50),(304,10,21,35),(194,10,21,15)])]:
 for dex,low,high,rate in mons:output['XD'].append({'dex':dex,'place':place,'kind':'Wild encounter','level':f'{low}–{high}','rate':rate})
for dex,wanted in [(307,'Trapinch'),(213,'Surskit'),(246,'Wooper')]:output['XD'].append({'dex':dex,'place':'Pyrite Town','kind':'In-game trade','level':20,'trainer':'Duking','note':f'Trade {wanted}','inlineNote':True})
for dex in [152,155,158]:output['XD'].append({'dex':dex,'place':'Mt. Battle','kind':'Mt. Battle reward','level':5})
Path('src/data/orreEncounters.js').write_text('// Factual encounter data: Serebii Colosseum/XD tables; Poké Spot and Elekid corrections checked against Bulbapedia.\n// Rebuild: python3 tools/buildOrreEncounters.py (cached HTML required in /private/tmp).\nexport const orreEncounters = '+json.dumps(output,ensure_ascii=False)+'\n')
print({game:len(rows) for game,rows in output.items()})
