"""Create optional browser-sized derivatives; retain every original asset."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'dist'
assets = root / 'assets'
metadata = {}
created = 0
for source in sorted(assets.rglob('*.webp')):
    if 'responsive' in source.parts:
        continue
    relative = source.relative_to(assets).as_posix()
    with Image.open(source) as image:
        width, height = image.size
        variants = []
        for target in (480, 960, 1440):
            if width < target * 1.12:
                continue
            dest = assets / 'responsive' / relative
            dest = dest.with_name(f'{dest.stem}-{target}.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            resized = image.resize((target, round(height * target / width)), Image.Resampling.LANCZOS)
            resized.save(dest, 'WEBP', quality=86, method=6)
            # Avoid sending a larger derivative when an original is already efficient.
            if dest.stat().st_size < source.stat().st_size:
                variants.append([dest.relative_to(assets).as_posix(), target])
                created += 1
            else:
                dest.unlink()
        metadata[relative] = {'width': width, 'height': height, 'variants': variants}
(root / 'image-data.js').write_text('const imageMetadata=' + json.dumps(metadata, separators=(',', ':')) + ';\n', encoding='utf-8')
print(json.dumps({'originals': len(metadata), 'derivatives': created, 'metadataBytes': (root / 'image-data.js').stat().st_size}))
