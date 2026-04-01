import csv
import json

csv_path = '/Users/johnfriedman/Downloads/Takeout/Fitbit/Physical Activity_GoogleData/heart_rate_2026-04-01.csv'
js_path = '/Users/johnfriedman/.gemini/antigravity/scratch/hr_view/data.js'

data = []
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Format the time nicely if possible
        timestamp = row['timestamp']
        bpm = float(row['beats per minute'])
        source = row.get('data source', '')
        data.append({
            'timestamp': timestamp,
            'bpm': bpm,
            'source': source
        })

with open(js_path, 'w') as f:
    f.write('const heartRateData = ')
    json.dump(data, f)
    f.write(';')

print('Conversion complete!')
