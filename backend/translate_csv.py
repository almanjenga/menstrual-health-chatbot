"""
Script to translate menstrual_data.csv from English to Swahili using Helsinki-NLP
This creates a bilingual dataset for better Swahili support
"""
import pandas as pd
from transformers import MarianMTModel, MarianTokenizer
import torch
import os
from tqdm import tqdm
import time
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Check if GPU is available
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load translation models
print("Loading translation models...")
try:
    # English to Swahili
    en_sw_tokenizer = MarianTokenizer.from_pretrained("Helsinki-NLP/opus-mt-en-sw")
    en_sw_model = MarianMTModel.from_pretrained("Helsinki-NLP/opus-mt-en-sw")
    en_sw_model.to(device)
    en_sw_model.eval()
    print("Loaded English -> Swahili model")
except Exception as e:
    print(f"Error loading models: {e}")
    print("Make sure you have transformers installed: pip install transformers")
    exit(1)

def translate_text(text, max_length=512):
    """Translate English text to Swahili"""
    if not text or pd.isna(text):
        return ""
    
    try:
        # Tokenize
        inputs = en_sw_tokenizer(
            text, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=max_length
        ).to(device)
        
        # Translate
        with torch.no_grad():
            translated = en_sw_model.generate(
                **inputs, 
                max_length=max_length,
                num_beams=4,
                early_stopping=True
            )
        
        # Decode
        swahili_text = en_sw_tokenizer.decode(translated[0], skip_special_tokens=True)
        return swahili_text
    except Exception as e:
        print(f"Translation error for text '{text[:50]}...': {e}")
        return text  # Return original if translation fails

def translate_csv(input_file="menstrual_data.csv", output_file="menstrual_data_sw.csv", batch_size=100, start_from=0):
    """Translate CSV file from English to Swahili"""
    
    print(f"Reading {input_file}...")
    df = pd.read_csv(input_file)
    total_rows = len(df)
    print(f"Found {total_rows} rows")
    
    # Create new dataframe for Swahili translations
    df_sw = df.copy()
    df_sw['question_sw'] = ""
    df_sw['answer_sw'] = ""
    
    # Translate in batches
    end_row = min(start_from + batch_size, total_rows)
    print(f"Translating rows {start_from} to {end_row}...")
    
    for idx in tqdm(range(start_from, end_row), desc="Translating"):
        # Translate question
        if pd.notna(df.iloc[idx]['question']):
            df_sw.at[idx, 'question_sw'] = translate_text(str(df.iloc[idx]['question']))
        
        # Translate answer
        if pd.notna(df.iloc[idx]['answer']):
            df_sw.at[idx, 'answer_sw'] = translate_text(str(df.iloc[idx]['answer']))
        
        # Save progress every 50 rows to prevent data loss
        if (idx - start_from) % 50 == 0 and idx > start_from:
            df_sw.to_csv(output_file, index=False)
            print(f"💾 Progress saved at row {idx}")
        
        # Small delay to avoid overwhelming the model
        if idx % 10 == 0:
            time.sleep(0.1)
    
    # Save progress (final save)
    df_sw.to_csv(output_file, index=False)
    print(f"✅ Saved translations to {output_file}")
    print(f"Translated {end_row - start_from} rows")
    
    return df_sw

if __name__ == "__main__":
    import sys
    
    # Allow resuming from a specific row
    start_row = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    print("=" * 60)
    print("Menstrual Data Translation Script")
    print("Using Helsinki-NLP/opus-mt-en-sw")
    print("=" * 60)
    
    # Check if output file exists (for resuming)
    output_file = "menstrual_data_sw.csv"
    if os.path.exists(output_file) and start_row == 0:
        response = input(f"{output_file} already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Exiting...")
            exit(0)
    
    # Translate
    translate_csv(
        input_file="menstrual_data.csv",
        output_file=output_file,
        batch_size=batch_size,
        start_from=start_row
    )
    
    print("\n" + "=" * 60)
    print("Translation complete!")
    print(f"To continue translating more rows, run:")
    print(f"python translate_csv.py {start_row + batch_size} {batch_size}")
    print("=" * 60)


