# Menstrual Health Chatbot (Kenyan Youth–Focused)

A web-based, AI-powered menstrual health chatbot designed to provide **accurate, empathetic, and culturally sensitive guidance** to adolescents and young women in Kenya.  
The chatbot leverages **NLP, RAG (Retrieval-Augmented Generation), and sentiment analysis** to deliver reliable menstrual health information in both **English and Kiswahili**.

---

## 🌸 Project Overview

Access to youth-friendly menstrual health education in Kenya is limited due to stigma, cultural taboos, and misinformation.  
This project develops a **React + Next.js web application** with a **Flask backend**, enabling users to:

- Ask questions about menstrual health  
- Receive contextually accurate, culturally sensitive answers  
- Interact in **English or Kiswahili**  
- Benefit from emotionally aware responses  

The system combines a **fine-tuned Flan-T5 model** with a **vector-based RAG pipeline (FAISS)** to ensure precise and reliable information delivery.

---

## ⚡ Key Features

- **Conversational Menstrual Health Support**: Guidance on cycles, hygiene, symptoms, and conditions.  
- **Cultural & Linguistic Sensitivity**: Supports **Kiswahili** and local terminology, making the chatbot relatable to Kenyan youth.  
- **Emotionally Intelligent Responses**: Uses sentiment analysis to adapt tone and provide empathetic support.  
- **RAG-Based Knowledge Retrieval**: Combines curated datasets with semantic search to provide **factually accurate answers**.  
- **Modern Web Interface**: Built with **React + Next.js** and styled with **Tailwind CSS** for a responsive, user-friendly experience.  
- **Firebase Authentication**: Secure login and personalized user experience.

---

## 🏗️ Project Structure

```
menstrual_health_chatbot/
├── backend/
│ ├── model/
│ │ ├── config.json
│ │ ├── generation_config.json
│ │ ├── special_tokens_map.json
│ │ ├── tokenizer.json
│ │ └── tokenizer_config.json
│ ├── TRANSLATION_README.md
│ ├── app.py
│ ├── build_swahili_index.py
│ ├── check_progress.py
│ ├── complete_swahili_setup.py
│ ├── download_model.py
│ ├── evaluate_model_rag.py
│ ├── evaluation_results.json
│ ├── generate_report.py
│ ├── menstrual_data.csv
│ ├── menstrual_data_sw.csv
│ ├── requirements.txt
│ └── translation_utils.py
├── public/
│ └── vite.svg
├── src/
│ ├── assets/
│ ├── components/
│ ├── contexts/
│ ├── utils/
│ ├── App.css
│ ├── App.jsx
│ ├── ChatPage.jsx
│ ├── Config.js
│ ├── EducationPage.jsx
│ ├── HomePage.jsx
│ ├── Login.jsx
│ ├── ProfilePage.jsx
│ ├── Signup.jsx
│ ├── TrackCyclePage.jsx
│ ├── WelcomePage.jsx
│ ├── index.css
│ └── main.jsx
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
└── vite.config.js
```

---

## 🔧 Tech Stack

**Frontend:**  
- React + Next.js  
- Tailwind CSS  
- Firebase Authentication  

**Backend & NLP:**  
- Python (Flask)  
- Hugging Face Transformers (Flan-T5 fine-tuned)  
- PyTorch  
- RAG pipeline with FAISS vector search  
- Pandas, NLTK, Scikit-learn  

**Database & Hosting:**  
- Firebase Firestore (for user data)

---

## 🎯 Objectives

- Provide **accurate menstrual health information** to Kenyan youth  
- Reduce **stigma** through culturally sensitive guidance  
- Offer **emotionally aware, empathetic digital support**  
- Enhance **accessibility** through English + Kiswahili support  

---

## 🤝 Contributing

Contributions are welcome! You can:  
- Improve NLP accuracy or expand datasets  
- Enhance Kiswahili and cultural sensitivity support  
- Upgrade frontend UI/UX  

Please create a **pull request** or open an **issue** to collaborate.

---

## 📝 License

This project is licensed under the **MIT License**.
