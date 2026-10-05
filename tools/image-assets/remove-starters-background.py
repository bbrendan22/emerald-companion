from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[2]
source = Image.open(root / 'public/home/pokedex/gen1_starters.png').convert('RGBA')
w, h = source.size
pixels = source.load()
mask = Image.new('L', source.size)
marked = mask.load()
queue = deque()

def background(x, y):
    r, g, b, _ = pixels[x, y]
    return min(r, g, b) >= 225 and max(r, g, b) - min(r, g, b) <= 24

for x in range(w):
    queue.extend(((x, 0), (x, h - 1)))
for y in range(h):
    queue.extend(((0, y), (w - 1, y)))
while queue:
    x, y = queue.popleft()
    if not (0 <= x < w and 0 <= y < h) or marked[x, y] or not background(x, y):
        continue
    marked[x, y] = 255
    queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

# Feather only near the removed background, preserving interior highlights.
near = mask.filter(ImageFilter.MaxFilter(3)).load()
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if marked[x, y]:
            pixels[x, y] = (r, g, b, 0)
        elif near[x, y] and min(r, g, b) > 190 and max(r, g, b) - min(r, g, b) < 28:
            alpha = min(1., max(.05, (255 - min(r, g, b)) / 65))
            rgb = tuple(round(max(0, min(255, (c - 255 * (1 - alpha)) / alpha))) for c in (r, g, b))
            pixels[x, y] = (*rgb, round(alpha * 255))
source.save(root / 'public/home/pokedex/gen1-starters-transparent.png')
preview = Image.new('RGBA', source.size, '#a6d3ac')
preview.alpha_composite(source)
preview.convert('RGB').save('/private/tmp/starters-transparency-preview.jpg')
print(f'Saved transparent PNG; removed {sum(v == 255 for v in mask.getdata())} background pixels.')
