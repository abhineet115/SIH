# %% [markdown]
# # SatQuery AI - Colab Live FastAPI Bridge (Zero-Cost GPU Inference)
# This standalone script turns your free Google Colab T4 GPU into a live API endpoint.
# Your local SatQuery web app can talk to it to get real neural VLM outputs in real time!
#
# Usage in Google Colab:
# 1. Open Google Colab -> Select Runtime: T4 GPU
# 2. Run this entire notebook cell
# 3. Copy the generated localtunnel URL (e.g., https://cool-tiger-42.loca.lt)
# 4. Put `COLAB_API_URL=https://cool-tiger-42.loca.lt` in your local backend/.env file

# %% [code]
# Step 1: Install dependencies (run once in Colab)
# !pip install -q transformers>=4.45.0 accelerate>=0.30.0 qwen-vl-utils fastapi uvicorn python-multipart nest-asyncio
# !npm install -g localtunnel

import nest_asyncio
import uvicorn
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info
from PIL import Image
import io
import urllib.request
import os

app = FastAPI(title="SatQuery AI - Live Colab VLM Endpoint")
nest_asyncio.apply()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen2-VL-2B-Instruct")
print(f"[1/3] Loading Vision-Language Model '{MODEL_ID}' (FP16 on Colab GPU, ~4.4GB VRAM)...")

model = Qwen2VLForConditionalGeneration.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16,
    device_map="auto",
)
processor = AutoProcessor.from_pretrained(MODEL_ID)
print("[2/3] Model & Processor successfully initialized in Colab VRAM!")

@app.get("/")
def health_check():
    return {"status": "ONLINE", "model": MODEL_ID, "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"}

@app.post("/api/qwen")
async def execute_vlm(file: UploadFile, query: str = Form("Analyze this satellite image"), intent: str = Form("VQA")):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image.thumbnail((768, 768))

    system_prompt = (
        "You are SatQuery AI, an expert Earth Observation analyst specialized in Indian remote sensing data "
        "(ISRO Cartosat, RISAT, Sentinel-1 SAR, Sentinel-2 Optical). "
        "Answer the question with specific, quantitative, and spatially grounded observations. "
        "Describe land-use categories, vegetation vitality, aquatic bodies, or urban infrastructure."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": [
            {"type": "image", "image": image},
            {"type": "text", "text": query}
        ]}
    ]

    text_prompt = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    image_inputs, video_inputs = process_vision_info(messages)

    inputs = processor(
        text=[text_prompt],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt"
    ).to("cuda")

    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=192, temperature=0.2)

    generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
    output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)

    return {
        "answer": output_text[0],
        "intent": intent,
        "model": MODEL_ID,
        "device": "Google Colab T4 GPU"
    }

# [3/3] Retrieve Localtunnel unlock password & start tunnel
try:
    public_ip = urllib.request.urlopen('https://ipv4.icanhazip.com').read().decode('utf8').strip()
except Exception:
    public_ip = "Unknown"

print("\n" + "=" * 65)
print("🔑 Localtunnel Password (IP):", public_ip)
print("👉 Paste this IP if prompted by the Localtunnel webpage.")
print("👉 Copy the public URL generated below and put it in backend/.env:")
print("   COLAB_API_URL=https://xxxx.loca.lt")
print("=" * 65 + "\n")

# Run FastAPI and expose it to internet
# In Colab notebook, execute:
# !lt --port 8000 &
# uvicorn.run(app, host="0.0.0.0", port=8000)
