# %% [markdown]
# # SatQuery AI - Phase 3: Colab FastAPI Endpoint (Localtunnel)
# This code turns your Colab T4 GPU into a live API endpoint so your local Web App can talk to it!

# %% [code]
# 1. Install missing web libraries
# !pip install -q fastapi uvicorn python-multipart nest-asyncio
# !npm install -g localtunnel

# %% [code]
import nest_asyncio
import uvicorn
from fastapi import FastAPI, UploadFile, Form
from pydantic import BaseModel
import torch
from transformers import AutoProcessor
from qwen_vl_utils import process_vision_info
from PIL import Image
import io
import urllib

app = FastAPI(title="SatQuery Colab VLM Bridge")
nest_asyncio.apply()

# NOTE: The model and processor MUST BE ALREADY LOADED in the notebook memory!
# Make sure you ran the Baseline or Training cell earlier in your Colab session.

@app.post("/api/qwen")
async def execute_qwen(file: UploadFile, query: str = Form("Analyze this image"), intent: str = Form("VQA")):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # Fast resize for API speed (optional)
    image.thumbnail((512, 512)) 
    
    messages = [
        {"role": "user", "content": [
            {"type": "image", "image": image},
            {"type": "text", "text": query}
        ]}
    ]
    
    # Process through globally loaded Qwen model
    text_prompt = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    image_inputs, video_inputs = process_vision_info(messages)
    
    inputs = processor(text=[text_prompt], images=image_inputs, videos=video_inputs, padding=True, return_tensors="pt").to("cuda")
    
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=128)
    
    generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
    output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)
    
    return {"answer": output_text[0], "intent": intent}

# Retrieve the public IP needed to unlock Localtunnel
print("\n" + "="*50)
print("Localtunnel Tunnel Password (IP):", urllib.request.urlopen('https://ipv4.icanhazip.com').read().decode('utf8').strip("\n"))
print("="*50 + "\n")

# Run FastAPI and expose it to internet via localtunnel
# !lt --port 8000 & uvicorn --host 0.0.0.0 --port 8000 app:app
