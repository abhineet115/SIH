"""
collate_fn.py: Custom Data Collator for Multi-Sensor Remote Sensing VLMs.
Batches together multimodal samples containing S1 SAR, S2 multispectral tensors,
and tokenized text with dynamic padding and label masking.
"""

from typing import Dict, List, Any
import torch

class MultimodalDataCollator:
    """
    Data collator that handles:
    - Sentinel-1 SAR tensors: (B, 2, H, W)
    - Sentinel-2 MS tensors:  (B, 10, H, W) or (B, 3, H, W)
    - Optional Bi-temporal T2 tensors: (B, C, H, W)
    - Dynamic padding for input_ids, attention_mask, and labels
    """

    def __init__(self, pad_token_id: int = 0, label_pad_token_id: int = -100):
        self.pad_token_id = pad_token_id
        self.label_pad_token_id = label_pad_token_id

    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, torch.Tensor]:
        batch = {}

        # 1. Process S2 pixels
        if "s2_pixels" in features[0] and features[0]["s2_pixels"] is not None:
            batch["s2_pixels"] = torch.stack([f["s2_pixels"] for f in features])

        # 2. Process S1 pixels
        if "s1_pixels" in features[0] and features[0]["s1_pixels"] is not None:
            batch["s1_pixels"] = torch.stack([f["s1_pixels"] for f in features])

        # 3. Process bi-temporal T2 (for change detection)
        if "s2_pixels_t2" in features[0] and features[0]["s2_pixels_t2"] is not None:
            batch["s2_pixels_t2"] = torch.stack([f["s2_pixels_t2"] for f in features])
        elif "s2_t2_pixels" in features[0] and features[0]["s2_t2_pixels"] is not None:
            batch["s2_pixels_t2"] = torch.stack([f["s2_t2_pixels"] for f in features])

        if "s1_pixels_t2" in features[0] and features[0]["s1_pixels_t2"] is not None:
            batch["s1_pixels_t2"] = torch.stack([f["s1_pixels_t2"] for f in features])
        elif "s1_t2_pixels" in features[0] and features[0]["s1_t2_pixels"] is not None:
            batch["s1_pixels_t2"] = torch.stack([f["s1_t2_pixels"] for f in features])

        # 4. Process text tokens with dynamic padding
        if "input_ids" in features[0] and features[0]["input_ids"] is not None:
            max_len = max(len(f["input_ids"]) for f in features)

            padded_input_ids = []
            padded_attention_mask = []
            padded_labels = []

            for f in features:
                seq_len = len(f["input_ids"])
                diff = max_len - seq_len

                # input_ids
                if diff > 0:
                    pad = torch.full((diff,), self.pad_token_id, dtype=f["input_ids"].dtype)
                    padded_input_ids.append(torch.cat([f["input_ids"], pad]))
                else:
                    padded_input_ids.append(f["input_ids"])

                # attention_mask
                if "attention_mask" in f:
                    if diff > 0:
                        pad_mask = torch.zeros((diff,), dtype=f["attention_mask"].dtype)
                        padded_attention_mask.append(torch.cat([f["attention_mask"], pad_mask]))
                    else:
                        padded_attention_mask.append(f["attention_mask"])

                # labels
                if "labels" in f:
                    if diff > 0:
                        pad_label = torch.full((diff,), self.label_pad_token_id, dtype=f["labels"].dtype)
                        padded_labels.append(torch.cat([f["labels"], pad_label]))
                    else:
                        padded_labels.append(f["labels"])

            batch["input_ids"] = torch.stack(padded_input_ids)
            if padded_attention_mask:
                batch["attention_mask"] = torch.stack(padded_attention_mask)
            if padded_labels:
                batch["labels"] = torch.stack(padded_labels)

        return batch
