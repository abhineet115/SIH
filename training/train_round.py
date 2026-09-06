"""
train_round.py: Universal progressive training script for all 7 rounds.
Supports: QLoRA 4-bit, gradient checkpointing, 8-bit AdamW, auto-resume from Drive.

Usage:
    python train_round.py --round 2 --task binary_vqa --drive /content/drive/MyDrive/SatQuery_AI
"""

import os
import sys
import json
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional, Dict

import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader
from transformers import (
    TrainingArguments,
    Trainer,
    AutoTokenizer,
    BitsAndBytesConfig,
    PreTrainedModel,
    get_cosine_schedule_with_warmup,
)
from peft import LoraConfig, get_peft_model
from accelerate import Accelerator

# Compatibility patch for remote-code models in modern transformers (v4.49+ / v5.x)
if not hasattr(PreTrainedModel, "all_tied_weights_keys"):
    PreTrainedModel.all_tied_weights_keys = {}
if not hasattr(nn.Module, "all_tied_weights_keys"):
    nn.Module.all_tied_weights_keys = {}

# Disable incompatible pre-installed torchao in peft
try:
    import peft.import_utils
    peft.import_utils.is_torchao_available = lambda: False
except Exception:
    pass


# ── Round Configurations ──────────────────────────────────────────────────────

ROUND_CONFIGS = {
    1: {  # Domain Warm-up
        "name": "r1_warmup",
        "dataset": "rsvqa_lr",
        "task": "binary_vqa",
        "max_steps": 300,
        "batch_size": 2,
        "grad_accum": 8,
        "lr": 3e-4,
        "warmup_ratio": 0.10,
        "lora_r": 8,
        "lora_alpha": 16,
        "save_steps": 50,
        "resume_from": None,
    },
    2: {  # Binary VQA Mastery ★ GOLDEN
        "name": "r2_binary_vqa",
        "dataset": "ben_bench",
        "task": "binary_vqa",
        "max_steps": 500,
        "batch_size": 2,
        "grad_accum": 16,
        "lr": 2e-4,
        "warmup_ratio": 0.05,
        "lora_r": 8,
        "lora_alpha": 16,
        "save_steps": 100,
        "resume_from": "r1_warmup",
        "load_best_model": True,
    },
    "3a": {  # MCQ Upgrade
        "name": "r3a_mcq",
        "dataset": "ben_bench",
        "task": "mcq",
        "max_steps": 400,
        "batch_size": 2,
        "grad_accum": 16,
        "lr": 1e-4,
        "warmup_ratio": 0.05,
        "lora_r": 8,
        "lora_alpha": 16,
        "save_steps": 80,
        "resume_from": "r2_binary_vqa",
    },
    "3b": {  # Captioning (branch from r2)
        "name": "r3b_captioning",
        "dataset": "ben_bench",
        "task": "captioning",
        "max_steps": 400,
        "batch_size": 1,
        "grad_accum": 32,
        "lr": 1e-4,
        "warmup_ratio": 0.05,
        "lora_r": 16,
        "lora_alpha": 32,
        "max_new_tokens": 256,
        "save_steps": 80,
        "resume_from": "r2_binary_vqa",
    },
    4: {  # Grounding
        "name": "r4_grounding",
        "dataset": "ben_bench",
        "task": "grounding",
        "max_steps": 450,
        "batch_size": 2,
        "grad_accum": 16,
        "lr": 1e-4,
        "warmup_ratio": 0.05,
        "lora_r": 16,
        "lora_alpha": 32,
        "save_steps": 90,
        "resume_from": "r2_binary_vqa",
    },
    5: {  # Change Detection
        "name": "r5_change",
        "dataset": "cdvqa",
        "task": "change_vqa",
        "max_steps": 350,
        "batch_size": 1,
        "grad_accum": 32,
        "lr": 1e-4,
        "warmup_ratio": 0.05,
        "lora_r": 8,
        "lora_alpha": 16,
        "save_steps": 70,
        "resume_from": "r2_binary_vqa",
        "dual_image": True,
    },
    6: {  # Multi-Task Fusion ★ FINAL
        "name": "r6_fusion",
        "dataset": "all_mixed",
        "task": "multitask",
        "max_steps": 600,
        "batch_size": 2,
        "grad_accum": 16,
        "lr": 5e-5,
        "warmup_ratio": 0.03,
        "lora_r": 8,
        "lora_alpha": 16,
        "save_steps": 100,
        "resume_from": "merged",  # merged adapter from r3a+r3b+r4+r5
        "task_weights": {
            "binary_vqa": 0.35,
            "mcq": 0.25,
            "captioning": 0.15,
            "grounding": 0.15,
            "change_vqa": 0.10,
        },
    },
}


