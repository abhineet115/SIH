"""
ben_bench.py: BigEarthNet-Text BEN-Bench dataset loader.
Loads the 1,082 curated, manually-verified image pairs for training/evaluation.

Supports all 4 annotation types:
  - binary_vqa  : Yes/No questions (6,927 annotations)
  - mcq         : Multiple-choice (5,550 annotations)
  - captioning  : Scene descriptions (970 captions)
  - grounding   : Bounding box prediction (1,582 GenDet annotations)
"""

import json
import os
import torch
import numpy as np
from pathlib import Path
from torch.utils.data import Dataset
from typing import Optional, List, Dict, Tuple
from PIL import Image


# Sentinel-2 band statistics (from BigEarthNet-v2 training split)
S2_MEAN = [340.76, 429.92, 614.21, 590.23, 950.68, 1792.6, 2075.55,
           2218.94, 2119.35, 1594.42]  # 10 bands (10m + 20m)
S2_STD  = [554.81, 572.41, 582.87, 675.88, 729.89, 1096.01, 1273.07,
           1365.45, 1356.28, 1071.33]

# Sentinel-1 band statistics
S1_MEAN = [-12.619, -20.022]   # VV, VH (dB)
S1_STD  = [5.114, 5.857]


def normalize_s2(img: np.ndarray) -> np.ndarray:
    """Normalize 10-band S2 array to [0,1]."""
    mean = np.array(S2_MEAN, dtype=np.float32)[:, None, None]
    std  = np.array(S2_STD,  dtype=np.float32)[:, None, None]
    return np.clip((img.astype(np.float32) - mean) / std, -3, 3) / 3.0


def normalize_s1(img: np.ndarray) -> np.ndarray:
    """Normalize 2-band S1 array (dB values) to [-1,1]."""
    mean = np.array(S1_MEAN, dtype=np.float32)[:, None, None]
    std  = np.array(S1_STD,  dtype=np.float32)[:, None, None]
    return np.clip((img.astype(np.float32) - mean) / std, -3, 3) / 3.0


