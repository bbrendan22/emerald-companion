"""Create local comparison assets, preserving the source animation loop duration."""
from pathlib import Path
from PIL import Image
import sys

profile = sys.argv[1] if len(sys.argv) > 1 else "optimized"
profiles = {"balanced20": (256, 20), "light": (256, 8), "optimized": (320, 12), "smooth256": (256, None), "smooth320": (320, None)}
size, fps = profiles[profile]

source = Path.home() / 'Downloads/bdsp-assets'
output = Path(__file__).parent / profile
for folder in ('back_shiny', 'front_shiny'):
    for dex in (92, 324):
        original = source / folder / f'{dex}.webp'
        image = Image.open(original)
        still = Path(__file__).parent / "still" / folder / f"{dex}.webp"
        still.parent.mkdir(parents=True, exist_ok=True)
        image.seek(0)
        image.convert("RGBA").save(still, quality=85, method=4)
        assert Image.open(still).n_frames == 1
        frames, durations = [], []
        elapsed = 0
        next_sample = 0
        # Preserve all frames for smooth profiles; sample only low-frame-rate profiles.
        for index in range(image.n_frames):
            image.seek(index)
            image.load()
            duration = image.info.get('duration', 100)
            if profile == 'balanced20':
                while next_sample < elapsed + duration:
                    if frames:
                        durations.append(next_sample - sum(durations))
                    frames.append(image.convert('RGBA').resize((size, size), Image.Resampling.LANCZOS))
                    next_sample += 50
            elif fps is None or elapsed >= next_sample or not frames:
                if frames:
                    durations.append(elapsed - sum(durations))
                frames.append(image.convert('RGBA').resize((size, size), Image.Resampling.LANCZOS))
                next_sample = elapsed + 1000 / fps if fps else elapsed
            elapsed += duration
        durations.append(elapsed - sum(durations))
        target = output / folder / f'{dex}.webp'
        target.parent.mkdir(parents=True, exist_ok=True)
        frames[0].save(target, save_all=True, append_images=frames[1:], duration=durations,
                       loop=0, quality=75, method=4, minimize_size=True)
        check = Image.open(target)
        total = 0
        actual_durations = []
        for index in range(check.n_frames):
            check.seek(index)
            check.load()
            total += check.info['duration']
            actual_durations.append(check.info['duration'])
        assert check.size == (size, size) and total == elapsed
        if profile == 'balanced20':
            assert all(d == 50 for d in actual_durations[:-1])
            assert 0 < actual_durations[-1] <= 50
        if fps is None:
            assert check.n_frames == image.n_frames
            assert actual_durations == durations
        print(f'{folder}/{dex}: {image.n_frames} → {check.n_frames} frames; '
              f'{original.stat().st_size / 1048576:.2f} → {target.stat().st_size / 1048576:.2f} MB; {total} ms', flush=True)