# ── Auto-Resume from Google Drive ─────────────────────────────────────────────

def find_latest_checkpoint(ckpt_dir: str) -> Optional[str]:
    """Find the latest checkpoint in a directory."""
    ckpt_path = Path(ckpt_dir)
    if not ckpt_path.exists():
        return None
    checkpoints = sorted(
        [d for d in ckpt_path.iterdir() if d.name.startswith("checkpoint-")],
        key=lambda d: int(d.name.split("-")[1])
    )
    if checkpoints:
        latest = str(checkpoints[-1])
        steps_done = int(checkpoints[-1].name.split("-")[1])
        print(f"[Resume] Found checkpoint at step {steps_done}: {latest}")
        return latest
    return None


def get_resume_adapter_path(drive_root: str, resume_from: Optional[str]) -> Optional[str]:
    """Get adapter path to resume from (previous round's best checkpoint)."""
    if resume_from is None:
        return None
    
    alias_map = {
        "r1": "r1_warmup",
        "r2": "r2_binary_vqa",
        "r3a": "r3a_mcq",
        "r3b": "r3b_captioning",
        "r4": "r4_grounding",
        "r5": "r5_change",
        "r6": "r6_fusion",
    }
    target = alias_map.get(resume_from, resume_from)
    ckpt_dir = f"{drive_root}/ckpt/{target}"
    
    # Look for 'best' subfolder first, then latest checkpoint
    best = f"{ckpt_dir}/best"
    if Path(best).exists():
        return best
    return find_latest_checkpoint(ckpt_dir)


# ── Dataset Factory ───────────────────────────────────────────────────────────

def build_dataset(cfg: Dict, drive_root: str, tokenizer, split: str = "train"):
    """Build the appropriate dataset for this round."""
    data_dir = f"{drive_root}/datasets"

    if cfg["dataset"] == "rsvqa_lr":
        from data.rsvqa import RSVQADataset
        return RSVQADataset(
            data_path=f"{data_dir}/rsvqa_lr_{split}.json",
            tokenizer=tokenizer,
        )

    elif cfg["dataset"] == "ben_bench":
        from data.ben_bench import BENBenchDataset
        return BENBenchDataset(
            data_path=f"{data_dir}/ben_bench.json",
            task_type=cfg["task"],
            tokenizer=tokenizer,
        )

    elif cfg["dataset"] == "cdvqa":
        from data.cdvqa import CDVQADataset
        return CDVQADataset(
            data_path=f"{data_dir}/cdvqa_{split}.json",
            tokenizer=tokenizer,
        )

    elif cfg["dataset"] == "all_mixed":
        from data.mixed_sampler import MixedTaskDataset
        return MixedTaskDataset(
            data_dir=data_dir,
            task_weights=cfg["task_weights"],
            tokenizer=tokenizer,
        )

    raise ValueError(f"Unknown dataset: {cfg['dataset']}")


# ── Main Training Function ────────────────────────────────────────────────────

