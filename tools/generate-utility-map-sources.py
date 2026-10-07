"""Extract Utility field items and shop inventories from pret Gen 3 map data.

Usage: python3 tools/generate-utility-map-sources.py emerald ruby firered
Exact map IDs and pickup coordinates remain available for location pages.
"""
import json
import re
import sys
from pathlib import Path

IDS = {189,195,182,197,181,184,68,110,111,69,71,103,104,63,64,65,67,70,66,190,194,80,81,86,83,84,85,39,40,41,42,43}
machines = len(sys.argv) > 4 and sys.argv[4] == 'machines'
if machines:
    IDS = set(range(289,347))
pokeballs = len(sys.argv) > 4 and sys.argv[4] == 'balls'
if pokeballs:
    IDS = set(range(1,13))
misc = len(sys.argv) > 4 and sys.argv[4] == 'misc'
if misc:
    IDS = {46,47,48,49,50,51,93,94,95,96,97,98,201,218,275,286,287,354,357,358,370,371,376}
berries = len(sys.argv) > 4 and sys.argv[4] == 'berries'
if berries:
    IDS = set(range(133,143)) | set(range(153,159)) | set(range(168,175))

def display(name):
    return re.sub(r'(?<=[a-z])(?=[A-Z0-9])', ' ', name.replace('_', ' · ')).replace('Pokemon', 'Pokémon').replace('Mt ', 'Mt. ').replace('SSAnne', 'S.S. Anne')

rows = []
for root, game in zip(map(Path, sys.argv[1:]), ['Emerald','Ruby / Sapphire','FireRed / LeafGreen']):
    constants_text = (root / 'include/constants/items.h').read_text()
    constants = {key:int(value) for key,value in re.findall(r'#define\s+(ITEM_\w+)\s+(\d+)\b', constants_text)}
    if not constants:
        enum = re.sub(r'//[^\n]*', '', constants_text.split('enum {',1)[1].split('};',1)[0])
        constants = {key:i for i,key in enumerate(re.findall(r'\bITEM_\w+\b',enum))}
    for key, alias in re.findall(r'#define\s+(ITEM_\w+)\s+(ITEM_\w+)\b', constants_text):
        if alias in constants:
            constants[key] = constants[alias]
    tm_path = root / 'include/constants/tms_hms.h'
    if tm_path.exists():
        tm_text = tm_path.read_text()
        for prefix, base in [('TM',289),('HM',339)]:
            block = tm_text.split('define FOREACH_'+prefix+'(F)',1)[1].split('\n\n',1)[0]
            constants.update({'ITEM_'+prefix+'_'+name:base+i for i,name in enumerate(re.findall(r'F\((\w+)\)',block))})
    ball_path = root / ('data/item_ball_scripts.inc' if game == 'Ruby / Sapphire' else 'data/scripts/item_ball_scripts.inc')
    balls = {label:constants.get(item) for label,item in re.findall(r'(\w+)::[^\n]*\n\s*finditem\s+(ITEM_\w+)',ball_path.read_text(encoding='latin1'))}
    found = {}
    shops = {}
    gifts = {}
    trees = {}
    if berries and game != 'FireRed / LeafGreen':
        new_game = (root / 'data/scripts/new_game.inc').read_text(encoding='latin1')
        trees = {key:constants[item] for key,item in re.findall(r'setberrytree\s+(\w+),\s*ITEM_TO_BERRY\((ITEM_\w+)\)',new_game) if constants.get(item) in IDS}
    renewable_path = root / 'src/renewable_hidden_items.c'
    renewable = set(re.findall(r'HIDDEN_ID\((FLAG_\w+)\)',renewable_path.read_text())) if renewable_path.exists() else set()
    for path in sorted((root / 'data/maps').glob('*/map.json')):
        area = json.loads(path.read_text())
        if 'UNUSED' in area['id']:
            continue
        area_name = display(area['name'])
        underwater = re.fullmatch(r'MAPSEC_UNDERWATER_(\d+)',area.get('region_map_section',''))
        if underwater:
            area_name = 'Underwater Route '+underwater[1]
            # Ruby/Sapphire's Underwater2 has a stale Route 125 map section,
            # but its surface warp leads to Route 126.
            if game == 'Ruby / Sapphire' and area['id'] == 'MAP_UNDERWATER2':
                area_name = 'Underwater Route 126'
        area_game = game
        if game == 'Ruby / Sapphire' and area['name'].startswith('MagmaHideout'):
            area_game = 'Ruby'
        if game == 'Ruby / Sapphire' and area['name'].startswith('AquaHideout'):
            area_game = 'Sapphire'
        for event in area.get('object_events',[]) + area.get('bg_events',[]):
            item = constants.get(event.get('item')) if event.get('type') == 'hidden_item' else balls.get(event.get('script'))
            tree_item = trees.get(event.get('trainer_sight_or_berry_tree_id')) if 'BERRY_TREE' in event.get('graphics_id','') else None
            if tree_item:
                found.setdefault((tree_item,area_game,'tree'),[]).append({'map':area['id'],'location':area_name,'x':event.get('x'),'y':event.get('y')})
            if item in IDS:
                kind = 'renewable' if event.get('flag') in renewable else 'field'
                found.setdefault((item,area_game,kind),[]).append({'map':area['id'],'location':area_name,'x':event.get('x'),'y':event.get('y'),'hidden':event.get('type')=='hidden_item'})
        script_path = path.with_name('scripts.inc')
        if script_path.exists():
            script = script_path.read_text(encoding='latin1')
            if machines and not area['name'].endswith('TrickHouseEntrance'):
                for key in re.findall(r'\bgiveitem(?:_msg)?\s+[^\n]*?\b(ITEM_(?:TM|HM)\w+)\b',script):
                    if constants.get(key) in IDS:
                        gifts.setdefault(constants[key],set()).add(area_name)
            for label in re.findall(r'\bpokemart\s+(\w+)',script):
                block = re.search(r'\b'+label+r'::?[^\n]*\n(.*?)(?=\n\s*(?:\.2byte ITEM_NONE|pokemartlistend))',script,re.S)
                if not block:
                    continue
                for key in re.findall(r'\.2byte\s+(ITEM_\w+)',block[1]):
                    if constants.get(key) in IDS:
                        shops.setdefault(constants[key],set()).add(display(area['name']))
    for (item,item_game,kind), pickups in sorted(found.items()):
        rows.append({'item':item,'game':item_game,'kind':kind,'locations':sorted({p['location'] for p in pickups}),'pickups':pickups})
    for item, locations in sorted(shops.items()):
        rows.append({'item':item,'game':game,'kind':'shop','locations':sorted(locations)})
    for item, locations in sorted(gifts.items()):
        for location in sorted(locations):
            rows.append({'item':item,'game':game,'kind':'gift','locations':[location]})
export_name = 'machineMapSources' if machines else 'pokeBallMapSources' if pokeballs else 'miscItemMapSources' if misc else 'berryItemMapSources' if berries else 'utilityItemMapSources'
target = Path('src/data/' + export_name + '.js')
target.write_text('// Generated from pret Gen 3 map events, initial trees and shop scripts.\nexport const '+export_name+' = '+json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(f'{len(rows)} field/shop sources written')
