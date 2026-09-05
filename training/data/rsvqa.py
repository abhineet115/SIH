"""
rsvqa.py: RSVQA-LR (Low Resolution) dataset loader for Round 1 domain warm-up.
Tiny dataset (772 images, ~8 MB) — perfect first training step.
"""

import json
import torch
import numpy as np
from pathlib import Path
from typing import Optional, Dict
from PIL import Image
from torch.utils.data import Dataset


class RSVQADataset(Dataset):
    """
    RSVQA Low-Resolution dataset.
    Questions about optical aerial imagery (binary VQA format).
    Used for Round 1 domain warm-up — teaches the model RS concepts with RGB.
    """

    def __init__(
        self,
        data_path: str,
        tokenizer=None,
        image_size: int = 224,
        max_seq_len: int = 128,
    ):
        self.tokenizer = tokenizer
        self.image_size = image_size
        self.max_seq_len = max_seq_len

        with open(data_path) as f:
            raw = json.load(f)

        # Handle different RSVQA JSON formats
        if isinstance(raw, list):
            self.samples = raw
        elif "questions" in raw:
            # Merge questions with answers
            answers = {a["id"]: a["answer"] for a in raw.get("answers", [])}
            self.samples = [
                {
                    "image_path": q.get("image_path", q.get("img_id", "")),
                    "question": q["question"],
                    "answer": answers.get(q.get("answer_id", q.get("id")), "Yes"),
                }
                for q in raw["questions"]
            ]
        else:
            self.samples = list(raw.values()) if isinstance(raw, dict) else []

        print(f"[RSVQA] Loaded {len(self.samples)} samples from {data_path}")

    def __len__(self):
        return len(self.samples)

    def _load_image_as_s2(self, path: str) -> torch.Tensor:
        """Load RGB image and expand to 10-band S2 format via channel repetition."""
        try:
            img = Image.open(path).resize((self.image_size, self.image_size))
            arr = np.array(img).astype(np.float32) / 255.0
            if arr.ndim == 2:
                arr = np.stack([arr] * 3, axis=0)
            elif arr.shape[2] == 3:
                arr = arr.transpose(2, 0, 1)

            # Repeat RGB → 10 bands (first 3 real, rest duplicated)
            out = np.zeros((10, self.image_size, self.image_size), dtype=np.float32)
            out[:3] = arr[:3]
            out[3:] = arr[0]  # fill NIR+ with red band (approximation)
        except Exception:
            out = np.zeros((10, self.image_size, self.image_size), dtype=np.float32)

        return torch.from_numpy(out)

    def __getitem__(self, idx: int) -> Dict:
        sample = self.samples[idx]

        s2 = self._load_image_as_s2(sample.get("image_path", ""))
        # No SAR available for RSVQA — pass zeros
        s1 = torch.zeros(2, self.image_size, self.image_size)

        question = sample.get("question", "What is shown in this image?")
        answer = str(sample.get("answer", "Yes"))

        if self.tokenizer is not None:
            prompt = f"Question: {question}\nAnswer with Yes or No."
            full_text = f"{prompt}\n{answer}{self.tokenizer.eos_token}"
            enc = self.tokenizer(
                full_text, max_length=self.max_seq_len,
                padding="max_length", truncation=True, return_tensors="pt"
            )
            prompt_len = len(self.tokenizer(prompt)["input_ids"])
            labels = enc["input_ids"].squeeze().clone()
            labels[:prompt_len] = -100

            return {
                "s2_pixels": s2,
                "s1_pixels": s1,
                "input_ids": enc["input_ids"].squeeze(),
                "attention_mask": enc["attention_mask"].squeeze(),
                "labels": labels,
                "task_type": "binary_vqa",
            }

        return {
            "s2_pixels": s2,
            "s1_pixels": s1,
            "prompt": question,
            "target": answer,
            "task_type": "binary_vqa",
        }