def train_round(
    round_id,
    drive_root: str = "/content/drive/MyDrive/SatQuery_AI",
    base_model: str = "OpenGVLab/InternVL3-1B",
    hf_token: Optional[str] = None,
):
    """Run a single training round with auto-resume and Drive checkpoint saving."""

    cfg = ROUND_CONFIGS[round_id]
    round_name = cfg["name"]
    output_dir = f"{drive_root}/ckpt/{round_name}"
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  ROUND {round_id}: {round_name.upper()}")
    print(f"  Task: {cfg['task']} | Dataset: {cfg['dataset']}")
    print(f"  Output: {output_dir}")
    print(f"{'='*60}\n")

    # ── Load tokenizer ────────────────────────────────────────────────────────
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # ── Load model with 4-bit QLoRA ───────────────────────────────────────────
    from models.rs_internvl import RSInternVL

    resume_adapter = get_resume_adapter_path(drive_root, cfg.get("resume_from"))

    if resume_adapter:
        print(f"[Round {round_id}] Loading adapter from previous round: {resume_adapter}")
        model = RSInternVL.load_with_adapter(
            base_model_name=base_model,
            adapter_path=resume_adapter,
            use_4bit=True,
        )
    else:
        print(f"[Round {round_id}] Starting fresh (no previous adapter)")
        model = RSInternVL(
            base_model_name=base_model,
            lora_r=cfg["lora_r"],
            lora_alpha=cfg["lora_alpha"],
            task_mode=cfg["task"],
        )

    # ── Build datasets ────────────────────────────────────────────────────────
    train_dataset = build_dataset(cfg, drive_root, tokenizer, split="train")
    eval_dataset  = build_dataset(cfg, drive_root, tokenizer, split="val")

    # ── Training arguments ────────────────────────────────────────────────────
    # Check if this round already has a partial checkpoint (crash recovery)
    resume_ckpt = find_latest_checkpoint(output_dir)

    warmup_steps = max(1, int(cfg["max_steps"] * cfg.get("warmup_ratio", 0.05)))
    eval_arg = "eval_strategy" if "eval_strategy" in TrainingArguments.__init__.__code__.co_varnames else "evaluation_strategy"

    has_bnb = False
    try:
        import bitsandbytes
        has_bnb = True
    except Exception:
        has_bnb = False

    optim_name = "paged_adamw_8bit" if has_bnb else "adamw_torch"

    args_dict = {
        "output_dir": output_dir,
        "max_steps": cfg["max_steps"],
        "per_device_train_batch_size": cfg["batch_size"],
        "per_device_eval_batch_size": cfg["batch_size"],
        "gradient_accumulation_steps": cfg["grad_accum"],
        "learning_rate": cfg["lr"],
        "lr_scheduler_type": "cosine",
        "warmup_steps": warmup_steps,
        "optim": optim_name,                # 8-bit optimizer if bnb is present, else standard AdamW
        "fp16": True,                        # T4 native precision
        "bf16": False,
        "gradient_checkpointing": True,
        "save_steps": cfg["save_steps"],
        "save_total_limit": 3,              # keep last 3 checkpoints
        "eval_steps": cfg["save_steps"],
        eval_arg: "steps",
        "logging_steps": 10,
        "report_to": "tensorboard",
        "load_best_model_at_end": cfg.get("load_best_model", False),
        "metric_for_best_model": "eval_loss",
        "dataloader_num_workers": 2,
        "remove_unused_columns": False,
        "run_name": round_name,
    }
    training_args = TrainingArguments(**args_dict)

    # ── Trainer ───────────────────────────────────────────────────────────────
    from data.collate_fn import MultimodalDataCollator
    collator = MultimodalDataCollator(pad_token_id=tokenizer.pad_token_id or 0)

    trainer_kwargs = {
        "model": model,
        "args": training_args,
        "train_dataset": train_dataset,
        "eval_dataset": eval_dataset,
        "data_collator": collator,
    }
    if "processing_class" in Trainer.__init__.__code__.co_varnames:
        trainer_kwargs["processing_class"] = tokenizer
    else:
        trainer_kwargs["tokenizer"] = tokenizer

    trainer = Trainer(**trainer_kwargs)

    print(f"[Round {round_id}] Starting training...")
    trainer.train(resume_from_checkpoint=resume_ckpt)

    # ── Save best adapter to Drive ────────────────────────────────────────────
    best_dir = f"{output_dir}/best"
    model.save_adapter(best_dir)
    print(f"\n[Round {round_id}] ✅ Complete! Best adapter saved → {best_dir}")

    return best_dir


# ── CLI Entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SatQuery AI Progressive Fine-Tuning")
    parser.add_argument("--round", type=str, required=True,
                        help="Round ID: 1, 2, 3a, 3b, 4, 5, 6")
    parser.add_argument("--drive", type=str,
                        default="/content/drive/MyDrive/SatQuery_AI",
                        help="Google Drive root path")
    parser.add_argument("--base-model", type=str,
                        default="OpenGVLab/InternVL3-1B")
    parser.add_argument("--hf-token", type=str, default=None)
    args = parser.parse_args()

    round_id = args.round
    try:
        round_id = int(round_id)
    except ValueError:
        pass  # keep as string for "3a", "3b"

    if round_id not in ROUND_CONFIGS:
        print(f"ERROR: Round '{round_id}' not in {list(ROUND_CONFIGS.keys())}")
        sys.exit(1)

    train_round(round_id, args.drive, args.base_model, args.hf_token)
