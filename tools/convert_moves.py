import json
import re
from bs4 import BeautifulSoup

def to_camel_case(name):
    # Remove special characters and prepare for camel case conversion
    name = name.replace("'", "")
    name = re.sub(r'[^a-zA-Z0-9]+', ' ', name)
    parts = name.strip().split(' ')
    if not parts:
        return ""
    # Convert to camelCase
    return parts[0].lower() + ''.join(x.title() for x in parts[1:])

def parse_moves_data(html_content):
    soup = BeautifulSoup(html_content, 'lxml')
    moves = {}
    
    table_body = soup.find('tbody')
    if not table_body:
        print("Could not find table body (tbody) in the HTML content.")
        return moves

    for row in table_body.find_all('tr'):
        cols = row.find_all('td')
        if len(cols) < 8:
            continue

        name_anchor = cols[0].find('a')
        if not name_anchor:
            continue
        name = name_anchor.text.strip()
        
        type_anchor = cols[1].find('a')
        if not type_anchor:
            continue
        move_type = type_anchor.text.strip()

        category_img = cols[2].find('img')
        category = "status"
        if category_img and 'alt' in category_img.attrs:
            category = category_img['alt'].lower()

        power = 0
        if cols[3].text.strip() != '—':
            power = int(cols[3].text.strip())

        accuracy = 0
        if cols[4].text.strip() not in ['—', '∞']:
            accuracy = int(cols[4].text.strip())
        elif cols[4].text.strip() == '∞':
            accuracy = 101  # Infinite accuracy

        pp = int(cols[5].text.strip()) if cols[5].text.strip() != '—' else 0
        
        description = cols[6].text.strip()
        effect_chance_str = cols[7].text.strip()
        effect_chance = 0
        if effect_chance_str and effect_chance_str != '—':
            effect_chance = int(effect_chance_str)

        # Priority
        priority = 0
        if "user attacks first" in description.lower() or "always goes first" in description.lower():
            priority = 1
        
        move_effect = None
        # Stat Changes
        if "raises" in description.lower() or "lowers" in description.lower():
            target = "self" if "user's" in description.lower() else "opponent"
            
            changes = {}
            if "sharply raises" in description.lower():
                stat_val = 2
            elif "raises" in description.lower():
                stat_val = 1
            elif "sharply lowers" in description.lower():
                stat_val = -2
            elif "lowers" in description.lower():
                stat_val = -1
            else:
                stat_val = 0

            if "attack" in description.lower():
                changes["attack"] = stat_val
            if "defense" in description.lower():
                changes["defense"] = stat_val
            if "special attack" in description.lower():
                changes["special-attack"] = stat_val
            if "special defense" in description.lower():
                changes["special-defense"] = stat_val
            if "speed" in description.lower():
                changes["speed"] = stat_val
            if "accuracy" in description.lower():
                changes["accuracy"] = stat_val
            if "evasiveness" in description.lower():
                changes["evasiveness"] = stat_val
            
            if changes:
                move_effect = {"type": "statChange", "target": target, "changes": changes}

        # Status effect
        if "may cause" in description.lower() or "may" in description.lower():
            status_effects = ["burn", "freeze", "paralysis", "poison", "sleep", "flinching"]
            for effect in status_effects:
                if effect in description.lower():
                    move_effect = {"type": "status", "status": effect}
                    break
        
        # HP Drain
        if "recovers half the hp" in description.lower():
            move_effect = {"type": "drain", "percentage": 50}

        camel_case_name = to_camel_case(name)
        if not camel_case_name:
            continue

        move_data = {
            "name": name,
            "type": move_type,
            "category": category,
            "power": power,
            "accuracy": accuracy,
            "pp": pp,
            "priority": priority
        }
        if move_effect:
            if effect_chance > 0:
                move_effect['chance'] = effect_chance
            elif "may" not in description.lower() and move_effect.get('type') in ['statChange', 'status']:
                move_effect['chance'] = 100
            move_data["effect"] = move_effect
        
        moves[camel_case_name] = move_data
    return moves

def main():
    input_file_path = 'RawMoveData'
    output_file_path = 'public/data/possible-moves.json'

    try:
        with open(input_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_file_path}")
        return
    except Exception as e:
        print(f"Error reading file: {e}")
        return
        
    moves_data = parse_moves_data(html_content)

    with open(output_file_path, 'w', encoding='utf-8') as f:
        json.dump(moves_data, f, indent=4)

    print(f"Successfully converted {len(moves_data)} moves and saved to {output_file_path}")

if __name__ == '__main__':
    main()
