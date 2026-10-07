"""Extract reachable trainer-held berries, retaining party IDs for audit.

Usage: python3 tools/generate-berry-trainer-sources.py emerald ruby firered
Facility rental opponents are excluded: their held items cannot be kept.
"""
import json
import re
import sys
from pathlib import Path

rows = []
for root, game in zip(map(Path, sys.argv[1:]), ['Emerald', 'Ruby / Sapphire', 'FireRed / LeafGreen']):
    constants_text = (root / 'include/constants/items.h').read_text()
    constants = {k:int(v) for k,v in re.findall(r'#define\s+(ITEM_\w+)\s+(\d+)\b', constants_text)}
    if not constants:
        enum = re.sub(r'//[^\n]*', '', constants_text.split('enum {',1)[1].split('};',1)[0])
        constants = {k:i for i,k in enumerate(re.findall(r'\bITEM_\w+\b',enum))}
    parties = {}
    for party, body in re.findall(r'\b((?:sParty_|gTrainerParty_)\w+)\[\]\s*=\s*\{(.*?)\n\};', (root / 'src/data/trainer_parties.h').read_text(encoding='latin1'), re.S):
        held = {constants[k] for k in re.findall(r'\.heldItem\s*=\s*(ITEM_\w+)', body) if constants.get(k) in set(range(133,143)) | set(range(153,159)) | set(range(168,175))}
        if held:
            parties[party] = held
    trainer_file = root / 'src/data/trainers.h'
    if not trainer_file.exists():
        trainer_file = root / 'src/data/trainers_en.h'
    trainer_text = trainer_file.read_text(encoding='latin1')
    trainer_data = {}
    for trainer, body in re.findall(r'\[(TRAINER_\w+)\]\s*=\s*\{(.*?)\n\s*\},',trainer_text,re.S):
        party = re.search(r'\b((?:sParty_|gTrainerParty_)\w+)\b',body)
        name = re.search(r'\.trainerName\s*=\s*_\("([^"]+)"\)',body)
        if party and party[1] in parties and name:
            trainer_data[trainer] = (name[1].title(), parties[party[1]])
    locations = {}
    for path in sorted((root / 'data/maps').glob('*/scripts.inc')):
        if any(s in path.parent.name for s in ['Unused','BattleFrontier','TrainerHill','TrainerTower','BattleTower']):
            continue
        for battle in re.findall(r'\btrainerbattle\w*\s+([^\n]+)',path.read_text(encoding='latin1')):
            for trainer in re.findall(r'\bTRAINER_\w+\b',battle):
                locations.setdefault(trainer, set()).add(path.parent.name)
    found = {}
    for trainer, (name, held) in trainer_data.items():
        base = re.sub(r'_\d+$','_1',trainer)
        maps = locations.get(trainer) or locations.get(base) or locations.get(re.sub(r'_\d+$','',trainer))
        if not maps:
            continue
        for item in held:
            for area in maps:
                stage = re.search(r'_(\d+)$',trainer)
                same_item_rematch = any(other != trainer and re.sub(r'_\d+$','_1',other) == base and item in data[1] for other,data in trainer_data.items())
                repeat = bool(stage and (int(stage[1]) > 1 or same_item_rematch)) or area.startswith(('EverGrandeCity','IndigoPlateau','PokemonLeague'))
                key = (item,area,repeat)
                found.setdefault(key, {'names':set(),'trainers':set()})
                found[key]['names'].add(name)
                found[key]['trainers'].add(trainer)
    for (item,area,repeat), data in sorted(found.items()):
        location = re.sub(r'(?<=[a-z])(?=[A-Z0-9])',' ',area.replace('_',' · ')).replace('Pokemon','Pokémon').replace('SSTidal','S.S. Tidal')
        rows.append({'item':item,'game':game,'location':location,'repeatable':repeat,'names':sorted(data['names']),'trainers':sorted(data['trainers'])})
Path('src/data/berryTrainerSources.js').write_text('// Generated from reachable pret trainer parties and map scripts.\nexport const berryTrainerSources = '+json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(f'{len(rows)} trainer-held berry sources generated')
