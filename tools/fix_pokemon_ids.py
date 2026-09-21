"""Reconcile pokemon-species.json ids with PokeAPI.

Every entry's `id` is the PokeAPI *pokemon* id: the national dex number for
base species, and the 10000+ form id for alternate forms (megas, regional
forms, Gigantamax, Therian, ...). Many of those form ids had drifted to 0
(which renders the "?" placeholder sprite), so this script maps each key to
its PokeAPI name, looks the id up in one `/pokemon?limit=100000` request and
writes any corrections back.

Run with the checked-in venv:  .venv/Scripts/python.exe tools/fix_pokemon_ids.py
"""

import json
import os

import requests

# Manual overrides for keys whose PokeAPI name can't be derived by the generic
# prefix/suffix rules below (apostrophes, "breed" suffixes, renamed forms, ...).
SPECIAL_CASES = {
    "g-mr. mime": "mr-mime-galar",
    "g-farfetch'd": "farfetchd-galar",
    "m-mewtwo x": "mewtwo-mega-x",
    "m-mewtwo y": "mewtwo-mega-y",
    "p-tauros": "tauros-paldea-combat-breed",
    "p-tauros-b": "tauros-paldea-blaze-breed",
    "p-tauros-a": "tauros-paldea-aqua-breed",
    "p-kyogre": "kyogre-primal",
    "p-groudon": "groudon-primal",
    "basculin-w": "basculin-white-striped",
    "darmanitan-z": "darmanitan-zen",
    "g-darmanitan": "darmanitan-galar-standard",
    "g-darmanitan-z": "darmanitan-galar-zen",
    "zygarde-10": "zygarde-10",
    "lycanroc-m": "lycanroc-midnight",
    "lycanroc-d": "lycanroc-dusk",
    "wishiwashi-s": "wishiwashi-school",
    "necrozma-s": "necrozma-dusk",
    "necrozma-l": "necrozma-dawn",
    "u-necrozma": "necrozma-ultra",
    "zacian-cs": "zacian-crowned",
    "zamazenta-cs": "zamazenta-crowned",
    "urshifu-rss": "urshifu-rapid-strike",
    "urshifu-sss": "urshifu-single-strike",
    "calyrex-ir": "calyrex-ice",
    "calyrex-sr": "calyrex-shadow",
    "gx-urshifu-sss": "urshifu-single-strike-gmax",
    "gx-urshifu-rss": "urshifu-rapid-strike-gmax",
    "gx-toxtricity": "toxtricity-amped-gmax",
    "gx-eternatus": "eternatus-eternamax",
    "deoxys-a": "deoxys-attack",
    "deoxys-d": "deoxys-defense",
    "deoxys-s": "deoxys-speed",
    "giratina-o": "giratina-origin",
    "shaymin-s": "shaymin-sky",
    "aegislash-b": "aegislash-blade",
    "b-kyurem": "kyurem-black",
    "w-kyurem": "kyurem-white",
    "keldeo-r": "keldeo-resolute",
    "meloetta-p": "meloetta-pirouette",
    "hoopa-u": "hoopa-unbound",
    "zygarde-c": "zygarde-complete",
    "indeedee-f": "indeedee-female",
    "oinkologne-f": "oinkologne-female",
    "basculegion-f": "basculegion-female",
    "palafin-h": "palafin-hero",
    "h-rotom": "rotom-heat",
    "w-rotom": "rotom-wash",
    "f-rotom": "rotom-frost",
    "fan-rotom": "rotom-fan",
    "m-rotom": "rotom-mow",
    "ash-greninja": "greninja-ash",
    "missingno": None,
}


def get_pokeapi_name(json_key):
    """Converts a pokemon-species.json key to a PokeAPI pokemon name."""
    name = json_key.lower()
    if name in SPECIAL_CASES:
        return SPECIAL_CASES[name]

    # PokeAPI drops spaces, periods and apostrophes from species names.
    name = name.replace(" ", "-").replace(".", "").replace("'", "")

    if name.startswith("g-"):
        return name[2:] + "-galar"
    if name.startswith("a-"):
        return name[2:] + "-alola"
    if name.startswith("h-"):
        return name[2:] + "-hisui"
    if name.startswith("p-") and "tauros" not in name:
        return name[2:] + "-paldea"
    if name.startswith("gx-"):
        return name[3:] + "-gmax"
    if name.startswith("m-"):
        return name[2:] + "-mega"
    if name.endswith("-t"):
        return name[:-2] + "-therian"
    if name.endswith("-o"):
        return name[:-2] + "-origin"

    return name


def fetch_pokemon_ids():
    """Returns a {pokeapi name: pokemon id} map in a single API request."""
    response = requests.get("https://pokeapi.co/api/v2/pokemon", params={"limit": 100000}, timeout=60)
    response.raise_for_status()
    return {
        entry["name"]: int(entry["url"].rstrip("/").rsplit("/", 1)[-1])
        for entry in response.json()["results"]
    }


def fix_pokemon_ids():
    script_dir = os.path.dirname(__file__)
    json_path = os.path.join(script_dir, "..", "public", "data", "pokemon-species.json")

    with open(json_path, "r", encoding="utf-8") as f:
        pokemon_data = json.load(f)

    print("Loaded %d Pokemon from JSON." % len(pokemon_data))
    pokeapi_ids = fetch_pokemon_ids()
    print("Fetched %d PokeAPI pokemon names." % len(pokeapi_ids))

    updated = 0
    unmatched = []
    for key, data in pokemon_data.items():
        pokeapi_name = get_pokeapi_name(key)
        if not pokeapi_name:
            continue
        new_id = pokeapi_ids.get(pokeapi_name)
        if new_id is None:
            unmatched.append(key)
            continue
        if data.get("id") != new_id:
            print("  %-28s %5s -> %d  (%s)" % (key, data.get("id"), new_id, pokeapi_name))
            data["id"] = new_id
            updated += 1

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(pokemon_data, f, indent=2)

    print("\nUpdated %d ids." % updated)
    if unmatched:
        print("No PokeAPI name for %d keys: %s" % (len(unmatched), ", ".join(unmatched)))


if __name__ == "__main__":
    fix_pokemon_ids()
