"""
mixed_sampler.py: Multi-task sampler for Round 6 fusion training.
Samples from all task datasets according to configured weights.
"""

import json
import random
from pathlib import Path
from typing import Dict, List, Optional
from torch.utils.data import Dataset
from .ben_bench import BENBenchDataset
from .cdvqa import CDVQADataset


class MixedTaskDataset(Dataset):
    """
    Interleaves samples from multiple task-specific datasets
    according to specified weights for Round 6 multi-task fusion.
    
    Task weights determine the proportion of each task in each batch.
    """

    TASK_TO_CLASS = {
        "binary_vqa": "ben_bench_binary",
        "mcq": "ben_bench_mcq",
        "captioning": "ben_bench_captioning",
        "grounding": "ben_bench_grounding",
        "change_vqa": "cdvqa",
    }

    def __init__(
        self,
        data_dir: str,
        task_weights: Dict[str, float],
        tokenizer,
        max_samples: int = 3000,
        seed: int = 42,
    ):
        self.tokenizer = tokenizer
        random.seed(seed)

        # Normalize weights
        total = sum(task_weights.values())
        self.weights = {k: v / total for k, v in task_weights.items()}

        # Load each task dataset
        self.task_samples: Dict[str, List] = {}

        ben_bench_path = str(Path(data_dir) / "ben_bench.json")
        cdvqa_path = str(Path(data_dir) / "cdvqa_train.json")

        if Path(ben_bench_path).exists():
            with open(ben_bench_path) as f:
                all_ben = json.load(f)

            for task in ["binary_vqa", "mcq", "captioning", "grounding"]:
                if task in task_weights:
                    self.task_samples[task] = [
                        s for s in all_ben if s["task_type"] == task
                    ]
                    print(f"  {task}: {len(self.task_samples[task])} samples")

        if "change_vqa" in task_weights and Path(cdvqa_path).exists():
            with open(cdvqa_path) as f:
                self.task_samples["change_vqa"] = json.load(f)
            print(f"  change_vqa: {len(self.task_samples['change_vqa'])} samples")

        # Build interleaved index according to weights
        self.index: List[tuple] = []
        for task, weight in self.weights.items():
            if task not in self.task_samples:
                continue
            n = int(max_samples * weight)
            samples = self.task_samples[task]
            selected = random.choices(samples, k=n)
            self.index.extend([(task, s) for s in selected])

        random.shuffle(self.index)
        print(f"\n[MixedTaskDataset] Total mixed samples: {len(self.index)}")

    def __len__(self):
        return len(self.index)

    def __getitem__(self, idx: int):
        task_type, sample = self.index[idx]

        # Reuse BENBench formatting logic
        from .ben_bench import BENBenchDataset, normalize_s1, normalize_s2
        import torch
        import numpy as np

        # Build prompt/target from sample
        tmp_ds = BENBenchDataset.__new__(BENBenchDataset)
        tmp_ds.task_type = task_type
        tmp_ds.tokenizer = self.tokenizer
        tmp_ds.image_size = 224
        tmp_ds.max_seq_len = 256
        tmp_ds.augment = False

        s2 = tmp_ds._load_s2(sample.get("s2_path", ""))
        s1 = tmp_ds._load_s1(sample.get("s1_path", ""))
        prompt, target = tmp_ds._format_prompt(sample)

        full_text = f"{prompt}\n{target}{self.tokenizer.eos_token}"
        encoding = self.tokenizer(
            full_text,
            max_length=256,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        prompt_len = len(self.tokenizer(prompt)["input_ids"])
        labels = encoding["input_ids"].squeeze().clone()
        labels[:prompt_len] = -100

        return {
            "s2_pixels": s2,
            "s1_pixels": s1,
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": labels,
            "task_type": task_type,
        }
