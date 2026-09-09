# %% [markdown]
# # SatQuery AI - Phase 1: Qwen2-VL-2B Baseline on Kaggle (T4 GPU)
# This notebook is designed to run on a free Kaggle T4 GPU (16GB VRAM) or Google Colab.
# It sets up Qwen2-VL-2B in 4-bit precision to avoid Out-Of-Memory (OOM) errors,
# and runs a baseline inference on a single remote sensing image.

# %% [code]
# CELL 1: Install Dependencies
# Run this cell to install the required libraries.
# !pip install -q transformers bitsandbytes accelerate torchvision
# !pip install -q git+https://github.com/huggingface/transformers
# !pip install -q qwen-vl-utils

# %% [code]
# CELL 2: Import Libraries
import os
import torch
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor, BitsAndBytesConfig
from qwen_vl_utils import process_vision_info
from urllib.request import urlretrieve
from PIL import Image

# Print GPU info to confirm T4 is attached
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU Device: {torch.cuda.get_device_name(0)}")

# %% [code]
# CELL 3: Load Model in 4-bit (QLoRA Preparation)
# We load the 2B model in 4-bit to keep VRAM usage around 2-3GB.
model_id = "Qwen/Qwen2-VL-2B-Instruct"

print(f"Loading {model_id} in 4-bit precision...")

# Define quantization config for saving VRAM
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
)

model = Qwen2VLForConditionalGeneration.from_pretrained(
    model_id,
    device_map="auto",
    quantization_config=quantization_config,
    torch_dtype=torch.float16
)

# Initialize the processor (handles text tokenization and image resizing)
processor = AutoProcessor.from_pretrained(
    model_id, 
    min_pixels=256*28*28, 
    max_pixels=1280*28*28
)

print("Model and Processor loaded successfully! VRAM should be highly optimized.")

# %% [code]
# CELL 4: Get a Sample Remote Sensing Image
sample_image_url = "https://raw.githubusercontent.com/opengeos/datasets/master/images/landsat.png"
sample_image_path = "sample_satellite.png"

if os.path.exists(sample_image_path):
    os.remove(sample_image_path)

print("Downloading sample satellite image...")
urlretrieve(sample_image_url, sample_image_path)
    
image = Image.open(sample_image_path)
display(image)

# %% [code]
# CELL 5: Run Baseline Inference
query = "Analyze this remote sensing image. Describe the prominent geographical and man-made features."

messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": sample_image_path},
            {"type": "text", "text": query}
        ]
    }
]

print(f"Query: '{query}'\nGenerating baseline response...")

text_prompt = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
image_inputs, video_inputs = process_vision_info(messages)

inputs = processor(
    text=[text_prompt],
    images=image_inputs,
    videos=video_inputs,
    padding=True,
    return_tensors="pt"
)

inputs = inputs.to("cuda")

with torch.no_grad():
    generated_ids = model.generate(**inputs, max_new_tokens=128)

generated_ids_trimmed = [
    out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
]

output_text = processor.batch_decode(
    generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
)

print("\n--- BASELINE OUTPUT ---")
print(output_text[0])
print("-----------------------")

# %% [code]
# CELL 6: Next Steps check
print("If this ran successfully without OOM, the T4 environment is ready for BigEarthNet QLoRA Fine-tuning!")
