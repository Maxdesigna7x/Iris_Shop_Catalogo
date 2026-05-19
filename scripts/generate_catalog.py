#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "catalog-data.json"
JS_OUTPUT = ROOT / "catalog-data.js"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
PIEZAS_DIR = ASSETS / "piezas"
RESERVED_DIRS = {"hero", "people", "piezas"}


def is_image(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def title_from_name(name: str) -> str:
    return " ".join(name.replace("-", "_").split("_")).strip()


def sort_key(path: Path) -> list[object]:
    parts = []
    value = path.stem if path.is_file() else path.name
    token = ""
    for char in value:
        if char.isdigit():
            if token and not token[-1].isdigit():
                parts.append(token.casefold())
                token = ""
            token += char
        else:
            if token and token[-1].isdigit():
                parts.append(int(token))
                token = ""
            token += char
    if token:
        parts.append(int(token) if token.isdigit() else token.casefold())
    return parts


def item_from_image(path: Path) -> dict[str, str]:
    return {
        "name": title_from_name(path.stem).upper(),
        "src": path.relative_to(ROOT).as_posix(),
    }


def read_message(folder: Path) -> str:
    message_file = folder / "message.txt"
    if not message_file.exists():
        return ""
    return message_file.read_text(encoding="utf-8").strip()


def load_reviews() -> list[dict[str, object]]:
    reviews_file = ASSETS / "reviews.json"
    if not reviews_file.exists():
        return []

    reviews = json.loads(reviews_file.read_text(encoding="utf-8"))
    people = {
        image.stem.casefold(): image.relative_to(ROOT).as_posix()
        for image in sorted((ASSETS / "people").glob("*"))
        if is_image(image)
    }

    normalized = []
    for review in reviews:
        person = str(review.get("person", "")).strip()
        normalized.append(
            {
                "person": person,
                "location": str(review.get("location", "")).strip(),
                "review": str(review.get("review", "")).strip(),
                "stars": int(review.get("stars", 5)),
                "image": people.get(person.casefold(), ""),
            }
        )
    return normalized


def load_categories() -> list[dict[str, object]]:
    if not PIEZAS_DIR.exists():
        return []

    categories = []
    for folder in sorted((item for item in PIEZAS_DIR.iterdir() if item.is_dir()), key=sort_key):
        images = [
            item_from_image(image)
            for image in sorted(folder.glob("*"), key=sort_key)
            if is_image(image)
        ]
        if not images:
            continue

        categories.append(
            {
                "id": folder.name,
                "title": title_from_name(folder.name).upper(),
                "icon": images[0]["src"],
                "items": images,
            }
        )
    return categories


def main() -> None:
    hero_dir = ASSETS / "hero"
    hero_images = [
        item_from_image(image)
        for image in sorted(hero_dir.glob("*"), key=sort_key)
        if is_image(image)
    ]

    sections = []
    for folder in sorted(ASSETS.iterdir(), key=sort_key):
        if not folder.is_dir() or folder.name in RESERVED_DIRS:
            continue

        images = [
            item_from_image(image)
            for image in sorted(folder.glob("*"), key=sort_key)
            if is_image(image)
        ]
        if not images:
            continue

        sections.append(
            {
                "id": folder.name,
                "title": title_from_name(folder.name).upper(),
                "message": read_message(folder),
                "items": images,
            }
        )

    data = {
        "hero": hero_images,
        "categories": load_categories(),
        "sections": sections,
        "reviews": load_reviews(),
    }

    json_payload = json.dumps(data, ensure_ascii=False, indent=2)
    OUTPUT.write_text(json_payload + "\n", encoding="utf-8")
    JS_OUTPUT.write_text(f"window.CATALOG_DATA = {json_payload};\n", encoding="utf-8")


if __name__ == "__main__":
    main()
