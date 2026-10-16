"""Normalize front stills using shared normal/shiny bounds; preserve all source files."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parent
source = root / 'stills/webp'
output = root / 'stills/normalized'
SIZE, EXTENT, BASELINE = 512, 435, 450

def normalize(dex):
    frames = []
    for variant in ('front', 'front_shiny'):
        with Image.open(source / variant / f'{dex}.webp') as image:
            frames.append(image.convert('RGBA'))
    bounds = [frame.getchannel('A').getbbox() for frame in frames]
    assert all(bounds), f'Empty artwork: {dex}'
    box = (min(b[0] for b in bounds), min(b[1] for b in bounds),
           max(b[2] for b in bounds), max(b[3] for b in bounds))
    scale = EXTENT / max(box[2] - box[0], box[3] - box[1])
    dimensions = (round((box[2] - box[0]) * scale), round((box[3] - box[1]) * scale))
    position = ((SIZE - dimensions[0]) // 2, BASELINE - dimensions[1])
    for variant, frame in zip(('front', 'front_shiny'), frames):
        artwork = frame.crop(box).resize(dimensions, Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (SIZE, SIZE))
        canvas.paste(artwork, position)
        destination = output / variant / f'{dex}.webp'
        destination.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(destination, lossless=True, exact=True, method=4)
        with Image.open(destination) as check:
            assert check.n_frames == 1 and check.size == (SIZE, SIZE)
            actual = check.getchannel('A').getbbox()
            assert actual and actual[0] > 0 and actual[1] > 0 and actual[2] < SIZE and actual[3] < SIZE
    return dict(dex=dex, source_bounds=bounds, shared_bounds=box,
                scale=scale, dimensions=dimensions, position=position)

if __name__ == '__main__':
    report = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row in pool.map(normalize, range(1, 387)):
            report.append(row)
            if len(report) % 50 == 0:
                print(f'Normalized and verified {len(report)}/386 pairs', flush=True)
    (output / 'report.json').write_text(json.dumps(report, indent=2))
    print(f'Complete: {len(report)*2} normalized front stills', flush=True)
