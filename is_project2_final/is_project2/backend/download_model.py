from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "alimama2/menstrual-health-chatbot-flan-t5"
save_path = "./model"

print("⬇️ Downloading model...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
tokenizer.save_pretrained(save_path)
model.save_pretrained(save_path)
print("✅ Model downloaded to", save_path)
