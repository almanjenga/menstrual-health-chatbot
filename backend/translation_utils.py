"""
Translation utilities for runtime translation
- English → Swahili: Helsinki-NLP/opus-mt-en-sw (MarianMT)
- Swahili → English: Bildad/Swahili-English_Translation (may be different architecture)
"""
import torch
from transformers import MarianMTModel, MarianTokenizer, AutoTokenizer, AutoModelForSeq2SeqLM

# Global model variables (loaded once)
en_sw_model = None
en_sw_tokenizer = None
sw_en_model = None
sw_en_tokenizer = None
sw_en_model_type = None  # Track if it's MarianMT or AutoModel

device = "cuda" if torch.cuda.is_available() else "cpu"

def load_translation_models():
    """Load translation models (call once at startup)"""
    global en_sw_model, en_sw_tokenizer, sw_en_model, sw_en_tokenizer, sw_en_model_type
    
    # English → Swahili: Use Helsinki-NLP (MarianMT)
    if en_sw_model is None:
        print("Loading English → Swahili translation model...")
        try:
            en_sw_tokenizer = MarianTokenizer.from_pretrained("Helsinki-NLP/opus-mt-en-sw")
            en_sw_model = MarianMTModel.from_pretrained("Helsinki-NLP/opus-mt-en-sw")
            en_sw_model.to(device)
            en_sw_model.eval()
            print("✅ Loaded English → Swahili model (Helsinki-NLP)")
        except Exception as e:
            print(f"⚠️ Error loading en-sw model: {e}")
    
    # Swahili → English: Use Bildad model (try AutoModel first, fallback to MarianMT)
    if sw_en_model is None:
        print("Loading Swahili → English translation model...")
        model_name = "Bildad/Swahili-English_Translation"
        print(f"   Using model: {model_name}")
        
        try:
            # Try AutoModel first (most common for custom models)
            sw_en_tokenizer = AutoTokenizer.from_pretrained(model_name)
            sw_en_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            sw_en_model.to(device)
            sw_en_model.eval()
            sw_en_model_type = "auto"
            print("✅ Loaded Swahili → English model (Bildad - AutoModel)")
        except Exception as e1:
            print(f"   AutoModel failed: {e1}")
            try:
                # Fallback to MarianMT if AutoModel doesn't work
                sw_en_tokenizer = MarianTokenizer.from_pretrained(model_name)
                sw_en_model = MarianMTModel.from_pretrained(model_name)
                sw_en_model.to(device)
                sw_en_model.eval()
                sw_en_model_type = "marian"
                print("✅ Loaded Swahili → English model (Bildad - MarianMT)")
            except Exception as e2:
                print(f"⚠️ ERROR loading sw-en model: {e2}")
                print(f"   Tried both AutoModel and MarianMT architectures")
                print(f"   Translation will not work until this is fixed!")
                sw_en_model = None
                sw_en_tokenizer = None
                sw_en_model_type = None

def naturalize_swahili(text):
    """Make Swahili translation more casual and natural (Kenyan Kiswahili style)"""
    if not text:
        return text
    
    # Replace formal phrases with casual equivalents
    replacements = {
        # Formal → Casual (order matters - longer phrases first)
        "Hilo lasikika kuwa": "Hii inaonekana kuwa",
        "lasikika kuwa": "inaonekana kuwa",
        "lasikika": "inaonekana",
        "kuwafikia wafanyakazi wa afya": "kuwasiliana na daktari",
        "kuwafikia": "kuwasiliana na",
        "wafanyakazi wa afya": "daktari",
        "huduma za simu kwa ajili ya": "huduma za daktari kupitia simu kwa",
        "huduma za simu": "huduma za daktari",
        "kwa ajili ya": "kwa",
        "utegemezo na uongozi": "msaada",
        "utegemezo": "msaada",
        "kitulizo": "faraja",
        "fikiria": "fikiria",
        "ni mbaya zaidi": "ni mbaya sana",
        "dalili zitadumu au ni mbaya zaidi": "dalili zitaendelea au zikibadilika",
        "dalili zitadumu": "dalili zitaendelea",
        "kutuliza maumivu": "kupunguza maumivu",
        "chupa ya maji moto": "chupa ya maji ya moto",
        # Make it more conversational
        "Ikiwa una": "Kama una",
        "Ikiwa": "Kama",
        "ni muhimu": "ni vizuri",
        "ni sawa": "sawa",
        # Simplify complex structures
        "ambaye anaweza kukusaidia": "ambaye anaweza kukusaidia",
        "ambayo zinaweza": "ambazo zinaweza",
        # Simplify medical terms
        "mtaalamu wa afya": "daktari",
        # Remove overly formal connectors
        "kwa hivyo": "",
        "hivyo basi": "",
        # Simplify verb forms
        "zitadumu": "zitaendelea",
        "zitabadilika": "zitabadilika",
    }
    
    result = text
    for formal, casual in replacements.items():
        if casual:  # Only replace if there's a replacement
            result = result.replace(formal, casual)
        else:  # Remove if replacement is empty
            result = result.replace(formal, "")
    
    # Simplify sentence structure - break long sentences
    sentences = result.split(". ")
    simplified_sentences = []
    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue
        # If sentence is too long (more than 25 words), try to simplify
        words = sent.split()
        if len(words) > 25:
            # Try to break at conjunctions
            if " au " in sent:
                parts = sent.split(" au ", 1)
                simplified_sentences.append(parts[0].strip() + ".")
                if len(parts) > 1:
                    simplified_sentences.append("Au " + parts[1].strip())
            elif " na " in sent and len(words) > 20:
                # Only break if it's really long
                parts = sent.split(" na ", 1)
                simplified_sentences.append(parts[0].strip() + ".")
                if len(parts) > 1:
                    simplified_sentences.append("Na " + parts[1].strip())
            else:
                simplified_sentences.append(sent)
        else:
            simplified_sentences.append(sent)
    
    result = ". ".join(simplified_sentences)
    
    # Clean up extra spaces and punctuation
    result = " ".join(result.split())
    result = result.replace("..", ".")
    result = result.replace("  ", " ")
    result = result.replace(" .", ".")
    result = result.replace(" ,", ",")
    
    # Ensure proper capitalization after periods
    if result:
        sentences = result.split(". ")
        capitalized = []
        for i, sent in enumerate(sentences):
            sent = sent.strip()
            if sent:
                if i == 0:
                    # First sentence - capitalize first letter
                    sent = sent[0].upper() + sent[1:] if len(sent) > 1 else sent.upper()
                else:
                    # Other sentences - capitalize first letter
                    sent = sent[0].upper() + sent[1:] if len(sent) > 1 else sent.upper()
                capitalized.append(sent)
        result = ". ".join(capitalized)
    
    return result.strip()

