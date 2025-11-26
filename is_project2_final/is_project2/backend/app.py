from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from sentence_transformers import SentenceTransformer
import faiss
import pandas as pd
import numpy as np
import torch
import os
from langdetect import detect
import re
import random
import json
from datetime import datetime
try:
    from translation_utils import translate_en_to_sw, translate_sw_to_en, load_translation_models
    TRANSLATION_AVAILABLE = True
except ImportError:
    print("⚠️ Translation utilities not available. Install transformers: pip install transformers")
    TRANSLATION_AVAILABLE = False
    def translate_en_to_sw(text): return text
    def translate_sw_to_en(text): return text
    def load_translation_models(): pass

app = Flask(__name__)
CORS(app)

# ------------------ 1️⃣ Load fine-tuned Flan-T5 ------------------
model_name = "./model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
model.eval()

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

chat_pipe = pipeline(
    "text2text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=500,  # Increased for detailed responses
    device=0 if torch.cuda.is_available() else -1
)

# ------------------ 2️⃣ Load dataset ------------------
df = pd.read_csv("./menstrual_data.csv")
# Use only answers for retrieval, not questions
corpus = df["answer"].fillna("").tolist()

# Try to load Swahili translations if available
df_sw = None
corpus_sw = None
if os.path.exists("./menstrual_data_sw.csv"):
    try:
        df_sw = pd.read_csv("./menstrual_data_sw.csv")
        # Use Swahili answers if available, otherwise use English
        corpus_sw = df_sw["answer_sw"].fillna("").tolist()
        print("✅ Loaded Swahili translations from menstrual_data_sw.csv")
    except Exception as e:
        print(f"⚠️ Could not load Swahili translations: {e}")
        print("   Runtime translation will be used instead")
else:
    print("ℹ️ No Swahili translations found. Using runtime translation.")
    print("   Run translate_csv.py to create menstrual_data_sw.csv for better performance")

# ------------------ 3️⃣ Load or build FAISS index ------------------
if os.path.exists("embeddings.npy") and os.path.exists("menstrual_index.faiss"):
    embeddings = np.load("embeddings.npy")
    index = faiss.read_index("menstrual_index.faiss")
    print("✅ Loaded saved embeddings and FAISS index.")
else:
    print("🔍 Creating embeddings and FAISS index...")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = embedder.encode(corpus, convert_to_numpy=True, show_progress_bar=True)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    np.save("embeddings.npy", embeddings)
    faiss.write_index(index, "menstrual_index.faiss")
    print("✅ Saved embeddings and index.")

if "embedder" not in locals():
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Load Swahili FAISS index if available
index_sw = None
embeddings_sw = None
if corpus_sw and len([x for x in corpus_sw if x]) > 0:
    if os.path.exists("embeddings_sw.npy") and os.path.exists("menstrual_index_sw.faiss"):
        try:
            embeddings_sw = np.load("embeddings_sw.npy")
            index_sw = faiss.read_index("menstrual_index_sw.faiss")
            print("✅ Loaded Swahili FAISS index.")
        except Exception as e:
            print(f"⚠️ Could not load Swahili index: {e}")
            print("   Run build_swahili_index.py to create it")
    else:
        print("ℹ️ Swahili FAISS index not found. Run build_swahili_index.py after translating CSV")

# Load translation models (optional, for runtime translation)
# Only load if Swahili translations don't exist
USE_RUNTIME_TRANSLATION = (corpus_sw is None or len([x for x in corpus_sw if x]) == 0) and TRANSLATION_AVAILABLE
if USE_RUNTIME_TRANSLATION:
    print("Loading translation models for runtime translation...")
    try:
        load_translation_models()
        print("✅ Translation models loaded")
    except Exception as e:
        print(f"⚠️ Could not load translation models: {e}")
        print("   Install transformers: pip install transformers")
        USE_RUNTIME_TRANSLATION = False

# ------------------ 4️⃣ Conversation history (per-user, multiple conversations) ------------------
CONVERSATIONS_DIR = "./conversations"
os.makedirs(CONVERSATIONS_DIR, exist_ok=True)

MAX_HISTORY = 5

def get_user_conversations_file(user_id):
    """Get file path for user's conversations list"""
    return os.path.join(CONVERSATIONS_DIR, f"{user_id}.json")

def load_user_conversations(user_id):
    """Load all conversations for a specific user"""
    file_path = get_user_conversations_file(user_id)
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Support both old format (single conversation) and new format (multiple conversations)
                if "conversations" in data:
                    return data
                else:
                    # Migrate old format to new format
                    old_messages = data.get("messages", [])
                    if old_messages:
                        conversation_id = datetime.now().strftime("%Y%m%d%H%M%S")
                        return {
                            "user_id": user_id,
                            "conversations": {
                                conversation_id: {
                                    "conversation_id": conversation_id,
                                    "created_at": data.get("last_updated", datetime.now().isoformat()),
                                    "updated_at": data.get("last_updated", datetime.now().isoformat()),
                                    "title": old_messages[0].get("text", "Chat")[:50] if old_messages else "Chat",
                                    "messages": old_messages
                                }
                            },
                            "last_updated": datetime.now().isoformat()
                        }
                    else:
                        return {
                            "user_id": user_id,
                            "conversations": {},
                            "last_updated": datetime.now().isoformat()
                        }
        except Exception as e:
            print(f"Error loading user conversations: {e}")
            return {
                "user_id": user_id,
                "conversations": {},
                "last_updated": datetime.now().isoformat()
            }
    return {
        "user_id": user_id,
        "conversations": {},
        "last_updated": datetime.now().isoformat()
    }

