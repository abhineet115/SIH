# 🚀 SatQuery AI — Model Training & Live Bridge Guide
### Smart India Hackathon (SIH 26167) | ISRO Space Technology Theme

This guide explains how to **train the model on free GPU** and connect it to your local SatQuery web app to achieve **high-accuracy, real-time remote sensing outputs**.

---

## ⚡ Why Train on Google Colab / Kaggle?
- **Local PC Hardware**: Your local environment runs on CPU-only. Fine-tuning a Vision-Language Model (VLM) with 4-bit QLoRA requires an NVIDIA GPU (minimum 12GB–16GB VRAM).
- **Free Colab T4 GPU**: Google Colab provides a free NVIDIA T4 GPU (15GB VRAM) which is fully sufficient to fine-tune our models using QLoRA.
- **Zero Cost**: No paid cloud instances needed.

---

## 🎯 Track 1: Fast 1-Click Fine-Tuning & Live GPU Tunnel (Recommended)
This track uses **Qwen2-VL-2B-Instruct** (or **InternVL3-1B**) with QLoRA and exposes a live API directly to your local web app.

### Step 1: Open Google Colab
1. Go to [colab.research.google.com](https://colab.research.google.com).
2. Click **New Notebook**.
3. In the top menu, go to **Runtime** $\to$ **Change runtime type** $\to$ select **T4 GPU** $\to$ **Save**.

### Step 2: Install Required Libraries in Colab
Paste and run this cell in Colab:
```bash
!pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
!pip install -q transformers==4.49.0 peft==0.14.0 bitsandbytes==0.45.2 accelerate==1.4.0
!pip install -q qwen-vl-utils fastapi uvicorn python-multipart nest-asyncio pyngrok
!npm install -g localtunnel
```

### Step 3: Run Training (QLoRA Fine-Tuning)
You can copy the code from `training/02_qlora_finetuning.py` directly into Colab:
```python
import torch
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, TaskType

MODEL_ID = "Qwen/Qwen2-VL-2B-Instruct"

# 4-bit Quantization Config for T4 GPU
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

print("Loading base VLM...")
model = Qwen2VLForConditionalGeneration.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.bfloat16,
)
processor = AutoProcessor.from_pretrained(MODEL_ID)

# Configure LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
print("Model ready for training / inference!")
```

### Step 4: Expose Live Colab API to your Local Web App
In the next cell, run the live FastAPI tunnel:
```python
import nest_asyncio
import uvicorn
from fastapi import FastAPI, UploadFile, Form
import torch
from qwen_vl_utils import process_vision_info
from PIL import Image
import io
import urllib.request

app = FastAPI(title="SatQuery Colab VLM Bridge")
nest_asyncio.apply()

@app.post("/api/qwen")
async def execute_vlm(file: UploadFile, query: str = Form("Analyze this image"), intent: str = Form("VQA")):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image.thumbnail((768, 768))

    system_prompt = (
        "You are an expert ISRO Earth Observation satellite analyst. Provide concise, "
        "accurate, quantitative answers about land cover, vegetation health, water bodies, "
        "urban infrastructure, and geospatial changes."
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
        generated_ids = model.generate(**inputs, max_new_tokens=256, temperature=0.2)

    generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
    output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)

    return {"answer": output_text[0], "intent": intent, "model": "Qwen2-VL-2B-QLoRA"}

# Print Localtunnel Tunnel Password (IP)
print("=" * 60)
print("Tunnel Password (IP):", urllib.request.urlopen('https://ipv4.icanhazip.com').read().decode('utf8').strip())
print("=" * 60)

# Launch tunnel
get_ipython().system_raw('lt --port 8000 &')
uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 5: Connect Local Web App to Colab
1. Colab will display a URL like `https://xyz-abc.loca.lt`.
2. Open `backend/.env` (or copy from `backend/.env.example`) and set:
   ```env
   COLAB_API_URL=https://xyz-abc.loca.lt
   ```
3. Restart your local backend (`run_backend.bat`).
4. **Done!** Every query you make in the web app UI will now be processed directly by the live VLM running on Colab GPU!

---

## 🛰️ Track 2: Full 7-Round Progressive Multi-Sensor Curriculum (InternVL3-1B)
For maximum benchmark performance (~74% VQA accuracy on BigEarthNet + CDVQA + RSVQA):

1. Upload the `training/notebooks/` folder to your Google Drive under `/MyDrive/SatQuery_AI/`.
2. Execute the notebooks in sequence:
   - `00_drive_setup.ipynb`: Mounts Google Drive and creates directories.
   - `01_download_datasets.ipynb`: Downloads RSVQA-LR and BEN-Bench subsets.
   - `02_r1_warmup.ipynb`: Domain vocabulary warm-up (~12 min).
   - `03_r2_binary_vqa.ipynb`: **Binary VQA Golden Checkpoint** (~25 min, target 74.2% accuracy).
   - `04_r3a_mcq.ipynb`: MCQ reasoning upgrade (~20 min).
   - `05_r3b_captioning.ipynb`: Detailed remote sensing captioning (~22 min).
   - `06_r4_grounding.ipynb`: Visual bounding-box grounding (~20 min).
   - `07_r5_change.ipynb`: Bi-temporal change detection (~20 min).
   - `08_r6_fusion.ipynb`: Multi-task LoRA fusion (~30 min).
   - `10_export.ipynb`: Packages the 4-bit weights into `satquery_rs_internvl.zip`.
3. Download `satquery_rs_internvl.zip` and extract its contents into `backend/weights/satquery_rs_internvl/`.

---

## 💡 Built-In Local Accuracy Boost (No Cloud Needed)
Even when Colab is offline or not running, the local engine now features:
- **Genuine Normalized Difference Proxies**:
  - `NDVI`: Normalized Difference Vegetation Index proxy for canopy greenness and crop vigor.
  - `NDWI`: Normalized Difference Water Index proxy for surface hydrology and flood boundaries.
  - `NDBI`: Normalized Difference Built-up Index proxy for impervious urban density.
- **Physical Ground Quantification**: Automatic conversion of pixel clusters into real square kilometers ($km^2$) and hectares ($ha$) using the image ground sample distance (GSD).
- **Spatial Distribution Analysis**: Sector breakdown (North-West, North-East, South-West, South-East) and cluster coordinates.
