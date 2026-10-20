import json

data = json.load(open('data/processed/incidents.json'))
print(f'Total incidents: {len(data)}\n')

for inc in data:
    flag = '  <-- CHECK THIS' if inc['dominant_category'] == 'normal' and inc['priority_score'] > 50 else ''
    print(f"{inc['incident_id']}: {inc['dominant_category']:20s} sev={inc['max_severity']:3d} pri={inc['priority_score']:3d} -> {inc['recommended_action']}{flag}")