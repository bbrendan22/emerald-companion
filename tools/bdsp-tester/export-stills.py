"""Export and validate the first frame of every downloaded BDSP animation."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
from PIL import Image, ImageChops

source = Path.home() / 'Downloads/bdsp-assets'
output = Path(__file__).resolve().parent / 'stills'
variants = ('front', 'back', 'front_shiny', 'back_shiny')

def export(item):
    variant, dex = item
    original = source / variant / f'{dex}.webp'
    with Image.open(original) as image:
        image.seek(0)
        frame = image.convert('RGBA')
    png = output / 'png' / variant / f'{dex}.png'
    webp = output / 'webp' / variant / f'{dex}.webp'
    png.parent.mkdir(parents=True, exist_ok=True)
    webp.parent.mkdir(parents=True, exist_ok=True)
    frame.save(png, optimize=True)
    frame.save(webp, lossless=True, exact=True, method=4)
    for path in (png, webp):
        with Image.open(path) as check:
            check.load()
            assert check.n_frames == 1, path
            assert check.size == frame.size, path
            assert ImageChops.difference(frame, check.convert('RGBA')).getbbox(alpha_only=False) is None, path
    return dict(variant=variant, dex=dex, width=frame.width, height=frame.height,
                png_bytes=png.stat().st_size, webp_bytes=webp.stat().st_size)

if __name__ == '__main__':
    items = [(v, dex) for v in variants for dex in range(1, 387)]
    report = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row in pool.map(export, items):
            report.append(row)
            if len(report) % 100 == 0:
                print(f'Exported and verified {len(report)}/1544', flush=True)
    (output / 'report.json').write_text(json.dumps(report, indent=2))
    print(f'Complete: {len(report)} PNGs + {len(report)} static WebPs', flush=True)
    for kind in ('png', 'webp'):
        print(f'{kind.upper()}: {sum(r[kind + "_bytes"] for r in report)/1048576:.1f} MiB', flush=True)
