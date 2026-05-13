from pathlib import Path
from PIL import Image, ImageOps


def run_debackx_placeholder(input_path: Path, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(input_path) as image:
        processed = ImageOps.autocontrast(image.convert("RGB"))
        processed.save(output_path)
