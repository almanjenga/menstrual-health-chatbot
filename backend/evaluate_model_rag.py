"""
Evaluation Metrics Script for Model and RAG Implementation
Evaluates both the fine-tuned Flan-T5 model and RAG retrieval system
using the menstrual_data.csv dataset.
"""

import pandas as pd
import numpy as np
import faiss
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from sentence_transformers import SentenceTransformer
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from nltk.translate.meteor_score import meteor_score
from rouge_score import rouge_scorer
import json
from datetime import datetime
import os
from tqdm import tqdm
import nltk

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)

# ==================== Configuration ====================
MODEL_PATH = "./model"
DATA_PATH = "./menstrual_data.csv"
EMBEDDINGS_PATH = "./embeddings.npy"
INDEX_PATH = "./menstrual_index.faiss"
EVAL_RESULTS_PATH = "./evaluation_results.json"

# Evaluation parameters
TOP_K_VALUES = [1, 3, 5, 10]  # For retrieval metrics
TEST_SIZE = 0.2  # Use 20% of data for testing
MAX_RETRIEVAL_SAMPLES = 500  # Limit retrieval evaluation to this many samples for speed
MAX_GENERATION_SAMPLES = 100  # Limit generation evaluation to this many samples for speed
RANDOM_SEED = 42

# ==================== Load Models and Data ====================

print("Loading models and data...")

# Load fine-tuned model
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH)
model.eval()
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

chat_pipe = pipeline(
    "text2text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=500,
    device=0 if torch.cuda.is_available() else -1
)

# Load embeddings and FAISS index
embeddings = np.load(EMBEDDINGS_PATH)
index = faiss.read_index(INDEX_PATH)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Load menstrual data
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} question-answer pairs")

# Split into train/test
np.random.seed(RANDOM_SEED)
test_indices = np.random.choice(len(df), size=int(len(df) * TEST_SIZE), replace=False)
train_indices = np.setdiff1d(np.arange(len(df)), test_indices)

test_df = df.iloc[test_indices].reset_index(drop=True)
print(f"Test set size: {len(test_df)}")

# Prepare corpus for retrieval
corpus = df["answer"].fillna("").tolist()

# Initialize metrics
rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
smoothing = SmoothingFunction().method1

# ==================== Helper Functions ====================

def retrieve_context(query, top_k=5):
    """Retrieve context using FAISS"""
    query_vec = embedder.encode([query], convert_to_numpy=True)
    distances, indices = index.search(query_vec, top_k)
    
    retrieved_texts = []
    for idx in indices[0]:
        if idx < len(corpus):
            retrieved_texts.append(corpus[idx])
    
    return "\n".join(retrieved_texts[:top_k]), indices[0][:top_k]

def generate_response(query, context=None, use_rag=True):
    """Generate response with or without RAG"""
    if use_rag and context:
        prompt = f"Context: {context}\n\nQuestion: {query}\nAnswer:"
    else:
        prompt = f"Question: {query}\nAnswer:"
    
    result = chat_pipe(prompt, max_length=512, do_sample=False)
    return result[0]["generated_text"].replace(prompt, "").strip()

def tokenize(text):
    """Simple tokenization for BLEU/METEOR"""
    return nltk.word_tokenize(text.lower())

def compute_bleu(reference, candidate):
    """Compute BLEU score"""
    ref_tokens = [tokenize(reference)]
    cand_tokens = tokenize(candidate)
    return sentence_bleu(ref_tokens, cand_tokens, smoothing_function=smoothing)

def compute_meteor(reference, candidate):
    """Compute METEOR score"""
    try:
        return meteor_score([tokenize(reference)], tokenize(candidate))
    except:
        return 0.0

def compute_rouge(reference, candidate):
    """Compute ROUGE scores"""
    scores = rouge_scorer.score(reference, candidate)
    return {
        'rouge1': scores['rouge1'].fmeasure,
        'rouge2': scores['rouge2'].fmeasure,
        'rougeL': scores['rougeL'].fmeasure
    }

def compute_semantic_similarity(text1, text2):
    """Compute cosine similarity between embeddings"""
    emb1 = embedder.encode([text1], convert_to_numpy=True)
    emb2 = embedder.encode([text2], convert_to_numpy=True)
    similarity = np.dot(emb1[0], emb2[0]) / (np.linalg.norm(emb1[0]) * np.linalg.norm(emb2[0]))
    return float(similarity)

# ==================== RAG Retrieval Metrics ====================

