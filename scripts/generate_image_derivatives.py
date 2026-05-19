#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path
from tempfile import mkstemp

from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
DERIVATIVE_SUFFIXES = ("_low", "_ultra_low")
SOURCE_WEBP_QUALITY = 75


@dataclass(frozen=True)
class Variant:
    suffix: str
    scale: float
    quality: int


VARIANTS = (
    Variant("_ultra_low.webp", 0.10, 30),
    Variant("_low.webp", 0.30, 75),
)


def is_source_image(path: Path) -> bool:
    return (
        path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and not path.stem.endswith(DERIVATIVE_SUFFIXES)
    )


def derived_path(source: Path, suffix: str) -> Path:
    return source.with_name(f"{source.stem}{suffix}")


def resize_dimensions(size: tuple[int, int], scale: float) -> tuple[int, int]:
    width, height = size
    return max(1, round(width * scale)), max(1, round(height * scale))


def save_webp(image: Image.Image, target: Path, quality: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = mkstemp(suffix=".webp", dir=target.parent)
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        image.save(
            temp_path,
            format="WEBP",
            quality=quality,
            method=6,
            optimize=True,
        )
        temp_path.replace(target)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def normalize_source_image(source: Path, image: Image.Image) -> Path:
    if source.suffix.lower() == ".webp":
        return source

    target = source.with_suffix(".webp")
    save_webp(image, target, SOURCE_WEBP_QUALITY)
    source.unlink()
    return target


def remove_existing_derivatives(source: Path) -> None:
    for variant in VARIANTS:
        target = derived_path(source, variant.suffix)
        if target.exists():
            target.unlink()


def generate_for_source(source: Path) -> None:
    try:
        with Image.open(source) as image:
            original = image.copy()
    except UnidentifiedImageError:
        return

    normalized_source = normalize_source_image(source, original)
    remove_existing_derivatives(normalized_source)

    for variant in VARIANTS:
        target = derived_path(normalized_source, variant.suffix)
        resized = original.copy()
        resized = resized.resize(
            resize_dimensions(resized.size, variant.scale),
            Image.Resampling.LANCZOS,
        )
        save_webp(resized, target, variant.quality)


def find_sources() -> list[Path]:
    return sorted(
        (path for path in ASSETS.rglob("*") if is_source_image(path)),
        key=lambda path: path.as_posix().casefold(),
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Normalize source images to WebP and generate low and ultra-low "
            "WebP derivatives for catalog images."
        )
    )
    parser.parse_args()

    sources = find_sources()
    for source in sources:
        generate_for_source(source)

    print(f"Processed {len(sources)} source images.")
    print(f"Generated {len(sources) * len(VARIANTS)} derivative images.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
