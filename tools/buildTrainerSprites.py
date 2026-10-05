"""Export original Emerald trainer portraits from a local pret/pokeemerald checkout."""
import re
import sys
from pathlib import Path
from PIL import Image
source = Path(sys.argv[1])
output = Path(__file__).resolve().parent.parent / 'public/trainers'
output.mkdir(exist_ok=True)
graphics = (source / 'src/data/graphics/trainers.h').read_text()
paths = dict(re.findall(r'const u32 (gTrainerFrontPic_\w+)\[\] = INCGFX_U32\("([^"]+)"', graphics))
table = (source / 'src/data/trainer_graphics/front_pic_tables.h').read_text()
count = 0
for name, symbol in re.findall(r'TRAINER_SPRITE\((\w+),\s*(gTrainerFrontPic_\w+),', table):
    image = Image.open(source / paths[symbol])
    image.info['transparency'] = 0
    image.convert('RGBA').crop((0, 0, 64, 64)).save(output / f'{name.lower()}.png')
    count += 1
print(f'Exported {count} trainer portraits.')
