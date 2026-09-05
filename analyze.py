import pandas as pd
import json

df = pd.read_excel('SIH_2026_Problem_Statements.xlsx')

# Filter for Software
df = df[df['Category'] == 'Software']

def parse_count(x):
    try:
        if isinstance(x, str):
            return int(x.split('/')[0])
        return int(x)
    except:
        return 0

df['SubmissionCount'] = df['Submitted Idea(s) Count'].apply(parse_count)

# Sort by lowest submission count to find less crowded PS
df = df.sort_values('SubmissionCount')

def get_top(theme, n=5):
    sub = df[df['Theme'] == theme].head(n)
    return sub.to_dict('records')

results = {
    'Smart Education': get_top('Smart Education'),
    'Smart Automation': get_top('Smart Automation'),
    'MedTech / BioTech / HealthTech': get_top('MedTech / BioTech / HealthTech'),
    'Blockchain & Cybersecurity': get_top('Blockchain & Cybersecurity')
}

with open('sih_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
