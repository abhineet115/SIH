"""
ProjectionHead: Maps ViT embeddings (768-dim) → LLM token space (2048-dim).
One instance per sensor modality (S1 and S2 each get their own head).
These are the ONLY trainable non-LoRA components.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ProjectionHead(nn.Module):
    """
    Two-layer MLP projection: ViT space (768) → LLM token space (2048).
    
    Architecture: Linear → LayerNorm → GELU → Linear
    This is learnable, trainable, fp32.
    
    Following the paper: linear projection layers align sensor embeddings
    to the InternVL LLM embedding space.
    """

    def __init__(
        self,
        in_dim: int = 768,     # ViT hidden size
        out_dim: int = 2048,   # InternVL3-1B hidden size
        hidden_dim: int = 1024,
        dropout: float = 0.0,
    ):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden_dim, bias=True),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, out_dim, bias=True),
        )
        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, N_patches, 768) — ViT patch embeddings
        Returns:
            (B, N_patches, 2048) — LLM-space tokens
        """
        return self.net(x.float()).to(x.dtype)
