"""
adapter_merger.py: Merge multiple task-specific LoRA adapters for Round 6 (multi-task fusion).
Supports weighted averaging of LoRA delta weights from VQA, captioning, grounding, change adapters.
"""

import torch
from pathlib import Path
from typing import Dict, Optional
from peft import PeftModel
from transformers import AutoModelForCausalLM, BitsAndBytesConfig


def load_adapter_weights(adapter_path: str) -> Dict[str, torch.Tensor]:
    """Load LoRA adapter delta weights from a saved checkpoint."""
    path = Path(adapter_path)
    weights = {}
    for f in path.glob("adapter_model*.bin"):
        weights.update(torch.load(f, map_location="cpu"))
    if not weights:
        # Try safetensors
        from safetensors.torch import load_file
        for f in path.glob("adapter_model*.safetensors"):
            weights.update(load_file(str(f)))
    return weights


def merge_adapters_weighted(
    adapter_paths: Dict[str, str],
    task_weights: Optional[Dict[str, float]] = None,
) -> Dict[str, torch.Tensor]:
    """
    Weighted average of multiple LoRA adapter delta weights.
    
    Args:
        adapter_paths: {"vqa": "/path/...", "captioning": "/path/...", ...}
        task_weights:  {"vqa": 0.35, "captioning": 0.15, ...}
                       If None, equal weights are used.
    Returns:
        merged_weights: dict of averaged LoRA weight tensors
    """
    if task_weights is None:
        n = len(adapter_paths)
        task_weights = {k: 1.0 / n for k in adapter_paths}

    # Normalize weights to sum to 1
    total = sum(task_weights.values())
    task_weights = {k: v / total for k, v in task_weights.items()}

    all_weights = {}
    for task_name, adapter_path in adapter_paths.items():
        print(f"  Loading adapter: {task_name} from {adapter_path}")
        all_weights[task_name] = load_adapter_weights(adapter_path)

    # Get union of all weight keys
    all_keys = set()
    for w in all_weights.values():
        all_keys.update(w.keys())

    merged = {}
    for key in all_keys:
        weighted_sum = None
        for task_name, weights in all_weights.items():
            if key not in weights:
                continue
            w = task_weights.get(task_name, 0.0)
            tensor = weights[key].float() * w
            weighted_sum = tensor if weighted_sum is None else weighted_sum + tensor
        if weighted_sum is not None:
            merged[key] = weighted_sum

    print(f"[AdapterMerger] Merged {len(adapter_paths)} adapters → {len(merged)} weight tensors")
    return merged


def save_merged_adapter(merged_weights: Dict[str, torch.Tensor], output_path: str):
    """Save merged adapter weights so they can be loaded as a PeftModel."""
    import os, json
    os.makedirs(output_path, exist_ok=True)
    torch.save(merged_weights, f"{output_path}/adapter_model.bin")

    # Write adapter config (minimal — same LoRA config as individual adapters)
    config = {
        "base_model_name_or_path": "OpenGVLab/InternVL3-1B",
        "peft_type": "LORA",
        "r": 8,
        "lora_alpha": 16,
        "lora_dropout": 0.05,
        "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
        "bias": "none",
        "task_type": "CAUSAL_LM",
    }
    with open(f"{output_path}/adapter_config.json", "w") as f:
        json.dump(config, f, indent=2)

    print(f"[AdapterMerger] Saved merged adapter → {output_path}")


def create_merged_model(
    base_model_name: str,
    adapter_paths: Dict[str, str],
    task_weights: Dict[str, float],
    output_path: str,
    use_4bit: bool = True,
):
    """
    Full pipeline: load adapters → weighted merge → save for Round 6 training.
    """
    print("[AdapterMerger] Starting weighted merge...")
    merged = merge_adapters_weighted(adapter_paths, task_weights)
    save_merged_adapter(merged, output_path)
    print(f"[AdapterMerger] ✅ Done. Use as starting point for Round 6.")
    return output_path


# ── CLI usage ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser()
    parser.add_argument("--adapters", type=str, required=True,
                        help='JSON dict: {"vqa": "/path", "captioning": "/path", ...}')
    parser.add_argument("--weights", type=str, default=None,
                        help='JSON dict: {"vqa": 0.35, "captioning": 0.15, ...}')
    parser.add_argument("--output", type=str, required=True)
    args = parser.parse_args()

    adapter_paths = json.loads(args.adapters)
    task_weights = json.loads(args.weights) if args.weights else None

    create_merged_model(
        base_model_name="OpenGVLab/InternVL3-1B",
        adapter_paths=adapter_paths,
        task_weights=task_weights,
        output_path=args.output,
    )
