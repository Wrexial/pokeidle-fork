import json
import requests
import time
import os

def get_pokeapi_name(json_key):
    """
    Converts the JSON key from pokemon-species.json to a name that PokeAPI can understand.
    This requires handling many special cases for alternate forms.
    """
    name = json_key.lower()

    # --- Manual overrides for tricky cases ---
    special_cases = {
        "g-mr. mime": "mr-mime-galar",
        "m-mewtwo x": "mewtwo-mega-x",
        "m-mewtwo y": "mewtwo-mega-y",
        "p-tauros-b": "tauros-paldea-blaze",
        "p-tauros-a": "tauros-paldea-aqua",
        "p-tauros": "tauros-paldea-combat",
        "basculin-w": "basculin-white-striped",
        "darmanitan-z": "darmanitan-zen",
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
        "calyrex-ir": "calyrex-ice-rider",
        "calyrex-sr": "calyrex-shadow-rider",
        "gx-urshifu-sss": "urshifu-single-strike-gmax",
        "gx-urshifu-rss": "urshifu-rapid-strike-gmax",
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
        "missingno": None
    }
    if name in special_cases:
        return special_cases[name]

    # --- General pattern-based replacements ---
    name = name.replace(" ", "-").replace(".", "")
    
    if name.startswith('g-'):
        return f"{name[2:]}-galar"
    if name.startswith('a-'):
        return f"{name[2:]}-alola"
    if name.startswith('h-'):
        return f"{name[2:]}-hisui"
    if name.startswith('p-') and 'tauros' not in name:
        return f"{name[2:]}-paldea"
    if name.startswith('m-'):
        return f"{name[2:]}-mega"
    if name.startswith('gx-'):
        return f"{name[3:]}-gmax"
    if name.endswith('-t'): # Therian forms (e.g., enamorus-t)
        return f"{name[:-2]}-therian"
    if name.endswith('-o'): # Origin forms (e.g., dialga-o)
        return f"{name[:-2]}-origin"

    # Default to the key itself if no rules match
    return name

def fix_pokemon_ids():
    # Construct the path relative to the script's location
    script_dir = os.path.dirname(__file__)
    json_path = os.path.join(script_dir, '..', 'public', 'data', 'pokemon-species.json')

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            pokemon_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {json_path}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not parse {json_path}. Is it valid JSON?")
        return
        
    print(f"Loaded {len(pokemon_data)} Pokémon from JSON.")
    
    for key, data in pokemon_data.items():
        # We target IDs that are 0, as per the issue.
        if data.get('id', -1) == 0:
            pokeapi_name = get_pokeapi_name(key)
            
            if not pokeapi_name:
                print(f"SKIPPING: '{key}' has no defined API mapping.")
                continue

            # Be respectful of the API rate limits
            time.sleep(0.05) 
            
            api_url = f"https://pokeapi.co/api/v2/pokemon-species/{pokeapi_name}/"
            
            try:
                response = requests.get(api_url)
                
                if response.status_code == 200:
                    api_data = response.json()
                    new_id = api_data['id']
                    pokemon_data[key]['id'] = new_id
                    print(f"SUCCESS: Updated '{key}' -> '{pokeapi_name}' to ID: {new_id}")
                else:
                    print(f"FAILED: Could not fetch data for '{key}' (using '{pokeapi_name}'). Status: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"ERROR: Network request failed for '{key}': {e}")

    # Write the updated data back to the file
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(pokemon_data, f, indent=2)
        print("\\n✅ Successfully updated pokemon-species.json with new IDs!")
    except IOError as e:
        print(f"\\nError writing to {json_path}: {e}")

if __name__ == '__main__':
    print("Starting Pokémon ID update process...")
    # You may need to install the 'requests' library first:
    # pip install requests
    fix_pokemon_ids()