def evaluate_retrieval(test_df, top_k_values, max_samples=None):
    """Evaluate retrieval quality"""
    print("\n" + "="*60)
    print("Evaluating RAG Retrieval Metrics")
    print("="*60)
    
    # Limit samples for faster evaluation
    eval_df = test_df.head(max_samples) if max_samples and len(test_df) > max_samples else test_df
    print(f"Using {len(eval_df)} samples for retrieval evaluation (out of {len(test_df)} total test samples)")
    
    results = {}
    
    for top_k in top_k_values:
        print(f"\nEvaluating with top_k={top_k}...")
        
        precision_scores = []
        recall_scores = []
        mrr_scores = []
        relevance_scores = []
        
        for idx, row in tqdm(eval_df.iterrows(), total=len(eval_df), desc=f"Top-{top_k}"):
            query = row["question"]
            true_answer = row["answer"]
            
            # Retrieve contexts
            context, retrieved_indices = retrieve_context(query, top_k=top_k)
            
            # Find ground truth index
            true_idx = df[df["answer"] == true_answer].index
            if len(true_idx) > 0:
                true_idx = true_idx[0]
            else:
                continue
            
            # Precision@K: Is the true answer in retrieved results?
            is_relevant = true_idx in retrieved_indices
            precision_scores.append(1.0 if is_relevant else 0.0)
            
            # Recall@K: For retrieval, we consider if relevant answer is found
            recall_scores.append(1.0 if is_relevant else 0.0)
            
            # MRR: Mean Reciprocal Rank
            if is_relevant:
                rank = np.where(retrieved_indices == true_idx)[0]
                if len(rank) > 0:
                    mrr_scores.append(1.0 / (rank[0] + 1))
                else:
                    mrr_scores.append(0.0)
            else:
                mrr_scores.append(0.0)
            
            # Context relevance: Semantic similarity between query and retrieved context
            if context:
                relevance = compute_semantic_similarity(query, context[:500])  # Limit length
                relevance_scores.append(relevance)
            else:
                relevance_scores.append(0.0)
        
        results[f"top_{top_k}"] = {
            "precision": np.mean(precision_scores),
            "recall": np.mean(recall_scores),
            "mrr": np.mean(mrr_scores),
            "context_relevance": np.mean(relevance_scores),
            "num_samples": len(precision_scores)
        }
        
        print(f"  Precision@{top_k}: {results[f'top_{top_k}']['precision']:.4f}")
        print(f"  Recall@{top_k}: {results[f'top_{top_k}']['recall']:.4f}")
        print(f"  MRR@{top_k}: {results[f'top_{top_k}']['mrr']:.4f}")
        print(f"  Context Relevance@{top_k}: {results[f'top_{top_k}']['context_relevance']:.4f}")
    
    return results

# ==================== Model Generation Metrics ====================

def evaluate_model_generation(test_df, use_rag=True, max_samples=None):
    """Evaluate model generation quality with or without RAG"""
    print("\n" + "="*60)
    print(f"Evaluating Model Generation Metrics (RAG={'ON' if use_rag else 'OFF'})")
    print("="*60)
    
    bleu_scores = []
    rouge1_scores = []
    rouge2_scores = []
    rougeL_scores = []
    meteor_scores = []
    semantic_similarities = []
    
    results_list = []
    
    # Limit to smaller subset for faster evaluation
    eval_subset = test_df.head(max_samples) if max_samples and len(test_df) > max_samples else test_df
    print(f"Using {len(eval_subset)} samples for generation evaluation (out of {len(test_df)} total test samples)")
    
    for idx, row in tqdm(eval_subset.iterrows(), total=len(eval_subset), desc="Evaluating"):
        query = row["question"]
        reference = row["answer"]
        
        # Retrieve context if using RAG
        context = None
        if use_rag:
            context, _ = retrieve_context(query, top_k=5)
        
        # Generate response
        try:
            candidate = generate_response(query, context, use_rag=use_rag)
        except Exception as e:
            print(f"Error generating response for query {idx}: {e}")
            candidate = ""
        
        if not candidate:
            continue
        
        # Compute metrics
        bleu = compute_bleu(reference, candidate)
        rouge = compute_rouge(reference, candidate)
        meteor = compute_meteor(reference, candidate)
        semantic = compute_semantic_similarity(reference, candidate)
        
        bleu_scores.append(bleu)
        rouge1_scores.append(rouge['rouge1'])
        rouge2_scores.append(rouge['rouge2'])
        rougeL_scores.append(rouge['rougeL'])
        meteor_scores.append(meteor)
        semantic_similarities.append(semantic)
        
        results_list.append({
            "query": query,
            "reference": reference,
            "candidate": candidate,
            "bleu": bleu,
            "rouge1": rouge['rouge1'],
            "rouge2": rouge['rouge2'],
            "rougeL": rouge['rougeL'],
            "meteor": meteor,
            "semantic_similarity": semantic
        })
    
    results = {
        "bleu": np.mean(bleu_scores),
        "rouge1": np.mean(rouge1_scores),
        "rouge2": np.mean(rouge2_scores),
        "rougeL": np.mean(rougeL_scores),
        "meteor": np.mean(meteor_scores),
        "semantic_similarity": np.mean(semantic_similarities),
        "std_bleu": np.std(bleu_scores),
        "std_rouge1": np.std(rouge1_scores),
        "std_rouge2": np.std(rouge2_scores),
        "std_rougeL": np.std(rougeL_scores),
        "std_meteor": np.std(meteor_scores),
        "std_semantic": np.std(semantic_similarities),
        "num_samples": len(bleu_scores),
        "detailed_results": results_list[:10]  # Store first 10 for inspection
    }
    
    print(f"\nResults:")
    print(f"  BLEU: {results['bleu']:.4f} (±{results['std_bleu']:.4f})")
    print(f"  ROUGE-1: {results['rouge1']:.4f} (±{results['std_rouge1']:.4f})")
    print(f"  ROUGE-2: {results['rouge2']:.4f} (±{results['std_rouge2']:.4f})")
    print(f"  ROUGE-L: {results['rougeL']:.4f} (±{results['std_rougeL']:.4f})")
    print(f"  METEOR: {results['meteor']:.4f} (±{results['std_meteor']:.4f})")
    print(f"  Semantic Similarity: {results['semantic_similarity']:.4f} (±{results['std_semantic']:.4f})")
    print(f"  Evaluated {results['num_samples']} samples")
    
    return results

