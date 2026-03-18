import json
import requests
from bs4 import BeautifulSoup
import re
import os
import concurrent.futures
import time

def to_camel_case(s):
    s = re.sub(r"(_|-)+", " ", s).title().replace(" ", "")
    return s[0].lower() + s[1:]

def scrape_pokemon(pokemon_info):
    pokemon_name_key, pokemon_name, possible_moves, total_pokemon, current_pokemon_index = pokemon_info
    
    url_pokemon_name = pokemon_name.lower().replace(' ', '').replace('.', '').replace("'", "")
    if "nidoran" in url_pokemon_name:
        if "♀" in pokemon_name or 'f' in pokemon_name:
             url_pokemon_name = "nidoranf"
        else:
             url_pokemon_name = "nidoranm"

    urls_to_try = [
        f'https://www.serebii.net/pokedex-sv/{url_pokemon_name}',
        f'https://www.serebii.net/pokedex-swsh/{url_pokemon_name}'
    ]
    
    response = None
    for url in urls_to_try:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                break
            elif response.status_code == 404:
                response = None
                continue
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"An error occurred while fetching {url}: {e}")
            response = None
            continue
    
    if not response:
        return (pokemon_name_key, None, set(), pokemon_name)

    soup = BeautifulSoup(response.content, 'html.parser')
    learnset = []
    moves_not_found_for_pokemon = set()
    
    headers = soup.find_all('h3')
    level_up_header = None
    for header in headers:
        if 'Level Up' in header.text:
            level_up_header = header
            break
    
    if level_up_header:
        table = level_up_header.find_previous('table', {'class': 'dextable'})
        if table:
            rows = table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td')
                if len(cols) > 1 and cols[0].get_text(strip=True) and cols[1].find('a'):
                    level_str = str(cols[0].contents[0]).strip()
                    move_name_raw = cols[1].find('a').get_text(strip=True)
                    
                    try:
                        level = int(level_str)
                    except ValueError:
                        level = 1

                    move_name_camel = to_camel_case(move_name_raw)

                    if move_name_camel in possible_moves:
                        learnset.append([level, move_name_camel])
                    else:
                        moves_not_found_for_pokemon.add(move_name_raw)
    
    if learnset:
        print(f"[{current_pokemon_index}/{total_pokemon}] Scraped {len(learnset)} moves for {pokemon_name}")
        return (pokemon_name_key, sorted(learnset, key=lambda x: x[0]), moves_not_found_for_pokemon, None)
    else:
        print(f"[{current_pokemon_index}/{total_pokemon}] No level up moves found for {pokemon_name}")
        return (pokemon_name_key, None, moves_not_found_for_pokemon, pokemon_name if not level_up_header else None)

def main():
    start_time = time.time()
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    species_path = os.path.join(project_root, 'public', 'data', 'pokemon-species.json')
    with open(species_path, 'r') as f:
        pokemon_species = json.load(f)

    moves_path = os.path.join(project_root, 'public', 'data', 'possible-moves.json')
    with open(moves_path, 'r') as f:
        possible_moves = json.load(f)

    output_path = os.path.join(project_root, 'public', 'data', 'possible-learnsets.json')

    pokemon_learnsets = {}
    if os.path.exists(output_path):
        with open(output_path, 'r') as f:
            pokemon_learnsets = json.load(f)

    pokemon_to_scrape = []
    pokemon_species_keys = list(pokemon_species.keys())
    total_pokemon = len(pokemon_species_keys)

    for i, pokemon_name_key in enumerate(pokemon_species_keys):
        if pokemon_name_key not in pokemon_learnsets:
            pokemon_to_scrape.append((pokemon_name_key, pokemon_species[pokemon_name_key]['name'], possible_moves, total_pokemon, i + 1))

    if not pokemon_to_scrape:
        print("All Pokémon have already been scraped.")
        return

    moves_not_found = set()
    pokemon_not_found = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_pokemon = {executor.submit(scrape_pokemon, p_info): p_info for p_info in pokemon_to_scrape}
        
        for i, future in enumerate(concurrent.futures.as_completed(future_to_pokemon)):
            pokemon_name_key, learnset, moves_not_found_for_pokemon, not_found_name = future.result()
            
            if learnset:
                pokemon_learnsets[pokemon_name_key] = learnset
            
            if not_found_name:
                pokemon_not_found.append(not_found_name)

            moves_not_found.update(moves_not_found_for_pokemon)
            
            if (i + 1) % 10 == 0:
                with open(output_path, 'w') as f:
                    print(f"\n--- Saving progress ({len(pokemon_learnsets)}/{total_pokemon}) ---\n")
                    json.dump(pokemon_learnsets, f, indent=2)

    with open(output_path, 'w') as f:
        json.dump(pokemon_learnsets, f, indent=2)

    print("\n--- Scraping Report ---")
    if pokemon_not_found:
        print("\nPokemon not found on Serebii:")
        for pokemon in sorted(list(set(pokemon_not_found))):
            print(f"- {pokemon}")

    if moves_not_found:
        print("\nMoves not found in possible-moves.json:")
        for move in sorted(list(moves_not_found)):
            print(f"- {move}")
    
    if not pokemon_not_found and not moves_not_found:
        print("\nAll pokemon and moves were found successfully!")

    end_time = time.time()
    print(f"\nScript finished in {end_time - start_time:.2f} seconds.")

if __name__ == '__main__':
    main()
