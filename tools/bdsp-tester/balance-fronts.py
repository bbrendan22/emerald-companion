"""Balance visual area and centroid, with whole-silhouette fit limits and reviewed placement."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import math
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'stills/webp'
OUTPUT = ROOT / 'stills/balanced'
TARGET_AREA = 65000
AIRBORNE = set(json.loads((ROOT / 'artwork-placement.json').read_text())['airborne'])

def alpha_metrics(image):
    alpha = image.getchannel('A')
    histogram = alpha.histogram()
    area = sum(value * count for value, count in enumerate(histogram)) / 255
    weights_x = list(alpha.resize((512, 1), Image.Resampling.BOX).get_flattened_data())
    total = sum(weights_x)
    center_x = sum((x + .5) * weight for x, weight in enumerate(weights_x)) / total
    return alpha.getbbox(), area, center_x

def balance(dex):
    images = []
    for variant in ('front', 'front_shiny'):
        with Image.open(SOURCE / variant / f'{dex}.webp') as image:
            images.append(image.convert('RGBA'))
    metrics = [alpha_metrics(image) for image in images]
    bounds = [m[0] for m in metrics]
    box = (min(b[0] for b in bounds), min(b[1] for b in bounds), max(b[2] for b in bounds), max(b[3] for b in bounds))
    width, height = box[2] - box[0], box[3] - box[1]
    area = sum(m[1] for m in metrics) / 2
    center_x = sum(m[2] for m in metrics) / 2
    airborne = dex in AIRBORNE
    desired_scale = math.sqrt(TARGET_AREA / area)
    fit_scale = min(480 / width, (368 if airborne else 432) / height)
    scale = min(desired_scale, fit_scale)
    size = (round(width * scale), round(height * scale))
    lift = round(max(64, (432 - size[1]) * .45)) if airborne else 0
    baseline = 450 - lift
    x = round(max(16, min(512 - 16 - size[0], 256 - (center_x - box[0]) * scale)))
    y = baseline - size[1]
    for variant, image in zip(('front', 'front_shiny'), images):
        canvas = Image.new('RGBA', (512, 512))
        artwork = image.crop(box).resize(size, Image.Resampling.LANCZOS)
        canvas.paste(artwork, (x, y))
        target = OUTPUT / variant / f'{dex}.webp'
        target.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(target, lossless=True, exact=True, method=4)
        with Image.open(target) as check:
            check.load()
            assert check.n_frames == 1 and check.size == (512, 512)
            bounds = check.getchannel('A').getbbox()
            assert bounds[0] >= 15 and bounds[1] >= 17 and bounds[2] <= 497 and bounds[3] <= 451, (dex, bounds)
    ratio = area * scale ** 2 / TARGET_AREA
    return dict(dex=dex,scale=scale,position=[x,y],dimensions=size,airborne=airborne,
                area_ratio=round(ratio,3),limited=scale < desired_scale * .98,
                review=ratio < .65,source_bounds=box)

if __name__ == '__main__':
    rows = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row in pool.map(balance, range(1, 387)):
            rows.append(row)
            if len(rows) % 50 == 0:
                print(f'Balanced and validated {len(rows)}/386 pairs', flush=True)
    (OUTPUT / 'report.json').write_text(json.dumps(rows, indent=2))
    metadata = json.loads((ROOT.parents[1] / 'src/data/pokemonMeta.js').read_text().split('=', 1)[1].strip().rstrip(';'))
    names = {str(row['dex']): row['name'] for row in metadata.values()}
    audit = ROOT / 'sizing-audit'
    audit.mkdir(exist_ok=True)
    for start in range(1, 387, 36):
        sheet = Image.new('RGB', (900, 1020), '#101d2c')
        draw = ImageDraw.Draw(sheet)
        for n, dex in enumerate(range(start, min(start + 36, 387))):
            x, y = n % 6 * 150, n // 6 * 170
            draw.ellipse((x+12,y+124,x+138,y+138), outline='#3a617c')
            with Image.open(OUTPUT / 'front' / f'{dex}.webp') as image:
                image = image.convert('RGBA').resize((145,145), Image.Resampling.LANCZOS)
                sheet.paste(image,(x,y),image)
            row = rows[dex-1]
            draw.text((x+3,y+148), f'{dex} {names[str(dex)]}', fill='#ffcc80' if row['review'] else 'white')
            draw.text((x+3,y+160), f'{"air" if row["airborne"] else "ground"} {row["area_ratio"]:.0%}', fill='#9bb9cb')
        sheet.save(audit / f'balanced-{start:03}.jpg')
    flagged = [r['dex'] for r in rows if r['review']]
    print(f'Complete: {len(rows)*2} balanced stills. Silhouette-limited review: {flagged}', flush=True)
