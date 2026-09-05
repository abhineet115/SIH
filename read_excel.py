import pandas as pd

df = pd.read_excel('SIH_2026_Problem_Statements.xlsx')
print(f"Total rows: {len(df)}")
print(f"Columns: {df.columns.tolist()}")

# Save full to CSV just in case
df.to_csv('SIH_2026_Problem_Statements.csv', index=False)

# Print a nice markdown summary of the problem statements
# Assuming standard SIH columns like 'Organization', 'Problem Statement Title', 'Description', 'Theme', etc.
with open('sih_summary.md', 'w', encoding='utf-8') as f:
    f.write(f"# SIH Problem Statements Analysis\n\n")
    f.write(f"Total statements: {len(df)}\n\n")
    for i, row in df.iterrows():
        f.write(f"## {i+1}. {row.get('Problem Statement Title', row.get('Title', 'No Title'))}\n")
        f.write(f"- **Organization:** {row.get('Organization', 'Unknown')}\n")
        f.write(f"- **Theme:** {row.get('Theme', 'Unknown')}\n")
        desc = str(row.get('Description', 'No Description'))
        if len(desc) > 300:
            desc = desc[:300] + "..."
        f.write(f"- **Description:** {desc}\n\n")
