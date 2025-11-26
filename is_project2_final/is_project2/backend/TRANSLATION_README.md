# Swahili Translation Setup Guide

This guide explains how to set up Helsinki-NLP translation for Swahili support in the chatbot.

## Overview

The system supports Swahili in two ways:
1. **Pre-translated CSV** (Recommended): Translate the entire CSV once, then use it directly
2. **Runtime Translation**: Translate on-the-fly when needed (slower but no pre-processing)

## Step 1: Install Dependencies

```bash
pip install transformers torch sentence-transformers
```

## Step 2: Translate the CSV (Option 1 - Recommended)

### Translate the entire CSV:
```bash
cd backend
python translate_csv.py
```

This will:
- Load Helsinki-NLP translation models
- Translate questions and answers to Swahili
- Save to `menstrual_data_sw.csv`

### Translate in batches (for large files):
```bash
# Translate first 100 rows
python translate_csv.py 0 100

# Continue from row 100, translate next 100
python translate_csv.py 100 100

# Continue until done
python translate_csv.py 200 100
# ... and so on
```

### Build Swahili FAISS Index:
After translating, build the index for faster retrieval:
```bash
python build_swahili_index.py
```

This creates:
- `embeddings_sw.npy` - Swahili embeddings
- `menstrual_index_sw.faiss` - Swahili FAISS index

## Step 3: Runtime Translation (Option 2 - Fallback)

If you don't have a pre-translated CSV, the system will:
1. Automatically load translation models on startup
2. Translate Swahili queries to English for retrieval
3. Translate retrieved English context to Swahili
4. Send to model for Swahili response generation

**Note**: Runtime translation is slower but works without pre-processing.

## How It Works

### With Pre-translated CSV:
1. User asks in Swahili: "ninahisi uchungu"
2. System searches in Swahili corpus using Swahili FAISS index
3. Retrieves Swahili context directly
4. Model generates response in Swahili

### With Runtime Translation:
1. User asks in Swahili: "ninahisi uchungu"
2. System translates query to English: "I feel pain"
3. Searches English FAISS index
4. Translates retrieved English context to Swahili
5. Model generates response in Swahili

## Files Created

- `menstrual_data_sw.csv` - Translated dataset (question_sw, answer_sw columns)
- `embeddings_sw.npy` - Swahili embeddings
- `menstrual_index_sw.faiss` - Swahili FAISS index
- `translation_utils.py` - Translation utilities
- `translate_csv.py` - CSV translation script
- `build_swahili_index.py` - Index building script

## Performance

- **Pre-translated**: Fast retrieval, no translation delay
- **Runtime translation**: ~1-3 seconds per query (depends on GPU/CPU)

## Troubleshooting

### Models won't load:
- Make sure transformers is installed: `pip install transformers`
- Check internet connection (first-time download)
- Models are ~300-500MB each

### Translation quality issues:
- Helsinki-NLP models are good but may need fine-tuning for medical terms
- Consider post-processing for domain-specific terms
- Pre-translated CSV allows manual review/editing

### Memory issues:
- Translation models use ~1-2GB RAM
- Use CPU if GPU memory is limited
- Consider translating in smaller batches

## Next Steps

1. Run `translate_csv.py` to create Swahili translations
2. Run `build_swahili_index.py` to create Swahili index
3. Restart your Flask server
4. Test Swahili queries!

The system will automatically use the best available method (pre-translated > runtime translation).