def translate_en_to_sw(text, max_length=512, naturalize=True):
    """Translate English text to Swahili, optionally naturalize to casual Kenyan Kiswahili"""
    if not text or not text.strip():
        return ""
    
    if en_sw_model is None:
        try:
            load_translation_models()
        except Exception as e:
            print(f"⚠️ Could not load translation models: {e}")
            return text  # Return original if models can't be loaded
    
    if en_sw_model is None:
        return text  # Fallback if still None
    
    try:
        inputs = en_sw_tokenizer(
            text, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=max_length
        ).to(device)
        
        with torch.no_grad():
            translated = en_sw_model.generate(
                **inputs, 
                max_length=max_length,
                num_beams=4,
                early_stopping=True
            )
        
        swahili_text = en_sw_tokenizer.decode(translated[0], skip_special_tokens=True)
        
        # Naturalize to make it more casual/conversational
        if naturalize:
            swahili_text = naturalize_swahili(swahili_text)
        
        return swahili_text
    except Exception as e:
        print(f"Translation error (en→sw): {e}")
        return text  # Return original if translation fails

def preprocess_swahili_query(text):
    """Preprocess Swahili query to improve translation quality"""
    if not text:
        return text
    
    original_text = text
    text_lower = text.strip().lower()
    
    # Direct mappings for common Swahili queries (exact matches first)
    direct_mappings = {
        "ninasaidia aje maumivu ya hedhi": "how to help with period pain",
        "ninasaidia aje maumivu ya cramps": "how to help with menstrual cramps",
        "ninasaidia aje maumivu ya tumbo": "how to help with stomach pain",
        "kwa njia gani nitasaidia maumivu kwa tumbo": "how to help with stomach pain",
        "kwa jinsi gani nitasaidia maumivu kwa tumbo": "how to help with stomach pain",
        "maumivu ya hedhi inasaidiwa aje": "how to help with period pain",
        "maumivu ya cramps inasaidiwa aje": "how to help with menstrual cramps",
        "ninasaidia aje": "how can I help with",
        "mbona hedhi yangu imechelewa": "why is my period late",
        "kwa nini hedhi yangu imechelewa": "why is my period late",
        "mbona hedhi imechelewa": "why is period late",
        "hedhi yangu imechelewa": "my period is late",
        "pcos ni nini": "what is PCOS",
        "ni nini pcos": "what is PCOS",
    }
    
    # Check for direct mapping first (case-insensitive, substring match)
    for swahili, english in direct_mappings.items():
        if swahili in text_lower:
            return english
    
    # Common Swahili question patterns that need better translation
    replacements = {
        "ninasaidia aje": "how can I help with",
        "kwa njia gani": "how",
        "kwa jinsi gani": "how",
        "ninawezaje kusaidia": "how can I help with",
        "nawezaje kusaidia": "how can I help with",
        "inasaidiwa aje": "how to help with",
        "inawezaje kusaidika": "how can it be helped",
        "mbona": "why",
        "kwa nini": "why",
        "ni nini": "what is",
        "ni nini hii": "what is this",
        "eleza": "explain",
        "ueleze": "explain to me",
        "maumivu ya hedhi": "period pain",
        "maumivu ya cramps": "menstrual cramps",
        "maumivu ya tumbo": "stomach pain",
        "hedhi imechelewa": "period is late",
        "hedhi yangu imechelewa": "my period is late",
        "imekuja mapema": "came early",
        "imekuja mapema sana": "came very early",
    }
    
    # Apply replacements
    result = text_lower
    for swahili, english in replacements.items():
        if swahili in result:
            result = result.replace(swahili, english)
    
    # If the query starts with a question word pattern, ensure it's a proper question
    if result.startswith("how") or result.startswith("why") or result.startswith("what"):
        # Already good
        pass
    elif "how" in result or "why" in result or "what" in result:
        # Has question word, might be okay
        pass
    else:
        # Try to add context if it's about pain/periods
        if "pain" in result or "cramp" in result or "period" in result:
            if "help" not in result:
                result = "how to help with " + result
            elif "how" not in result:
                result = "how " + result
    
    # If preprocessing didn't change much, return original (let model translate)
    if result == text_lower and len(result.split()) == len(original_text.split()):
        return original_text
    
    return result

