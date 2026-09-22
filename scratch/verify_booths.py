import json

with open(r'd:\Projects\EXHIBITION\src\data\booths.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

booths = data['booths']
assert len(booths) == 254, f"Expected 254 booths, found {len(booths)}"

tent_a = [b for b in booths if b['tent'] == 'tent-a']
tent_b = [b for b in booths if b['tent'] == 'tent-b']
assert len(tent_a) == 146, f"Expected 146 in Tent A, got {len(tent_a)}"
assert len(tent_b) == 108, f"Expected 108 in Tent B, got {len(tent_b)}"

# Verify Tent A is in South (y >= 50 and y <= 80)
for b in tent_a:
    assert 50 <= b['y'] <= 80, f"Tent A booth {b['id']} y={b['y']} outside [50, 80]"

# Verify Tent B is in North (y >= 10 and y <= 40)
for b in tent_b:
    assert 10 <= b['y'] <= 40, f"Tent B booth {b['id']} y={b['y']} outside [10, 40]"

# Verify tent metadata
tent_meta = {t['id']: t for t in data['tents']}
assert tent_meta['tent-a']['z'] == 50, f"Tent A metadata z should be 50, got {tent_meta['tent-a']['z']}"
assert tent_meta['tent-b']['z'] == 10, f"Tent B metadata z should be 10, got {tent_meta['tent-b']['z']}"

print("PASS: Booth manifest verified successfully with correct swapped coordinates!")
