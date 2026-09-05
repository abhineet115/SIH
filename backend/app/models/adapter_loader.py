"""
adapter_loader.py: Manages task-specific LoRA adapters and merged weights.
Supports dynamically switching between:
- Round 2: Binary VQA adapter
- Round 3a: MCQ adapter
- Round 3b: Dense Captioning adapter
- Round 4: Visual Grounding adapter
- Round 5: Bi-Temporal Change adapter
- Round 6: Unified Multi-Task Merged Model
"""

import os
from pathlib import Path
from typing import Dict, List, Optional

ADAPTER_ROUNDS = {
    "vqa": "r2_binary_vqa",
    "mcq": "r3a_mcq",
    "captioning": "r3b_captioning",
    "grounding": "r4_grounding",
    "change": "r5_change",
    "fusion": "r6_fusion",
}

class AdapterManager:
    def __init__(self, base_ckpt_dir: Optional[str] = None):
        if base_ckpt_dir:
            self.base_dir = Path(base_ckpt_dir)
        else:
            self.base_dir = Path(__file__).resolve().parent.parent.parent / "weights" / "adapters"

    def list_available_adapters(self) -> Dict[str, bool]:
        """Check which adapters are available on disk."""
        available = {}
        for task, folder in ADAPTER_ROUNDS.items():
            adapter_path = self.base_dir / folder
            available[task] = adapter_path.exists() and (adapter_path / "adapter_model.bin").exists() or (adapter_path / "adapter_model.safetensors").exists()
        return available

    def get_adapter_path(self, task: str) -> Optional[str]:
        folder = ADAPTER_ROUNDS.get(task, "r6_fusion")
        adapter_path = self.base_dir / folder
        if adapter_path.exists():
            return str(adapter_path)
        return None
