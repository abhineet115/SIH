"""
S2ViTEncoder: Sentinel-2 Multispectral image encoder.
Uses BigEarthNet-v2 pretrained ViT (danschr/BigEarthNet-S2-ViT).
Input:  (B, 10, H, W)  — 10 Sentinel-2 bands (10m + 20m, excl. 60m)
Output: (B, N_patches, 768)  — patch embeddings

Band order (10 bands):
  10m bands: B02 (Blue), B03 (Green), B04 (Red), B08 (NIR)
  20m bands: B05, B06, B07, B8A, B11, B12
  Excluded:  B01, B09, B10 (60m — atmospheric correction bands)
"""

import torch
import torch.nn as nn
from transformers import ViTModel, ViTConfig


class S2ViTEncoder(nn.Module):
    """
    Sentinel-2 multispectral encoder using a BigEarthNet-pretrained ViT.
    Handles 10 spectral bands via a learned channel projection to 3.
    """

    INPUT_CHANNELS = 10   # S2 bands used (10m + 20m)

    def __init__(self, model_name: str = "danschr/BigEarthNet-S2-ViT"):
        super().__init__()

        try:
            self.vit = ViTModel.from_pretrained(
                model_name,
                add_pooling_layer=False,
                trust_remote_code=True,
            )
            print(f"[S2ViTEncoder] Loaded {model_name}")
        except Exception:
            print("[S2ViTEncoder] Fallback: generic ViT-Base")
            config = ViTConfig(
                hidden_size=768,
                num_hidden_layers=12,
                num_attention_heads=12,
                intermediate_size=3072,
                image_size=224,
                patch_size=16,
                num_channels=3,
            )
            self.vit = ViTModel(config, add_pooling_layer=False)

        # 10-channel S2 → ViT expected channels
        actual_in_ch = self.vit.config.num_channels
        if actual_in_ch != self.INPUT_CHANNELS:
            self.channel_adapter = nn.Conv2d(
                self.INPUT_CHANNELS, actual_in_ch,
                kernel_size=1, bias=True
            )
            # Smart init: RGB bands get full weight, others get fractional
            with torch.no_grad():
                self.channel_adapter.weight.zero_()
                self.channel_adapter.bias.zero_()
                # B02→R, B03→G, B04→B (indices 0,1,2 → output 0,1,2)
                if actual_in_ch == 3:
                    self.channel_adapter.weight[0, 0, 0, 0] = 1.0  # Blue  → R
                    self.channel_adapter.weight[1, 1, 0, 0] = 1.0  # Green → G
                    self.channel_adapter.weight[2, 2, 0, 0] = 1.0  # Red   → B
                else:
                    self.channel_adapter.weight.fill_(1.0 / self.INPUT_CHANNELS)
        else:
            self.channel_adapter = nn.Identity()

        self.hidden_size = self.vit.config.hidden_size  # 768

    def freeze(self):
        """Freeze ALL parameters including channel adapter."""
        for p in self.parameters():
            p.requires_grad = False
        print("[S2ViTEncoder] Frozen ✓")

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        """
        Args:
            pixel_values: (B, 10, H, W) — S2 imagery, float16, [0,1] normalized
        Returns:
            patch_embeddings: (B, N_patches, 768)
        """
        x = self.channel_adapter(pixel_values)
        outputs = self.vit(pixel_values=x)
        return outputs.last_hidden_state[:, 1:, :]   # (B, N, 768)

    @property
    def num_patches(self) -> int:
        return (self.vit.config.image_size // self.vit.config.patch_size) ** 2