# ==================== Main Evaluation ====================

def main():
    print("="*60)
    print("Model and RAG Evaluation Script")
    print("="*60)
    print(f"Model: {MODEL_PATH}")
    print(f"Data: {DATA_PATH}")
    print(f"Test set size: {len(test_df)}")
    print(f"Device: {device}")
    
    all_results = {
        "timestamp": datetime.now().isoformat(),
        "model_path": MODEL_PATH,
        "data_path": DATA_PATH,
        "test_size": len(test_df),
        "retrieval_samples": MAX_RETRIEVAL_SAMPLES,
        "generation_samples": MAX_GENERATION_SAMPLES,
        "device": device
    }
    
    # 1. Evaluate RAG Retrieval
    retrieval_results = evaluate_retrieval(test_df, TOP_K_VALUES, max_samples=MAX_RETRIEVAL_SAMPLES)
    all_results["rag_retrieval"] = retrieval_results
    
    # 2. Evaluate Model with RAG
    model_with_rag = evaluate_model_generation(test_df, use_rag=True, max_samples=MAX_GENERATION_SAMPLES)
    all_results["model_with_rag"] = model_with_rag
    
    # 3. Evaluate Model without RAG (baseline)
    model_without_rag = evaluate_model_generation(test_df, use_rag=False, max_samples=MAX_GENERATION_SAMPLES)
    all_results["model_without_rag"] = model_without_rag
    
    # 4. Compare RAG vs No-RAG
    print("\n" + "="*60)
    print("RAG vs No-RAG Comparison")
    print("="*60)
    
    comparison = {}
    for metric in ['bleu', 'rouge1', 'rouge2', 'rougeL', 'meteor', 'semantic_similarity']:
        with_rag = model_with_rag[metric]
        without_rag = model_without_rag[metric]
        improvement = ((with_rag - without_rag) / without_rag * 100) if without_rag > 0 else 0
        comparison[metric] = {
            "with_rag": with_rag,
            "without_rag": without_rag,
            "improvement_percent": improvement
        }
        print(f"{metric.upper()}:")
        print(f"  With RAG:    {with_rag:.4f}")
        print(f"  Without RAG: {without_rag:.4f}")
        print(f"  Improvement: {improvement:+.2f}%")
    
    all_results["comparison"] = comparison
    
    # Save results
    with open(EVAL_RESULTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Evaluation complete! Results saved to {EVAL_RESULTS_PATH}")
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Best Retrieval Precision@5: {retrieval_results['top_5']['precision']:.4f}")
    print(f"Best Retrieval MRR@5: {retrieval_results['top_5']['mrr']:.4f}")
    print(f"Model BLEU (with RAG): {model_with_rag['bleu']:.4f}")
    print(f"Model ROUGE-L (with RAG): {model_with_rag['rougeL']:.4f}")
    print(f"RAG Improvement on BLEU: {comparison['bleu']['improvement_percent']:+.2f}%")

if __name__ == "__main__":
    main()

