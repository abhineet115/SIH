"""
S1ViTEncoder: Sentinel-1 SAR image encoder.
Uses BigEarthNet-v2 pretrained ViT backbone (danschr/BigEarthNet-S1-ViT).
Input:  (B, 2, H, W)  — 2-channel SAR (VV, VH polarizations)
Output: (B, N_patches, 768)  — patch embeddings
"""

import torch
import torch.nn as nn
from transformers import ViTModel, ViTConfig


class S1ViTEncoder(nn.Module):
    """
    Sentinel-1 SAR encoder using a BigEarthNet-pretrained ViT.
    
    The classification head is removed — we use only the patch embeddings.
    The entire encoder is FROZEN during training (only projections are trained).
    
    Input format: 2-channel SAR (VV + VH), normalized to [-1, 1]
    """

    # Adapt ViT's expected 3-channel input to 2-channel SAR
    # by learning a 2→3 channel adapter at load time (init from mean)
    INPUT_CHANNELS = 2

    def __init__(self, model_name: str = "danschr/BigEarthNet-S1-ViT"):
        super().__init__()

        try:
            # Load BEN-pretrained ViT
            self.vit = ViTModel.from_pretrained(
                model_name,
                add_pooling_layer=False,
                trust_remote_code=True,
            )
            print(f"[S1ViTEncoder] Loaded {model_name}")
        except Exception:
            # Fallback: generic ViT-Base when HF model not found yet
            print(f"[S1ViTEncoder] Fallback: generic ViT-Base")
            config = ViTConfig(
                hidden_size=768,
                num_hidden_layers=12,
                num_attention_heads=12,
                intermediate_size=3072,
                image_size=224,
                patch_size=16,
                num_channels=3,   # ViT expects 3ch; we project 2→3 below
            )
            self.vit = ViTModel(config, add_pooling_layer=False)

        # 2-channel SAR → 3-channel adapter (1 trainable conv, BUT frozen after)
        actual_in_ch = self.vit.config.num_channels
        if actual_in_ch != self.INPUT_CHANNELS:
            self.channel_adapter = nn.Conv2d(
                self.INPUT_CHANNELS, actual_in_ch,
                kernel_size=1, bias=False
            )
            # Initialize: mean of input channels mapped to each output channel
            with torch.no_grad():
                self.channel_adapter.weight.fill_(1.0 / self.INPUT_CHANNELS)
        else:
            self.channel_adapter = nn.Identity()

        self.hidden_size = self.vit.config.hidden_size  # 768

    def freeze(self):
        """Freeze ALL parameters including channel adapter."""
        for p in self.parameters():
            p.requires_grad = False
        print("[S1ViTEncoder] Frozen ✓")

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        """
        Args:
            pixel_values: (B, 2, H, W) — SAR imagery, float16
        Returns:
            patch_embeddings: (B, N_patches, 768)
        """
        # Adapt 2 → 3 channels
        x = self.channel_adapter(pixel_values)   # (B, 3, H, W)

        outputs = self.vit(pixel_values=x)
        # last_hidden_state: (B, 1 + N_patches, 768)
        # Skip the [CLS] token (index 0), return only patch tokens
        return outputs.last_hidden_state[:, 1:, :]   # (B, N, 768)

    @property
    def num_patches(self) -> int:
        img_size = self.vit.config.image_size      # 224
        patch_size = self.vit.config.patch_size    # 16
        return (img_size // patch_size) ** 2       # 196
