"""
Build FAISS index for Swahili corpus
Run this after translating the CSV to create a Swahili-specific index
"""
import pandas as pd
import numpy as np
import faiss
import os
from sentence_transformers import SentenceTransformer

print("Building Swahili FAISS index...")

# Load Swahili translations
if not os.path.exists("./menstrual_data_sw.csv"):
    print("❌ Error: menstrual_data_sw.csv not found!")
    print("   Run translate_csv.py first to create translations")
    exit(1)

df_sw = pd.read_csv("./menstrual_data_sw.csv")
corpus_sw = df_sw["answer_sw"].fillna("").tolist()

# Filter out empty translations
corpus_sw = [text for text in corpus_sw if text and text.strip()]
print(f"✅ Loaded {len(corpus_sw)} Swahili translations")

# Create embeddings
print("Creating embeddings...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
embeddings_sw = embedder.encode(corpus_sw, convert_to_numpy=True, show_progress_bar=True)

# Build FAISS index
dimension = embeddings_sw.shape[1]
index_sw = faiss.IndexFlatL2(dimension)
index_sw.add(embeddings_sw)

# Save
np.save("embeddings_sw.npy", embeddings_sw)
faiss.write_index(index_sw, "menstrual_index_sw.faiss")
print(f"✅ Saved Swahili embeddings and index")
print(f"   - embeddings_sw.npy ({embeddings_sw.shape})")
print(f"   - menstrual_index_sw.faiss")