def save_user_conversations(user_id, conversations_data):
    """Save all conversations for a specific user"""
    file_path = get_user_conversations_file(user_id)
    conversations_data["last_updated"] = datetime.now().isoformat()
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(conversations_data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving user conversations: {e}")

def load_conversation_history(user_id, conversation_id=None):
    """Load conversation history for a specific conversation"""
    conversations_data = load_user_conversations(user_id)
    conversations = conversations_data.get("conversations", {})
    
    if conversation_id and conversation_id in conversations:
        return conversations[conversation_id].get("messages", [])
    elif not conversation_id and len(conversations) > 0:
        # If no conversation_id provided, return the most recent conversation
        sorted_convs = sorted(conversations.items(), key=lambda x: x[1].get("updated_at", ""), reverse=True)
        if sorted_convs:
            return sorted_convs[0][1].get("messages", [])
    
    return []

def save_conversation_history(user_id, conversation_id, messages, title=None):
    """Save conversation history for a specific conversation"""
    conversations_data = load_user_conversations(user_id)
    conversations = conversations_data.get("conversations", {})
    
    # Keep last 50 messages to prevent file from getting too large
    messages_to_save = messages[-50:] if len(messages) > 50 else messages
    
    # Generate title from first user message if not provided or if still "New Chat"
    if not title and messages_to_save:
        first_user_msg = next((msg for msg in messages_to_save if msg.get("role") == "User"), None)
        if first_user_msg:
            title = first_user_msg.get("text", "Chat")[:50]
        else:
            title = "New Chat"
    
    if conversation_id not in conversations:
        conversations[conversation_id] = {
            "conversation_id": conversation_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "title": title or "New Chat",
            "messages": messages_to_save
        }
    else:
        conversations[conversation_id]["messages"] = messages_to_save
        conversations[conversation_id]["updated_at"] = datetime.now().isoformat()
        # Update title if it's still "New Chat" and we have a user message, or if title is explicitly provided
        if title:
            conversations[conversation_id]["title"] = title
        elif conversations[conversation_id].get("title") == "New Chat" and messages_to_save:
            first_user_msg = next((msg for msg in messages_to_save if msg.get("role") == "User"), None)
            if first_user_msg:
                conversations[conversation_id]["title"] = first_user_msg.get("text", "Chat")[:50]
    
    conversations_data["conversations"] = conversations
    save_user_conversations(user_id, conversations_data)

def add_to_history(user_id, conversation_id, role, text):
    """Add message to a specific conversation"""
    messages = load_conversation_history(user_id, conversation_id)
    messages.append({
        "role": role,
        "text": text,
        "timestamp": datetime.now().isoformat()
    })
    save_conversation_history(user_id, conversation_id, messages)

def format_history(user_id, conversation_id=None):
    """Format conversation history for prompt (last N messages)"""
    messages = load_conversation_history(user_id, conversation_id)
    lines = []
    for entry in messages[-MAX_HISTORY:]:  # Only last N entries
        lines.append(f"{entry['role']}: {entry['text']}")
    return "\n".join(lines)

def create_new_conversation(user_id):
    """Create a new conversation and return its ID"""
    conversation_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
    conversations_data = load_user_conversations(user_id)
    conversations = conversations_data.get("conversations", {})
    
    conversations[conversation_id] = {
        "conversation_id": conversation_id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "title": "New Chat",
        "messages": []
    }
    
    conversations_data["conversations"] = conversations
    save_user_conversations(user_id, conversations_data)
    return conversation_id

# ------------------ 5️⃣ Retrieve and summarize context ------------------
def retrieve_context(query, top_k=5, similarity_threshold=0.5, language="en"):
    """Retrieve context with semantic similarity filtering"""
    # For Swahili queries, try to use Swahili corpus if available
    use_swahili_corpus = (language == "sw" and corpus_sw is not None and len([x for x in corpus_sw if x]) > 0)
    
    if use_swahili_corpus and index_sw is not None:
        # Use Swahili corpus with Swahili index
        current_corpus = corpus_sw
        current_index = index_sw
        print("🔍 Searching in Swahili corpus with Swahili index...")
    else:
        # Use English corpus (or translate Swahili query to English)
        current_corpus = corpus
        current_index = index
        
        # If query is in Swahili but no Swahili corpus, translate query to English
        if language == "sw" and USE_RUNTIME_TRANSLATION:
            try:
                query_en = translate_sw_to_en(query)
                print(f"🔍 Translated query: '{query}' → '{query_en[:50]}...'")
                
                # Verify translation actually worked (should be different from original)
                if query_en.strip().lower() == query.strip().lower():
                    print(f"⚠️ WARNING: Translation returned same text - query may not be translated!")
                    print(f"   This means the English corpus will be searched with Swahili text.")
                else:
                    query = query_en  # Use translated query for search
            except Exception as e:
                print(f"⚠️ Translation failed, using original query: {e}")
                print(f"   This means the English corpus will be searched with Swahili text.")
    
    query_vec = embedder.encode([query], convert_to_numpy=True)
    distances, indices = current_index.search(query_vec, top_k * 3)  # Get more candidates
    
    retrieved_texts = []
    seen_texts = set()  # Avoid duplicates
    
    for i, idx in enumerate(indices[0]):
        if idx >= len(current_corpus):
            continue
        
        text = current_corpus[idx]
        if not text or not text.strip():  # Skip empty translations
            continue
            
        distance = distances[0][i]
        similarity_score = 1.0 / (1.0 + distance)  # Convert distance to similarity
        
        # Check if text is relevant to query (contains key terms)
        query_words = set(query.lower().split())
        text_words = set(text.lower().split())
        word_overlap = len(query_words & text_words) / max(len(query_words), 1)
        
        # More lenient filtering - include if similarity is reasonable OR word overlap exists
        if (similarity_score >= similarity_threshold or word_overlap > 0.15) and text not in seen_texts:
            # Filter out irrelevant terms that shouldn't appear
            irrelevant_terms = ["menarche", "first period", "puberty", "ages of 10 and 16"]
            query_lower = query.lower()
            
            # Skip if text contains irrelevant terms and query doesn't mention them
            is_irrelevant = any(term in text.lower() for term in irrelevant_terms) and not any(term in query_lower for term in ["menarche", "first period", "puberty", "start", "begin"])
            
            # Filter out Indian program references (not relevant for Kenyan audience)
            indian_program_phrases = [
                "anms", "ashas", "awwwws", "auxiliary nurse", "auxiliary admiles",
                "pradhan mantri", "bhartiya janaushadhi", "pmbjp", "janaushadhi",
                "beti bachao", "beti padhao", "rural india", "indian cities",
                "indian villages", "hdi gender inequality", "gender equality in india"
            ]
            has_indian_references = any(phrase in text.lower() for phrase in indian_program_phrases)
            
            if not is_irrelevant and not has_indian_references:
                retrieved_texts.append(text)
                seen_texts.add(text)
                
                if len(retrieved_texts) >= top_k:
                    break
    
    result = "\n".join(retrieved_texts)
    
    # Filter out Indian program references from result (post-filtering)
    if result:
        sentences = result.split('.')
        filtered_sentences = []
        indian_program_phrases = [
            "anms", "ashas", "awwwws", "auxiliary nurse", "auxiliary admiles",
            "pradhan mantri", "bhartiya janaushadhi", "pmbjp", "janaushadhi",
            "beti bachao", "beti padhao", "rural india", "indian cities",
            "indian villages", "hdi gender inequality", "gender equality in india",
            "walimu na wafanyakazi", "kudumisha usafi", "mabovu ya usafi",
            "mashambani", "gharama kubwa", "mpango wa kuendeleza"
        ]
        for sent in sentences:
            sent_lower = sent.lower()
            has_indian_ref = any(phrase in sent_lower for phrase in indian_program_phrases)
            if not has_indian_ref and sent.strip():
                filtered_sentences.append(sent.strip())
        if filtered_sentences:
            result = '. '.join(filtered_sentences)
        else:
            result = ""  # All sentences filtered out
    
    # If we retrieved English context but need Swahili, translate it
    if language == "sw" and not use_swahili_corpus and USE_RUNTIME_TRANSLATION and result:
        try:
            print("🔄 Translating retrieved context to Swahili...")
            # Translate in chunks to avoid token limits
            sentences = result.split('.')
            translated_sentences = []
            for sent in sentences[:10]:  # Limit to first 10 sentences
                if sent.strip():
                    translated = translate_en_to_sw(sent.strip())
                    translated_sentences.append(translated)
            result = '. '.join(translated_sentences)
            print("✅ Context translated to Swahili")
        except Exception as e:
            print(f"⚠️ Context translation failed: {e}")
            # Return English context - model will handle it
    
    return result

def summarize_context(context, max_words=120):
    """Summarize context to max_words, keeping most relevant information"""
    if not context:
        return ""
    
    # Split into sentences
    sentences = context.split('.')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # Count words
    word_count = 0
    selected_sentences = []
    
    for sent in sentences:
        words = sent.split()
        if word_count + len(words) <= max_words:
            selected_sentences.append(sent)
            word_count += len(words)
        else:
            # If adding this sentence would exceed limit, check if it's short enough to fit partially
            remaining = max_words - word_count
            if remaining > 20:  # Only if we have significant space left
                # Take first part of sentence
                words_to_take = words[:remaining]
                if words_to_take:
                    selected_sentences.append(' '.join(words_to_take))
            break
    
    return '. '.join(selected_sentences)

# ------------------ 6️⃣ Emotion + Language Detection ------------------
def detect_emotion(text):
    t = text.lower()
    # Check for pain (English and Swahili)
    if any(w in t for w in ["pain", "cramp", "hurt", "severe", "severely", "really painful", "extremely painful", 
                             "maumivu", "unaumia", "uumiza", "kuumiza", "makali"]):
        return "pain"
    # Check for anxious (English and Swahili)
    if any(w in t for w in ["scared", "worried", "anxious", "afraid", "nervous", "panic",
                             "wasiwasi", "hofu", "ogopa"]):
        return "anxious"
    # Check for sad (English and Swahili)
    if any(w in t for w in ["sad", "depressed", "down", "upset", "crying",
                             "huzuni", "sikitika"]):
        return "sad"
    return "neutral"

def detect_language(text):
    try:
        lang = detect(text)
        return "sw" if lang in ["sw", "swahili"] else "en"
    except:
        return "en"

# ------------------ 7️⃣ Medical Safety Validation ------------------
def check_unsafe_content(text):
    """Check for unsafe medical advice"""
    text_lower = text.lower()
    
    # Red flags
    unsafe_patterns = [
        r'\bsex\s+(will|can|might|may)\s+(help|cure|treat|fix|solve)',
        r'recommend.*sex',
        r'use.*sex.*treatment',
        r'you\s+must\s+(not|never)\s+(go|attend).*school',
        r'you\s+must\s+(not|never)\s+(go|attend).*work',
        r'you\s+cannot\s+(go|attend).*school',
        r'you\s+cannot\s+(go|attend).*work',
        r'pads?\s+(can|cause|lead to).*toxic shock',
        r'pads?\s+(can|cause|lead to).*tss',
    ]
    
    for pattern in unsafe_patterns:
        if re.search(pattern, text_lower):
            return True, f"Unsafe medical advice detected: {pattern}"
    
    return False, None

def fix_tampon_safety_info(text):
    """Fix incorrect tampon/pad safety information"""
    text = re.sub(r'pad(s)?\s+(can|cause|lead to|may cause).*toxic shock', 
                  'Only tampons left in for more than 8 hours can cause toxic shock syndrome. Pads do not cause TSS.', 
                  text, flags=re.IGNORECASE)
    text = re.sub(r'pad(s)?\s+(can|cause|lead to|may cause).*tss', 
                  'Only tampons left in for more than 8 hours can cause TSS. Pads do not cause TSS.', 
                  text, flags=re.IGNORECASE)
    return text

# ------------------ 8️⃣ Final Validation Layer ------------------
def validate_and_clean_response(response, user_input):
    """Final validation: remove repeats, contradictions, unsafe content, ensure warm tone"""
    if not response:
        return "I'm here to help you with your menstrual health questions. Could you tell me more about what you're experiencing?"
    
    # 1. Remove instruction echoes (CRITICAL - model copying instructions)
    instruction_echo_phrases = [
        "use a warm, detailed, compassionate response",
        "4-6 sentences minimum",
        "do not use generic closings",
        "do not copy or repeat",
        "rewrite all information",
        "be warm, validating, and conversational",
        "start with validation",
        "give a clear, medical",
        "provide optional tips",
        "end with a gentle",
        "follow this exactly",
        "response structure",
        "critical rules",
        "do not give generic responses",
        "maintain a healthy lifestyle",
        "exercise regularly and get enough sleep",
        "be patient and patient-friendly",
        "don't be afraid to talk",
        "make sure you understand",
        "talk to a healthcare provider or healthcare provider",  # Duplicate phrase
        "be patient and patient",  # Repetitive
        "avoid over-the-counter pain relievers",  # Wrong advice
        "do not be afraid",
        "be patient and patient-friendly",
        "do not be afraid",
        "be patient and patient"
    ]
    
    # Remove sentences containing instruction echoes
    sentences = response.split('.')
    cleaned_sentences = []
    for sent in sentences:
        sent_lower = sent.lower()
        is_instruction_echo = any(phrase in sent_lower for phrase in instruction_echo_phrases)
        if not is_instruction_echo:
            cleaned_sentences.append(sent)
    
    if cleaned_sentences:
        response = '. '.join(cleaned_sentences).strip()
    else:
        # If all sentences were instruction echoes, return fallback
        return "I'm here to help you with your menstrual health questions. Could you tell me more about what you're experiencing?"
    
    # 2. Check for unsafe content
    is_unsafe, reason = check_unsafe_content(response)
    if is_unsafe:
        print(f"⚠️ Unsafe content detected: {reason}")
        # Return safe fallback
        return "I want to make sure I give you accurate and safe information. For specific medical concerns, it's best to speak with a healthcare provider who can give you personalized advice."
    
    # 3. Fix tampon safety information
    response = fix_tampon_safety_info(response)
    
    # 4. Remove repeated sentences (STRONG detection)
    sentences = response.split('.')
    seen_normalized = set()
    unique_sentences = []
    
    for sent in sentences:
        sent = sent.strip()
        if not sent or len(sent) < 10:
            continue
        
        # Normalize for comparison (lowercase, remove extra spaces, remove punctuation)
        normalized = re.sub(r'[^\w\s]', '', ' '.join(sent.lower().split()))
        
        # Check for exact duplicates first
        if normalized in seen_normalized:
            continue
        
        # Check for near-duplicates (70% similarity - more aggressive)
        is_duplicate = False
        for seen in seen_normalized:
            if len(normalized) > 20 and len(seen) > 20:
                # Word-based similarity
                words1 = set(normalized.split())
                words2 = set(seen.split())
                if len(words1) > 0 and len(words2) > 0:
                    overlap = len(words1 & words2) / max(len(words1), len(words2))
                    # More aggressive: 70% overlap = duplicate
                    if overlap > 0.7:
                        is_duplicate = True
                        break
                
                # Also check if one sentence contains most of the other
                if len(words1) > 0 and len(words2) > 0:
                    if words1.issubset(words2) or words2.issubset(words1):
                        is_duplicate = True
                        break
        
        if not is_duplicate:
            unique_sentences.append(sent)
            seen_normalized.add(normalized)
    
    response = '. '.join(unique_sentences).strip()
    
    # Additional pass: remove consecutive identical sentences
    final_sentences = []
    prev_sent = None
    for sent in unique_sentences:
        sent_normalized = re.sub(r'[^\w\s]', '', ' '.join(sent.lower().split()))
        prev_normalized = re.sub(r'[^\w\s]', '', ' '.join(prev_sent.lower().split())) if prev_sent else ""
        
        if sent_normalized != prev_normalized:
            final_sentences.append(sent)
            prev_sent = sent
    
    response = '. '.join(final_sentences).strip()
    
    # 5. Remove contradictions (basic check)
    # Check for contradictory statements about the same topic
    contradiction_patterns = [
        (r'pads?\s+(can|cause).*tss', r'pads?\s+(do not|cannot).*tss'),
        (r'you\s+must\s+skip', r'you\s+should\s+not\s+skip'),
    ]
    
    for pattern1, pattern2 in contradiction_patterns:
        if re.search(pattern1, response, re.IGNORECASE) and re.search(pattern2, response, re.IGNORECASE):
            # Remove the incorrect one (pattern1 is usually wrong)
            response = re.sub(pattern1, '', response, flags=re.IGNORECASE)
    
    # 6. Fix typos
    response = response.replace("polycrystic", "polycystic")
    response = response.replace("Polycrystic", "Polycystic")
    response = response.replace("sampon", "tampon")
    response = response.replace("Sampon", "Tampon")
    
    # 7. Remove generic overused closings and replace with varied ones
    generic_closings = [
        "Remember, you're not alone in this, and it's okay to ask questions.",
        "Remember, you're not alone in this, and it's okay to ask questions",
        "I hope this helps! Feel free to ask if you have more questions—I'm here to support you.",
        "I hope this helps! Feel free to ask if you have more questions—I'm here to support you"
    ]
    
    # Remove generic closings if they appear
    for closing in generic_closings:
        if response.endswith(closing):
            response = response[:-len(closing)].strip()
            break
    
    # 8. Ensure minimum length (4-6 sentences)
    sentence_count = len([s for s in response.split('.') if s.strip()])
    if sentence_count < 4:
        # Add varied empathetic closing if too short
        varied_closings = [
            "I'm here if you need to talk more about this.",
            "Feel free to reach out if you have other questions.",
            "You're doing great by asking questions and taking care of yourself.",
            "I'm always here to support you with whatever you need."
        ]
        import random
        closing = random.choice(varied_closings)
        if not response.endswith(('.', '!', '?')):
            response += '.'
        response += f' {closing}'
    
    # 9. Ensure warm, empathetic tone (check for cold/robotic phrases)
    cold_phrases = [
        "according to the data",
        "the dataset shows",
        "based on the information",
        "the context states",
    ]
    
    for phrase in cold_phrases:
        if phrase.lower() in response.lower():
            # Replace with warmer phrasing
            response = re.sub(re.escape(phrase), "I understand", response, flags=re.IGNORECASE)
    
    # 10. Remove irrelevant context that slipped through
    user_input_lower = user_input.lower()
    
    # Remove menarche/first period info if not relevant
    if "menarche" not in user_input_lower and "first period" not in user_input_lower and "puberty" not in user_input_lower:
        irrelevant_terms = ["menarche", "first menstrual period", "ages of 10 and 16", "typically occurs between"]
        sentences = response.split('.')
        filtered = []
        for sent in sentences:
            sent_lower = sent.lower()
            # Only remove if sentence is primarily about menarche
            if any(term in sent_lower for term in irrelevant_terms):
                # Check if sentence is ONLY about menarche
                menarche_words = ["menarche", "first period", "puberty", "ages of 10 and 16"]
                menarche_count = sum(1 for term in menarche_words if term in sent_lower)
                total_words = len(sent.split())
                # If more than 30% of sentence is about menarche, remove it
                if menarche_count > 0 and (menarche_count / max(total_words, 1)) > 0.3:
                    continue
            filtered.append(sent)
        if filtered:
            response = '. '.join(filtered).strip()
    
    # 11. Remove mentions of sex when not relevant
    if "sex" in response.lower():
        # Check if sex mention is relevant
        sex_contexts = ["intercourse", "sexual", "partner", "relationship", "swim"]
        if not any(ctx in user_input_lower for ctx in sex_contexts):
            # Remove sex mentions
            sentences = response.split('.')
            filtered = [s for s in sentences if "sex" not in s.lower() or "swim" in s.lower()]
            if filtered:
                response = '. '.join(filtered).strip()
    
    # 12. Ensure proper sentence endings
    if response and not response.endswith(('.', '!', '?')):
        response += '.'
    
    return response.strip()

# ------------------ 8️⃣ Empathetic Response Module ------------------
def create_empathetic_response(user_input, context, emotion, language="en"):
    """Create a warm, big-sister style response following: validation → explanation → tips → closing"""
    # For Swahili mode: Generate in English first, then translate entire response to Swahili
    # For English mode: Generate in English (unchanged)
    # Always use English openings/closings, translate at the end if needed
    
    # English empathetic openings
    empathetic_openings = {
        "pain": [
            "I'm really sorry you're going through that — it can be so uncomfortable.",
            "That sounds really tough, and I want you to know your feelings are completely valid.",
            "I hear you, and I know how frustrating period pain can be.",
            "I'm sorry you're dealing with this. Period pain is no joke."
        ],
        "anxious": [
            "It's totally normal to feel worried about this, and I'm glad you're asking.",
            "I understand this can feel scary or confusing. Let's walk through this together.",
            "Your concerns are completely valid, and I'm here to help you understand.",
            "It's okay to feel anxious about this — you're not alone in wondering."
        ],
        "sad": [
            "I'm sorry you're going through this. Your feelings matter.",
            "I hear you, and I want to help you feel better.",
            "That sounds really difficult, and I'm here to support you."
        ],
        "neutral": [
            "That's a great question!",
            "I'm happy to help you understand this.",
            "Absolutely! Let me walk you through this.",
            "Of course! I'd be happy to explain."
        ]
    }
    
    # English supportive closings
    supportive_closings = {
        "pain": [
            "If your pain is severe or really interfering with your daily life, it's worth talking to a healthcare provider who can help you find the best solution.",
            "Take care of yourself, and don't hesitate to reach out if you need more support.",
            "I hope you find some relief soon. You're doing great by taking care of yourself."
        ],
        "anxious": [
            "If you're really worried, don't hesitate to reach out to a healthcare provider who can give you personalized advice.",
            "It's okay to have questions, and I'm here whenever you need support.",
            "You're doing the right thing by asking questions and taking care of your health."
        ],
        "sad": [
            "I'm here for you, and I want you to know that your feelings are completely valid.",
            "Take care of yourself, and remember that you're not alone in this.",
            "I hope this helps, and I'm always here if you need to talk more."
        ],
        "neutral": [
            "I hope this helps! Feel free to ask if you have more questions.",
            "You're doing great by asking questions and learning about your health.",
            "I'm here whenever you need support or have more questions."
        ]
    }
        
    fallback_message = f"{random.choice(empathetic_openings.get(emotion, empathetic_openings['neutral']))} I want to make sure I give you accurate information. Could you tell me a bit more about what specifically you'd like to know? I'm here to support you."
    
    opening = random.choice(empathetic_openings.get(emotion, empathetic_openings["neutral"]))
    closing = random.choice(supportive_closings.get(emotion, supportive_closings["neutral"]))
    
    # Store original language for translation at the end
    needs_translation = (language == "sw")
    
    # If we have context, create a detailed response following structure:
    # 1. Validation + empathy
    # 2. Clear explanation
    # 3. Tips/actionable steps
    # 4. Supportive closing
    
    if context:
        # Split context into sentences and pick the most relevant ones
        # Use more sentences - don't filter too aggressively
        context_sentences = [s.strip() for s in context.split('.') if s.strip() and len(s.strip()) > 20]  # Lower threshold to get more sentences
        
        # Filter out generic advice and irrelevant info
        useful_sentences = []
        explanation_sentences = []
        tip_sentences = []
        
        for sent in context_sentences[:10]:  # Take up to 10 relevant sentences for more content
            sent_lower = sent.lower()
            
            # Only skip if sentence is ONLY generic advice (no actionable content)
            has_generic_phrase = any(phrase in sent_lower for phrase in [
                "talk to your doctor", "consult a healthcare professional", 
                "maintain a healthy lifestyle", "it's important to",
                "talk to a trusted teacher", "talk to a school nurse"
            ])
            
            # Keep if it has actionable words OR is informative
            has_actionable = any(word in sent_lower for word in ["can", "may", "help", "try", "use", "apply", "take", "reduce", "relief", "manage", "alleviate", "include", "methods", "through", "applying", "heating", "exercise", "relaxation", "dietary", "pain relievers", "ibuprofen", "heat", "warm", "bath", "pad"])
            is_informative = any(word in sent_lower for word in ["is", "are", "characterized", "symptoms", "causes", "means", "refers to", "involves", "alleviated", "various", "disorder", "condition"])
            
            # Only skip if it's ONLY generic and has no actionable/informative content
            if has_generic_phrase and not has_actionable and not is_informative and len(sent) < 60:
                continue
            
            # Categorize sentences
            if has_actionable:
                # Actionable tips
                tip_sentences.append(sent)
            elif is_informative or len(sent) > 50:
                # Explanatory content
                explanation_sentences.append(sent)
            elif len(sent) > 40:  # Keep longer sentences even if not clearly categorized
                explanation_sentences.append(sent)
        
        # Build response following structure
        response_parts = []
        
        # 1. Validation + empathy (opening)
        response_parts.append(opening)
        
        # 2. Clear explanation (1-2 sentences)
        if explanation_sentences:
            # Take first 1-2 explanation sentences
            for sent in explanation_sentences[:2]:
                if sent and sent not in response_parts:
                    response_parts.append(sent)
        
        # 3. Tips/actionable steps (2-3 sentences)
        if tip_sentences:
            # Take 2-3 actionable tips
            for sent in tip_sentences[:3]:
                if sent and sent not in response_parts:
                    response_parts.append(sent)
        
        # If we don't have enough, use any useful sentences
        if len(response_parts) < 4:
            all_useful = explanation_sentences + tip_sentences
            for sent in all_useful:
                if sent and sent not in response_parts and len(response_parts) < 5:
                    response_parts.append(sent)
        
        # Combine parts
        if len(response_parts) > 1:
            response = '. '.join(response_parts)
            if not response.endswith('.'):
                response += '.'
            response += f' {closing}'
            
            # Ensure we have at least 4 sentences total
            sentence_count = len([s for s in response.split('.') if s.strip()])
            if sentence_count < 4:
                # Add one more useful sentence if available
                remaining = [s for s in (explanation_sentences + tip_sentences) if s not in response_parts]
                if remaining:
                    response = response.replace(closing, f'{remaining[0]}. {closing}')
            
            # Translate to Swahili if needed
            if needs_translation:
                try:
                    if TRANSLATION_AVAILABLE:
                        if USE_RUNTIME_TRANSLATION:
                            load_translation_models()
                        response = translate_en_to_sw(response)
                        print("✅ Empathetic response translated to Swahili")
                except Exception as e:
                    print(f"⚠️ Translation error in empathetic response: {e}")
                    # Keep English response as fallback
            
            return response
    
    # Fallback if no context
    response = fallback_message
    
    # Translate to Swahili if needed
    if needs_translation:
        try:
            if TRANSLATION_AVAILABLE:
                if USE_RUNTIME_TRANSLATION:
                    load_translation_models()
                response = translate_en_to_sw(response)
                print("✅ Fallback message translated to Swahili")
        except Exception as e:
            print(f"⚠️ Translation error in fallback: {e}")
            # Keep English response as fallback
    
    return response

# ------------------ 9️⃣ Chat endpoint ------------------
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "").strip()
    user_id = data.get("user_id", "anonymous")
    conversation_id = data.get("conversation_id")  # Get conversation_id from frontend
    user_language_preference = data.get("language", "en")  # Get from frontend

    if not user_input:
        return jsonify({"error": "No input given"}), 400
    
    # If no conversation_id provided, create a new conversation
    if not conversation_id:
        conversation_id = create_new_conversation(user_id)

    # Detect input language
    detected_lang = detect_language(user_input)
    
    # Use user preference if set, otherwise auto-detect
    # If user writes in Swahili but app is in English, respect user preference (respond in English)
    # If user preference is Swahili, always respond in Swahili
    if user_language_preference == "sw":
        language = "sw"
    elif detected_lang == "sw" and user_language_preference == "en":
        # User wrote in Swahili but app is in English - respond in English (respect preference)
        language = "en"
    else:
        language = user_language_preference or detected_lang

    # FIRST: Handle greetings and off-topic questions (before any processing)
    lowered = user_input.lower().strip()
    
    # Check for greetings (exact matches or very short)
    greetings_en = ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "hi there", "hey there"]
    greetings_sw = ["hujambo", "jambo", "mambo", "habari", "sasa", "mambo vipi", "habari yako"]
    
    # Check if it's just a greeting (1-2 words) or starts with greeting
    is_greeting = (
        len(user_input.split()) <= 2 and (
            any(word == lowered or word in lowered.split() for word in greetings_en) or
            any(word == lowered or word in lowered.split() for word in greetings_sw)
        )
    ) or any(lowered.startswith(greeting) for greeting in greetings_en + greetings_sw)
    
    if is_greeting:
        # Get user name if available
        user_name = data.get("name", "").strip()
        
        if language == "sw":
            response = "Hujambo! 👋 Mimi ni Eunoia, msaidizi wako wa afya ya hedhi. Nipo hapa kukusaidia na maswali yoyote kuhusu mzunguko wako, afya ya hedhi, au ustawi wa uzazi. Nini naweza kukusaidia leo?"
        else:
            if user_name:
                response = f"Hello {user_name}! 👋 I'm Eunoia, your menstrual health companion. I'm here to support you with any questions about your cycle, period health, or reproductive wellness. What can I help you with today?"
            else:
                response = "Hey there! 👋 I'm Eunoia, your menstrual health companion. I'm here to support you with any questions about your cycle, period health, or reproductive wellness. What can I help you with today?"
        add_to_history(user_id, conversation_id, "User", user_input)
        add_to_history(user_id, conversation_id, "Assistant", response)
        return jsonify({"response": response, "language": language, "conversation_id": conversation_id})
    
    # Check for off-topic questions
    off_topic_keywords = ["car", "cars", "weather", "football", "movie", "game", "song", "music"]
    if any(keyword in lowered for keyword in off_topic_keywords):
        if language == "sw":
            response = "Nipo hapa kusaidia hasa na maswali kuhusu afya ya hedhi na uzazi! 💛 Ingawa ningependa kuzungumza kuhusu kila kitu, bora zaidi ninaweza kukusaidia na maswala yanayohusiana na hedhi, kufuatilia mzunguko, na ustawi wa uzazi. Kuna kitu kuhusu mzunguko wako au afya yako ungependa kujua?"
        else:
            response = "I'm here specifically to help with menstrual and reproductive health questions! 💛 While I'd love to chat about everything, I'm best at supporting you with period-related concerns, cycle tracking, and reproductive wellness. Is there something about your cycle or health you'd like to know?"
        add_to_history(user_id, conversation_id, "User", user_input)
        add_to_history(user_id, conversation_id, "Assistant", response)
        return jsonify({"response": response, "language": language, "conversation_id": conversation_id})
    
    # Check for questions about the bot itself
    bot_questions_en = ["what does eunoia mean", "what is eunoia", "who are you", "what are you"]
    bot_questions_sw = ["eunoia inamaanisha nini", "wewe ni nani", "nini wewe"]
    if any(phrase in lowered for phrase in bot_questions_en + bot_questions_sw):
        if language == "sw":
            response = "Mimi ni Eunoia, msaidizi wako wa afya ya hedhi! 💛 Eunoia inamaanisha 'mawazo mazuri' au 'akili bora'—nipo hapa kukusaidia na majibu ya kina na ya kujali kuhusu afya yako ya hedhi. Nini naweza kukusaidia leo?"
        else:
            response = "I'm Eunoia, your menstrual health companion! 💛 Eunoia means 'beautiful thinking' or 'well mind'—I'm here to support you with thoughtful, caring answers about your menstrual health. What can I help you with today?"
        add_to_history(user_id, conversation_id, "User", user_input)
        add_to_history(user_id, conversation_id, "Assistant", response)
        return jsonify({"response": response, "language": language, "conversation_id": conversation_id})

    # Check for language mismatch: if user types in different language than their mode preference
    if user_language_preference == "en" and detected_lang == "sw":
        # User is in English mode but typed in Swahili
        response = "I notice you're typing in Swahili! 🌍 To get the best experience, please switch to Swahili mode using the language option in the navbar. This will help me provide more accurate responses in Swahili."
        add_to_history(user_id, conversation_id, "User", user_input)
        add_to_history(user_id, conversation_id, "Assistant", response)
        return jsonify({"response": response, "language": "en", "conversation_id": conversation_id})
    elif user_language_preference == "sw" and detected_lang == "en":
        # User is in Swahili mode but typed in English
        response = "Nimeona unaandika kwa Kiingereza! 🌍 Ili upate uzoefu bora, tafadhali badilisha kwa hali ya Kiingereza kwa kutumia chaguo la lugha kwenye menyu ya juu. Hii itanisaidia kutoa majibu sahihi zaidi kwa Kiingereza."
        add_to_history(user_id, conversation_id, "User", user_input)
        add_to_history(user_id, conversation_id, "Assistant", response)
        return jsonify({"response": response, "language": "sw", "conversation_id": conversation_id})

    add_to_history(user_id, conversation_id, "User", user_input)

    # For Swahili mode: Always translate to English, search English corpus, generate in English, then translate to Swahili
    # For English mode: Use existing retrieval (unchanged)
    if language == "sw":
        # Always use English corpus for retrieval when generating in English
        # Translate query to English first
        print("🔄 Translating Swahili query to English...")
        if not TRANSLATION_AVAILABLE:
            print("⚠️ Translation not available, falling back to direct Swahili search")
            raw_context_unfiltered = retrieve_context(user_input, top_k=5, similarity_threshold=0.4, language="sw")
            query_for_generation = user_input
        else:
            try:
                if USE_RUNTIME_TRANSLATION:
                    load_translation_models()
                
                query_en = translate_sw_to_en(user_input)
                print(f"✅ Translated: '{user_input[:50]}...' → '{query_en[:50]}...'")
                
                # Post-process translation to fix common errors
                query_en_lower = query_en.lower()
                if "help to come" in query_en_lower or "help come" in query_en_lower:
                    query_en = query_en.replace("help to come", "how to help with").replace("help come", "how to help with")
                    print(f"   Fixed translation: '{query_en[:50]}...'")
                
                if "labor pain" in query_en_lower and ("hedhi" in user_input.lower() or "period" in query_en_lower):
                    query_en = query_en.replace("labor pain", "period pain").replace("labor pains", "period pain")
                    print(f"   Fixed translation: '{query_en[:50]}...'")
                
                # Search English corpus with translated query (model needs English context)
                print("🔍 Searching English corpus with translated query...")
                raw_context_unfiltered = retrieve_context(query_en, top_k=5, similarity_threshold=0.5, language="en")
                query_for_generation = query_en
            except Exception as e:
                print(f"⚠️ Translation failed: {e}, using direct Swahili search")
                raw_context_unfiltered = retrieve_context(user_input, top_k=5, similarity_threshold=0.4, language="sw")
                query_for_generation = user_input
    else:
        # English mode - use existing retrieval (unchanged)
        raw_context_unfiltered = retrieve_context(user_input, top_k=5, similarity_threshold=0.5, language=language)
        query_for_generation = user_input
    
    # Additional filtering: remove irrelevant context
    raw_context = raw_context_unfiltered
    if raw_context:
        # Remove sentences that contain irrelevant terms for this query
        query_lower = user_input.lower()
        context_sentences = raw_context.split('.')
        filtered_sentences = []
        
        # Define irrelevant terms based on query
        irrelevant_terms = []
        if "pcos" in query_lower or "polycystic" in query_lower:
            irrelevant_terms = ["menarche", "first period", "puberty", "ages of 10 and 16"]
        elif "endometriosis" in query_lower:
            irrelevant_terms = ["menarche", "first period", "puberty", "ages of 10 and 16"]
        elif "swim" in query_lower:
            irrelevant_terms = ["menarche", "first period"]
        
        for sent in context_sentences:
            sent = sent.strip()
            if not sent:
                continue
            # Skip if sentence contains irrelevant terms
            if irrelevant_terms and any(term in sent.lower() for term in irrelevant_terms):
                continue
            filtered_sentences.append(sent)
        
        raw_context = '. '.join(filtered_sentences)
    
    # Summarize context to 80-120 words
    context = summarize_context(raw_context, max_words=120)
    
    # Store raw_context for fallback use (before summarization)
    raw_context_for_fallback = raw_context if raw_context else raw_context_unfiltered
    
    # For Swahili: if context is very limited, still try to generate (model has knowledge)
    if language == "sw" and (not context or len(context.split()) < 20):
        print("⚠️ Limited context for Swahili query, but proceeding with generation")
        # Don't use fallback immediately - let the model try to generate
    
    history_text = format_history(user_id, conversation_id)

    # Detect emotion (use translated query for Swahili to get better emotion detection)
    if language == "sw" and 'query_for_generation' in locals() and query_for_generation != user_input:
        # Use translated query for better emotion detection in English
        emotion = detect_emotion(query_for_generation)
    else:
        emotion = detect_emotion(user_input)

    # Build emotion-specific tone wrapper
    # For Swahili mode: Always use English instructions (we generate in English, then translate)
    # For English mode: Use English instructions (unchanged)
    if language == "sw":
        # Always use English instructions (we always generate in English, then translate)
        if emotion == "pain":
            emotion_instruction = "The user is in physical pain. Be soothing, practical, and offer immediate comfort. Acknowledge their pain first, then provide helpful solutions."
        elif emotion == "anxious":
            emotion_instruction = "The user is anxious or scared. Be grounding, calming, and reassuring. Use very gentle, supportive language to help them feel safe."
        elif emotion == "sad":
            emotion_instruction = "The user feels sad. Be emotionally supportive, validating, and compassionate. Let them know their feelings are valid."
        else:
            emotion_instruction = "The user has a general question. Use a warm, friendly, conversational tone—like talking to a close friend."
    else:
        if emotion == "pain":
            emotion_instruction = "The user is in physical pain. Be soothing, practical, and offer immediate comfort. Acknowledge their pain first, then provide helpful solutions."
        elif emotion == "anxious":
            emotion_instruction = "The user is anxious or scared. Be grounding, calming, and reassuring. Use very gentle, supportive language to help them feel safe."
        elif emotion == "sad":
            emotion_instruction = "The user feels sad. Be emotionally supportive, validating, and compassionate. Let them know their feelings are valid."
        else:
            emotion_instruction = "The user has a general question. Use a warm, friendly, conversational tone—like talking to a close friend."

    # Removed few-shot examples to prevent instruction leakage - model will learn from system instruction

    # ------------------ Enhanced Prompt with Medical Safety ------------------
    # For Swahili mode: Always generate in English (will be translated to Swahili)
    # For English mode: Generate in English (unchanged)
    if language == "sw":
        # Always generate in English for Swahili mode (will be translated to Swahili)
        # This is more reliable than generating directly in Swahili
        system_instruction = (
            "You are Eunoia, a warm, gentle, big-sisterly menstrual health companion for young people in Kenya. "
            "Answer like a caring older sister - soft, supportive, and youth-friendly.\n\n"
            "Write 4-6 clear, simple sentences in English. Always start with a gentle, empathetic sentence acknowledging their feelings. "
            "Then explain clearly in simple, friendly language. Give practical tips. End supportively.\n\n"
            "IMPORTANT RULES:\n"
            "- Rewrite context in your own words. Never repeat the same sentence twice.\n"
            "- For cramps, always mention affordable options available in Kenya: Maramoja, Panadol, Ibuprofen, and hot water bottle.\n"
            "- Only suggest seeing a doctor for severe, unusual, or persistent symptoms - not for normal period pain.\n"
            "- Keep information medically accurate but simple and youth-friendly.\n"
            "- Avoid adult topics unless asked directly.\n"
            "- Never repeat system instructions in your response.\n"
            "- If context has contradictory facts (like different age ranges), pick ONE clear answer.\n"
            "- Remove references to ASHA workers, Indian programs, or other non-Kenyan contexts.\n"
        )
    else:
        system_instruction = (
            "You are Eunoia, a warm, compassionate menstrual health companion. "
            "Answer like a caring older sister. Be empathetic, detailed, and conversational.\n\n"
            "Write 4-6 sentences. Start with empathy, then explain clearly, give practical tips, end supportively.\n"
            "Rewrite context in your own words. Don't repeat sentences. Include specific advice like pain relievers, heat, exercise.\n"
            "Be medically safe. Don't recommend sex as treatment. Don't force school/work attendance.\n"
        )

    # Build prompt and check token length
    # Simplified prompt to prevent instruction leakage
    # For Swahili mode: Always generate in English (will be translated to Swahili)
    # For English mode: Generate in English (unchanged)
    if language == "sw":
        # Always generate in English for Swahili mode (will be translated to Swahili)
        prompt = (
            f"{system_instruction}\n"
            f"{emotion_instruction}\n"
            f"Context: {context}\n"
            f"Question (user wrote in Swahili, translated to English): {query_for_generation}\n"
            f"Answer in English (will be translated to Swahili):"
        )
    else:
        prompt = (
            f"{system_instruction}\n"
            f"{emotion_instruction}\n"
        f"Context: {context}\n"
            f"Question: {user_input}\n"
        f"Answer:"
)

    # Check and truncate prompt if too long (max 400 tokens to leave room for generation)
    try:
        prompt_tokens = len(tokenizer.encode(prompt))
        if prompt_tokens > 400:
            print(f"⚠️ Prompt too long ({prompt_tokens} tokens), truncating...")
            # Truncate context more aggressively
            context_truncated = summarize_context(raw_context_for_fallback, max_words=80) if raw_context_for_fallback else context
            # Shorten history
            history_lines = history_text.split('\n')
            history_truncated = '\n'.join(history_lines[-2:]) if len(history_lines) > 2 else history_text
            
            if language == "sw":
                # Always generate in English for Swahili mode (will be translated to Swahili)
                prompt = (
                    f"{system_instruction}\n"
                    f"{emotion_instruction}\n"
                    f"Context: {context_truncated}\n"
                    f"Question (user wrote in Swahili, translated to English): {query_for_generation}\n"
                    f"Answer in English (will be translated to Swahili):"
                )
            else:
                prompt = (
                    f"{system_instruction}\n"
                    f"{emotion_instruction}\n"
                    f"Context: {context_truncated}\n"
                    f"Question: {user_input}\n"
                    f"Answer:"
                )
            prompt_tokens = len(tokenizer.encode(prompt))
            print(f"🔢 Truncated prompt token count: {prompt_tokens}")
    except Exception as e:
        print(f"⚠️ Error counting tokens: {e}, proceeding anyway...")

    # ------------------ Generate ------------------
    try:
        response = chat_pipe(
        prompt,
            repetition_penalty=1.8,       # Strong penalty to prevent repetition
            no_repeat_ngram_size=5,       # Prevent 5-gram repetition (longer phrases)
            num_beams=4,
            early_stopping=True,
            temperature=0.85,             # Slightly more creative for varied responses
            top_p=0.9,
            do_sample=True                # Enable sampling for more variety
    )[0]["generated_text"].strip()
        
        # For Swahili mode: Always translate (we always generate in English)
        # For English mode: Response stays in English (unchanged)
        if language == "sw":
            # Always translate (we always generate in English)
            print("🔄 Translating English response to Swahili with Helsinki-NLP...")
            try:
                if not TRANSLATION_AVAILABLE:
                    print("⚠️ Translation not available, keeping English response")
                else:
                    # Ensure translation models are loaded
                    if USE_RUNTIME_TRANSLATION:
                        load_translation_models()
                    
                    response = translate_en_to_sw(response)
                    print("✅ Response translated to Swahili")
            except Exception as e:
                print(f"⚠️ Translation error: {e}, keeping English response")
                # Response stays in English as fallback
        
        # Check for instruction echo (CRITICAL - model is copying instructions)
        if language == "sw":
            instruction_echo_phrases = [
                "usikopi sentensi",
                "tafsiri na ueleze",
                "kwa maneno yako mwenyewe",
                "muktadha kwa kiingereza",
                "jibu kwa kiswahili",
                "andika sentensi",
                "pole najua",
                "ni muhimu kuzungumza",
                "mtaalamu wa afya",
                # Also check for English phrases that shouldn't appear
                "oxo-biodegradable",
                "suvidha at rs",
                "pmbjp",
                "janaushadhi",
                "janaushadindras",
                "ritual impurity",
                "derogatory or euphemistic",
                # Indian program acronyms and phrases
                "anms",
                "ashas",
                "awwwws",
                "auxiliary admiles",
                "mwanaharakati wa afya",
                "wafanyakazi wa angandidi",
                "beti bachao",
                "beti padhao",
                "pradhan mantri",
                "bhartiya janaushadhi",
                "walimu na wafanyakazi",
                "kudumisha usafi",
                "mabovu ya usafi",
                "mashambani",
                "gharama kubwa",
                "mpango wa kuendeleza",
            ]
        else:
            instruction_echo_phrases = [
                "use a warm, detailed, compassionate response",
                "4-6 sentences minimum",
                "do not use generic closings",
                "do not copy or repeat",
                "rewrite all information",
                "be warm, validating, and conversational",
                "start with validation",
                "give a clear, medical",
                "provide optional tips",
                "end with a gentle",
                "follow this exactly",
                "response structure",
                "critical rules",
                "do not give generic responses",
                "maintain a healthy lifestyle",
                "exercise regularly and get enough sleep",
                "be patient and patient-friendly",
                "don't be afraid to talk",
                "make sure you understand",
                "talk to a healthcare provider or healthcare provider",  # Duplicate phrase
                "be patient and patient",  # Repetitive
                "avoid over-the-counter pain relievers",  # Wrong advice (should be "use", not "avoid")
            ]
        
        is_echoing_instructions = any(phrase in response.lower() for phrase in instruction_echo_phrases)
        
        # Also check for obvious context copying (English phrases in Swahili response)
        if language == "sw":
            english_phrases_in_swahili = [
                "oxo-biodegradable", "suvidha", "pmbjp", "janaushadhi", "janaushadindras", "rs.", 
                "ritual impurity", "derogatory", "euphemistic", "abstaining from sexual",
                "natural biological process", "sanitary napkins named",
                # Indian program acronyms
                "anms", "ashas", "awwwws", "auxiliary", "admiles",
                "mwanaharakati wa afya ya kijamii", "wafanyakazi wa angandidi",
                "beti bachao", "beti padhao", "pradhan mantri", "bhartiya",
                "walimu na wafanyakazi", "kudumisha usafi", "mabovu ya usafi",
                "mashambani", "gharama kubwa", "mpango wa kuendeleza"
            ]
            has_english_context = any(phrase in response.lower() for phrase in english_phrases_in_swahili)
            if has_english_context:
                print("⚠️ Swahili response contains copied English context, using empathetic fallback")
                is_echoing_instructions = True
        
        if is_echoing_instructions:
            print("⚠️ Model is echoing instructions or copying context, using empathetic fallback module")
            if not context or len(context.split()) < 20:
                context = raw_context_for_fallback
            response = create_empathetic_response(user_input, context, emotion, language)
        
        # For Swahili: Check if response contains English phrases that shouldn't be there
        if language == "sw":
            english_phrases = [
                "oxo-biodegradable", "suvidha", "pmbjp", "janaushadhi", "janaushadindras", "rs.", "rs ",
                "ritual impurity", "derogatory", "euphemistic", "abstaining from sexual",
                "natural biological process", "sanitary napkins named", "ensures access",
                "affordable sanitary", "quality medicines", "per pad", "promoting menstrual",
                "birth control pills", "manage symptoms", "no cure", "your doctor might",
                # Indian program acronyms
                "anms", "ashas", "awwwws", "auxiliary", "admiles",
                "beti bachao", "beti padhao", "pradhan mantri", "bhartiya",
                "walimu na wafanyakazi", "kudumisha usafi", "mabovu ya usafi",
                "mashambani", "gharama kubwa", "mpango wa kuendeleza"
            ]
            has_english = any(phrase in response.lower() for phrase in english_phrases)
            if has_english:
                print("⚠️ Swahili response contains English context, using empathetic fallback")
                if not context or len(context.split()) < 20:
                    context = raw_context_for_fallback
                response = create_empathetic_response(user_input, context, emotion, language)
        
        # Check if response is too generic or poor quality
        generic_phrases = [
            "talk to a trusted teacher",
            "talk to a school nurse",
            "talk to your doctor",
            "consult a healthcare professional"
        ]
        
        is_too_generic = (
            any(phrase in response.lower() for phrase in generic_phrases) 
            and (
                len(response.split()) < 50  # Increased threshold
                or response.lower().count("talk to") >= 2  # Multiple "talk to" phrases
                or (response.lower().count("talk to") >= 1 and len(response.split()) < 30)  # Even one "talk to" if very short
            )
        )
        
        # Check if response is too short, too generic, or doesn't answer the question
        word_count = len(response.split())
        sentence_count = len([s for s in response.split('.') if s.strip()])
        
        # For Swahili, be more lenient with response length (model might generate shorter responses)
        min_words = 20 if language == "sw" else 30
        min_sentences = 2 if language == "sw" else 3
        
        if word_count < min_words or sentence_count < min_sentences or is_too_generic:
            # Use empathetic fallback module
            print(f"⚠️ Response too generic/short (words: {word_count}, sentences: {sentence_count}), using empathetic fallback module")
            # Use raw_context if context is empty or too filtered
            if not context or len(context.split()) < 20:
                print("⚠️ Context too filtered, using raw context for fallback")
                context = raw_context_for_fallback  # Use unfiltered context as fallback
            response = create_empathetic_response(user_input, context, emotion, language)
        else:
            # Validate and clean response
            response = validate_and_clean_response(response, user_input)
            
            # Final check: if response is still too short after validation
            word_count_after = len(response.split())
            sentence_count_after = len([s for s in response.split('.') if s.strip()])
            # For Swahili, be more lenient
            min_words_after = 20 if language == "sw" else 30
            min_sentences_after = 2 if language == "sw" else 3
            if word_count_after < min_words_after or sentence_count_after < min_sentences_after:
                print(f"⚠️ Response still too short after validation, using empathetic fallback")
                # Use raw_context if context is empty or too filtered
                if not context or len(context.split()) < 20:
                    context = raw_context_for_fallback  # Use unfiltered context as fallback
                response = create_empathetic_response(user_input, context, emotion, language)

    except Exception as e:
        print(f"Error in generation: {str(e)}")
        # Use empathetic fallback on error
        if not context or len(context.split()) < 20:
            context = raw_context_for_fallback
        response = create_empathetic_response(user_input, context, emotion, language)

    add_to_history(user_id, conversation_id, "Assistant", response)

    return jsonify({
        "response": response,
        "emotion": emotion,
        "language": language,
        "conversation_id": conversation_id
    })