def translate_sw_to_en(text, max_length=512):
    """Translate Swahili text to English with preprocessing"""
    if not text or not text.strip():
        return ""
    
    # Preprocess to improve translation quality
    preprocessed = preprocess_swahili_query(text)
    
    # If preprocessing returned English (direct mapping found), return it directly
    # Check if preprocessed text is already in English (contains common English words)
    if preprocessed != text:
        # Preprocessing changed the text - check if it's already English
        english_indicators = ["how", "why", "what", "when", "where", "help", "pain", "period", "stomach", "cramp", "late", "early", "pcos"]
        preprocessed_lower = preprocessed.lower()
        if any(indicator in preprocessed_lower for indicator in english_indicators):
            # Preprocessing returned English, return it directly (no translation needed)
            print(f"   Using direct mapping (no translation needed): '{preprocessed}'")
            return preprocessed
    
    if sw_en_model is None:
        try:
            load_translation_models()
        except Exception as e:
            print(f"⚠️ Could not load translation models: {e}")
            return text  # Return original if models can't be loaded
    
    if sw_en_model is None:
        print("⚠️ Swahili → English model not loaded, cannot translate")
        return text  # Fallback if still None
    
    try:
        # Use preprocessed text for better translation
        inputs = sw_en_tokenizer(
            preprocessed if preprocessed != text else text,  # Use preprocessed if different
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=max_length
        ).to(device)
        
        with torch.no_grad():
            translated = sw_en_model.generate(
                **inputs, 
                max_length=max_length,
                num_beams=4,
                early_stopping=True
            )
        
        english_text = sw_en_tokenizer.decode(translated[0], skip_special_tokens=True)
        
        # Post-process to fix common translation errors
        if "help to come" in english_text.lower() or "help come" in english_text.lower():
            # Fix "help to come" → "help with"
            english_text = english_text.replace("help to come", "help with")
            english_text = english_text.replace("help come", "help with")
        
        if "labor pains" in english_text.lower() and "period" in text.lower() or "hedhi" in text.lower():
            # Fix "labor pains" → "period pain" when talking about periods
            english_text = english_text.replace("labor pains", "period pain")
            english_text = english_text.replace("labor pain", "period pain")
        
        # Verify translation actually changed the text
        if english_text.strip().lower() == text.strip().lower():
            print(f"⚠️ Translation returned same text - translation may have failed")
            print(f"   Original: {text[:50]}")
            print(f"   Translated: {english_text[:50]}")
        
        return english_text
    except Exception as e:
        print(f"⚠️ Translation error (sw→en): {e}")
        print(f"   Original text: {text[:50]}...")
        return text  # Return original if translation fails

def translate_batch(texts, direction="en_sw", max_length=512):
    """Translate a batch of texts (more efficient)"""
    if not texts:
        return []
    
    if direction == "en_sw":
        if en_sw_model is None:
            load_translation_models()
        tokenizer = en_sw_tokenizer
        model = en_sw_model
    else:  # sw_en
        if sw_en_model is None:
            load_translation_models()
        tokenizer = sw_en_tokenizer
        model = sw_en_model
    
    try:
        inputs = tokenizer(
            texts, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=max_length
        ).to(device)
        
        with torch.no_grad():
            translated = model.generate(
                **inputs, 
                max_length=max_length,
                num_beams=4,
                early_stopping=True
            )
        
        translated_texts = tokenizer.batch_decode(translated, skip_special_tokens=True)
        return translated_texts
    except Exception as e:
        print(f"Batch translation error: {e}")
        return texts  # Return original if translation fails