class BENBenchDataset(Dataset):
    """
    BEN-Bench: 1,082 curated S1+S2 image pairs with diverse text annotations.
    
    Download via:
        from datasets import load_dataset
        ds = load_dataset("BigEarthNet/BigEarthNet-v2.0", split="test")
        # Filter to BEN-Bench 1082 pairs using provided split file
    
    Or use the pre-prepared JSON: datasets/ben_bench.json
    """

    TASK_TYPES = ["binary_vqa", "mcq", "captioning", "grounding"]

    def __init__(
        self,
        data_path: str,           # path to ben_bench.json
        task_type: str = "binary_vqa",
        image_size: int = 224,
        max_seq_len: int = 256,
        tokenizer=None,
        augment: bool = False,
    ):
        assert task_type in self.TASK_TYPES, f"task_type must be one of {self.TASK_TYPES}"
        self.task_type = task_type
        self.image_size = image_size
        self.max_seq_len = max_seq_len
        self.tokenizer = tokenizer
        self.augment = augment

        with open(data_path, "r") as f:
            full_data = json.load(f)

        # Filter to only annotations of the requested task type
        self.samples = [s for s in full_data if s["task_type"] == task_type]
        print(f"[BENBench] Loaded {len(self.samples)} '{task_type}' samples")

    def __len__(self):
        return len(self.samples)

    def _load_s2(self, path: str) -> torch.Tensor:
        """Load 10-band S2 image (.npy, .tif, or image) and normalize."""
        img = None
        if path and os.path.exists(path):
            try:
                if path.endswith(".npy"):
                    img = np.load(path)
                elif path.endswith(".tif") or path.endswith(".tiff") or path.endswith(".jp2"):
                    try:
                        import rasterio
                        with rasterio.open(path) as src:
                            img = src.read()[:10]
                    except Exception:
                        pass
                else:
                    arr = np.array(Image.open(path))
                    if arr.ndim == 2:
                        img = np.stack([arr] * 10, axis=0)
                    elif arr.ndim == 3:
                        arr = arr.transpose(2, 0, 1)
                        img = np.zeros((10, arr.shape[1], arr.shape[2]), dtype=np.float32)
                        img[:min(10, arr.shape[0])] = arr[:min(10, arr.shape[0])]
                        for c in range(arr.shape[0], 10):
                            img[c] = arr[0]
            except Exception:
                img = None

        if img is None:
            img = np.zeros((10, self.image_size, self.image_size), dtype=np.float32)

        if img.ndim == 2:
            img = np.stack([img] * 10, axis=0)
        elif img.ndim == 3 and img.shape[0] != 10:
            if img.shape[2] == 10:
                img = img.transpose(2, 0, 1)
            else:
                new_img = np.zeros((10, img.shape[1], img.shape[2]), dtype=img.dtype)
                new_img[:min(10, img.shape[0])] = img[:min(10, img.shape[0])]
                img = new_img

        if img.shape[1] != self.image_size or img.shape[2] != self.image_size:
            img = torch.nn.functional.interpolate(
                torch.from_numpy(img).unsqueeze(0).float(),
                size=(self.image_size, self.image_size),
                mode="bilinear", align_corners=False
            ).squeeze(0).numpy()

        return torch.from_numpy(normalize_s2(img)).float()

    def _load_s1(self, path: str) -> torch.Tensor:
        """Load 2-band S1 image (VV, VH) and normalize."""
        img = None
        if path and os.path.exists(path):
            try:
                if path.endswith(".npy"):
                    img = np.load(path)
                elif path.endswith(".tif") or path.endswith(".tiff"):
                    try:
                        import rasterio
                        with rasterio.open(path) as src:
                            img = src.read()[:2]
                    except Exception:
                        pass
                else:
                    arr = np.array(Image.open(path))
                    if arr.ndim == 2:
                        img = np.stack([arr] * 2, axis=0)
                    elif arr.ndim == 3:
                        if arr.shape[2] <= 4:
                            arr = arr.transpose(2, 0, 1)
                        img = arr[:2]
            except Exception:
                img = None

        if img is None:
            img = np.zeros((2, self.image_size, self.image_size), dtype=np.float32)

        if img.ndim == 2:
            img = np.stack([img] * 2, axis=0)
        elif img.ndim == 3 and img.shape[0] != 2:
            if img.shape[2] == 2:
                img = img.transpose(2, 0, 1)
            else:
                new_img = np.zeros((2, img.shape[1], img.shape[2]), dtype=img.dtype)
                new_img[:min(2, img.shape[0])] = img[:min(2, img.shape[0])]
                img = new_img

        if img.shape[1] != self.image_size or img.shape[2] != self.image_size:
            img = torch.nn.functional.interpolate(
                torch.from_numpy(img).unsqueeze(0).float(),
                size=(self.image_size, self.image_size),
                mode="bilinear", align_corners=False
            ).squeeze(0).numpy()

        return torch.from_numpy(normalize_s1(img)).float()

    def _format_prompt(self, sample: Dict) -> Tuple[str, str]:
        """Format input prompt and target answer for each task type."""
        if self.task_type == "binary_vqa":
            prompt = f"Question: {sample['question']}\nAnswer with Yes or No."
            target = sample["answer"]   # "Yes" or "No"

        elif self.task_type == "mcq":
            choices = "\n".join([f"{chr(65+i)}. {c}"
                                 for i, c in enumerate(sample["choices"])])
            prompt = f"Question: {sample['question']}\nChoices:\n{choices}\nAnswer with the letter only."
            target = sample["answer"]   # "A", "B", "C", or "D"

        elif self.task_type == "captioning":
            prompt = "Describe the land cover and spatial composition of this satellite image in detail."
            target = sample["caption"]

        elif self.task_type == "grounding":
            prompt = f"Locate the {sample['target_class']} in the image. " \
                     f"Return the bounding box as [x1, y1, x2, y2] normalized to [0,1]."
            # Normalize bbox to [0,1]
            bbox = sample["bbox"]  # [x1, y1, x2, y2] in pixels
            h, w = sample.get("image_height", 224), sample.get("image_width", 224)
            norm_bbox = [bbox[0]/w, bbox[1]/h, bbox[2]/w, bbox[3]/h]
            target = f"[{norm_bbox[0]:.3f}, {norm_bbox[1]:.3f}, {norm_bbox[2]:.3f}, {norm_bbox[3]:.3f}]"

        return prompt, target

    def __getitem__(self, idx: int) -> Dict:
        sample = self.samples[idx]

        # Load images
        s2 = self._load_s2(sample["s2_path"])
        s1 = self._load_s1(sample["s1_path"])

        prompt, target = self._format_prompt(sample)

        if self.tokenizer is not None:
            # Tokenize for training
            full_text = f"{prompt}\n{target}{self.tokenizer.eos_token}"
            encoding = self.tokenizer(
                full_text,
                max_length=self.max_seq_len,
                padding="max_length",
                truncation=True,
                return_tensors="pt",
            )
            # Labels: mask prompt tokens, only supervise on target tokens
            prompt_len = len(self.tokenizer(prompt)["input_ids"])
            labels = encoding["input_ids"].squeeze().clone()
            labels[:prompt_len] = -100   # ignore prompt

            return {
                "s2_pixels": s2,
                "s1_pixels": s1,
                "input_ids": encoding["input_ids"].squeeze(),
                "attention_mask": encoding["attention_mask"].squeeze(),
                "labels": labels,
            }
        else:
            # Inference mode
            return {
                "s2_pixels": s2,
                "s1_pixels": s1,
                "prompt": prompt,
                "target": target,
                "task_type": self.task_type,
                "sample_id": sample.get("id", idx),
            }
