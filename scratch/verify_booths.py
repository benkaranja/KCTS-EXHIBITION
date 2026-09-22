import json

with open(r'd:\Projects\EXHIBITION\src\data\booths.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

booths = data['booths']
assert len(booths) == 254, f"Expected 254 booths, found {len(booths)}"

tent_a = [b for b in booths if b['tent'] == 'tent-a']
tent_b = [b for b in booths if b['tent'] == 'tent-b']
assert len(tent_a) == 146, f"Expected 146 in Tent A, got {len(tent_a)}"
assert len(tent_b) == 108, f"Expected 108 in Tent B, got {len(tent_b)}"

# Verify Tent A is in South, touching Tent B (y >= 40 and y <= 70)
for b in tent_a:
    assert 40 <= b['y'] <= 70, f"Tent A booth {b['id']} y={b['y']} outside [40, 70]"

# Verify Tent B is in North (y >= 10 and y <= 40)
for b in tent_b:
    assert 10 <= b['y'] <= 40, f"Tent B booth {b['id']} y={b['y']} outside [10, 40]"

# Verify tent metadata: tents touch at z=40
tent_meta = {t['id']: t for t in data['tents']}
assert tent_meta['tent-b']['z'] == 10 and tent_meta['tent-b']['length'] == 30, "Tent B must be z=10, len=30"
assert tent_meta['tent-a']['z'] == 40 and tent_meta['tent-a']['length'] == 30, "Tent A must be z=40, len=30"

print("PASS: Verified tents are adjacent with shared boundary at z=40 and no gap!")
