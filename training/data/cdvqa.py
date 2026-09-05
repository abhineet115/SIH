"""
cdvqa.py: Change Detection VQA dataset loader for Round 5.
2,968 bi-temporal image pairs with change questions.
"""

import json
import torch
import numpy as np
from pathlib import Path
from typing import Dict, Optional
from PIL import Image
from torch.utils.data import Dataset


class CDVQADataset(Dataset):
    """
    CDVQA: Change Detection Visual Question Answering.
    Each sample has two images (T1, T2) and a change-related question.
    
    Maps to RS-InternVL's dual-image forward pass (s2_pixels, s2_pixels_t2).
    """

    def __init__(
        self,
        data_path: str,
        tokenizer=None,
        image_size: int = 224,
        max_seq_len: int = 192,
    ):
        self.tokenizer = tokenizer
        self.image_size = image_size
        self.max_seq_len = max_seq_len

        with open(data_path) as f:
            self.samples = json.load(f)

        # Normalize to list format
        if isinstance(self.samples, dict):
            self.samples = list(self.samples.values())

        print(f"[CDVQA] Loaded {len(self.samples)} change detection pairs")

    def __len__(self):
        return len(self.samples)

    def _load_optical_as_s2(self, path: str) -> torch.Tensor:
        """Load optical image and expand to 10-band format."""
        try:
            img = Image.open(path).resize((self.image_size, self.image_size))
            arr = np.array(img).astype(np.float32) / 255.0
            if arr.ndim == 2:
                arr = np.stack([arr] * 3, axis=0)
            elif arr.shape[-1] >= 3:
                arr = arr[:, :, :3].transpose(2, 0, 1)

            out = np.zeros((10, self.image_size, self.image_size), np.float32)
            out[:3] = arr[:3]
            out[3:] = arr[0]
        except Exception:
            out = np.zeros((10, self.image_size, self.image_size), np.float32)

        return torch.from_numpy(out)

    def __getitem__(self, idx: int) -> Dict:
        sample = self.samples[idx]

        t1_path = sample.get("img1", sample.get("t1_path", ""))
        t2_path = sample.get("img2", sample.get("t2_path", ""))
        question = sample.get("question", "Has the land cover changed between these two images?")
        answer = str(sample.get("answer", sample.get("label", "Yes")))

        s2_t1 = self._load_optical_as_s2(t1_path)
        s2_t2 = self._load_optical_as_s2(t2_path)
        s1_zeros = torch.zeros(2, self.image_size, self.image_size)

        if self.tokenizer is not None:
            prompt = (
                f"You are comparing two satellite images taken at different times.\n"
                f"Question: {question}\nAnswer:"
            )
            full_text = f"{prompt} {answer}{self.tokenizer.eos_token}"
            enc = self.tokenizer(
                full_text, max_length=self.max_seq_len,
                padding="max_length", truncation=True, return_tensors="pt"
            )
            prompt_len = len(self.tokenizer(prompt)["input_ids"])
            labels = enc["input_ids"].squeeze().clone()
            labels[:prompt_len] = -100

            return {
                "s2_pixels": s2_t1,           # T1
                "s2_pixels_t2": s2_t2,        # T2 (change detection)
                "s1_pixels": s1_zeros,
                "s1_pixels_t2": s1_zeros,
                "input_ids": enc["input_ids"].squeeze(),
                "attention_mask": enc["attention_mask"].squeeze(),
                "labels": labels,
            }

        return {
            "s2_pixels": s2_t1,
            "s2_pixels_t2": s2_t2,
            "s1_pixels": s1_zeros,
            "prompt": question,
            "target": answer,
            "task_type": "change_vqa",
        }