# ------------------ 🔟 Chat History Endpoints ------------------
@app.route("/chat/clear", methods=["POST"])
def clear_chat_history():
    """Clear conversation history for a user"""
    data = request.get_json()
    user_id = data.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        # Delete the conversation file
        file_path = get_user_conversations_file(user_id)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"✅ Cleared chat history for user: {user_id}")
        
        return jsonify({
            "success": True,
            "message": "Chat history cleared successfully"
        })
    except Exception as e:
        print(f"Error clearing chat history: {e}")
        return jsonify({"error": "Failed to clear chat history"}), 500

# ------------------ 🔟 Chat History Endpoints ------------------
@app.route("/chat/conversations", methods=["GET"])
def list_conversations():
    """List all conversations for a user"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    conversations_data = load_user_conversations(user_id)
    conversations = conversations_data.get("conversations", {})
    
    # Convert to list and sort by updated_at (most recent first)
    conversation_list = []
    for conv_id, conv_data in conversations.items():
        conversation_list.append({
            "conversation_id": conv_id,
            "title": conv_data.get("title", "New Chat"),
            "created_at": conv_data.get("created_at"),
            "updated_at": conv_data.get("updated_at"),
            "message_count": len(conv_data.get("messages", []))
        })
    
    # Sort by updated_at descending
    conversation_list.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    
    return jsonify({
        "user_id": user_id,
        "conversations": conversation_list
    })

@app.route("/chat/conversations", methods=["POST"])
def create_conversation():
    """Create a new conversation"""
    data = request.get_json()
    user_id = data.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    conversation_id = create_new_conversation(user_id)
    
    return jsonify({
        "success": True,
        "conversation_id": conversation_id,
        "message": "New conversation created"
    })

@app.route("/chat/conversations/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    """Get a specific conversation"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    conversations_data = load_user_conversations(user_id)
    conversations = conversations_data.get("conversations", {})
    
    if conversation_id not in conversations:
        return jsonify({"error": "Conversation not found"}), 404
    
    conv_data = conversations[conversation_id]
    
    return jsonify({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "title": conv_data.get("title", "New Chat"),
        "created_at": conv_data.get("created_at"),
        "updated_at": conv_data.get("updated_at"),
        "messages": conv_data.get("messages", [])
    })

@app.route("/chat/conversations/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Delete a specific conversation"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        conversations_data = load_user_conversations(user_id)
        conversations = conversations_data.get("conversations", {})
        
        if conversation_id not in conversations:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Remove the conversation
        del conversations[conversation_id]
        conversations_data["conversations"] = conversations
        save_user_conversations(user_id, conversations_data)
        
        print(f"✅ Deleted conversation {conversation_id} for user: {user_id}")
        
        return jsonify({
            "success": True,
            "message": "Conversation deleted successfully"
        })
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        return jsonify({"error": "Failed to delete conversation"}), 500

@app.route("/chat/history", methods=["GET"])
def get_chat_history():
    """Get conversation history for a specific conversation"""
    user_id = request.args.get("user_id")
    conversation_id = request.args.get("conversation_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    messages = load_conversation_history(user_id, conversation_id)
    
    return jsonify({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "messages": messages
    })

# ------------------ 🔟 Run Flask server ------------------
if __name__ == "__main__":
    app.run(port=5000, debug=False)
