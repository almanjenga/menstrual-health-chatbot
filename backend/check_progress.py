import pandas as pd

df = pd.read_csv('menstrual_data_sw.csv')
translated = df['answer_sw'].notna().sum()
print(f"Currently translated: {translated} rows")
print(f"Total rows in file: {len(df)}")
print(f"Progress: {translated}/{len(df)} ({translated*100//len(df)}%)")

# Find the last translated row
last_translated = 0
for i in range(len(df)-1, -1, -1):
    if pd.notna(df.iloc[i]['answer_sw']) and str(df.iloc[i]['answer_sw']).strip():
        last_translated = i
        break

print(f"Last translated row index: {last_translated}")
print(f"Ready to build index with {translated} rows")

