# %% [markdown]
# # SatQuery AI - Phase 2: QLoRA Fine-tuning on Kaggle/Colab (T4 GPU)
# This script demonstrates how to fine-tune the Qwen2-VL-2B model on a custom 
# Remote Sensing VQA dataset (like BigEarthNet.txt) using QLoRA in a 16GB VRAM environment.

# %% [code]
# CELL 1: Install Training Dependencies
# !pip install -q transformers bitsandbytes accelerate torchvision
# !pip install -q peft trl datasets
# !pip install -q git+https://github.com/huggingface/transformers
# !pip install -q qwen-vl-utils

# %% [code]
# CELL 2: Imports and Setup
import os
import torch
from transformers import (
    Qwen2VLForConditionalGeneration, 
    AutoProcessor, 
    BitsAndBytesConfig, 
    TrainingArguments
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset
from trl import SFTTrainer
from qwen_vl_utils import process_vision_info
from PIL import Image, ImageDraw
import random

print(f"CUDA Available: {torch.cuda.is_available()}")

# %% [code]
# CELL 3: Generate Mock Remote Sensing Dataset (To simulate BigEarthNet.txt)
# In production, replace this with: `dataset = load_dataset("json", data_files="bigearthnet.jsonl")`
print("Generating Mock Remote Sensing Dataset...")
os.makedirs("vqa_dataset", exist_ok=True)

dataset_samples = []
for i in range(50):
    img_path = f"vqa_dataset/img_{i}.png"
    # Create fake satellite patches (Water, Forest, Urban)
    img = Image.new('RGB', (256, 256), color=(
        random.randint(0, 100), random.randint(100, 200), random.randint(0, 100)
    ))
    img.save(img_path)
    
    # Formulate conversational prompt in Qwen2-VL format
    convo = [
        {"role": "user", "content": [
            {"type": "image", "image": img_path},
            {"type": "text", "text": "What type of land cover is primarily visible in this satellite patch?"}
        ]},
        {"role": "assistant", "content": [
            {"type": "text", "text": "The primary land cover consists of dense vegetation and forest canopies."}
        ]}
    ]
    dataset_samples.append({"messages": convo})

# Create HuggingFace Dataset
raw_dataset = Dataset.from_list(dataset_samples)
print(f"Generated {len(raw_dataset)} mock samples.")

# %% [code]
# CELL 4: Format Data for Trainer
model_id = "Qwen/Qwen2-VL-2B-Instruct"
processor = AutoProcessor.from_pretrained(model_id, min_pixels=256*28*28, max_pixels=1280*28*28)

def format_data(sample):
    # Apply Chat Template
    text = processor.apply_chat_template(sample["messages"], tokenize=False, add_generation_prompt=False)
    image_inputs, video_inputs = process_vision_info(sample["messages"])
    # Return formatted features
    return {"text": text, "images": image_inputs}

formatted_dataset = raw_dataset.map(format_data, remove_columns=["messages"])

def collate_fn(examples):
    # Batch processing with padding
    texts = [ex["text"] for ex in examples]
    images = [ex["images"] for ex in examples if ex["images"] is not None]
    
    inputs = processor(text=texts, images=images, padding=True, return_tensors="pt")
    inputs["labels"] = inputs["input_ids"].clone()
    return inputs

# %% [code]
# CELL 5: Load Model in 4-bit and Apply LoRA Adapters
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
)

model = Qwen2VLForConditionalGeneration.from_pretrained(
    model_id,
    device_map="auto",
    quantization_config=quantization_config,
    torch_dtype=torch.float16
)

# Prepare for QLoRA Training
model = prepare_model_for_kbit_training(model)

# Define LoRA target modules specifically for Qwen2-VL architecture
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

# Wrap model with PEFT
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# %% [code]
# CELL 6: Configure Trainer and Start Fine-tuning
training_args = TrainingArguments(
    output_dir="./satquery_qlora_outputs",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    num_train_epochs=1,
    fp16=True,
    logging_steps=5,
    save_strategy="epoch",
    optim="paged_adamw_8bit",
)

from transformers import Trainer

print("Loading Trainer...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=formatted_dataset,
    data_collator=collate_fn,
)

print("Starting QLoRA Fine-tuning...")
trainer.train()

print("Training Complete! Saving adapters...")
trainer.save_model("./satquery_final_adapter")
print("LoRA adapters saved successfully. SatQuery AI fine-tuning pipeline validated.")
