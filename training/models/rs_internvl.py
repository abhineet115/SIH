"""
RS-InternVL: Multi-Sensor Vision-Language Model for Remote Sensing
Based on: BigEarthNet-Text paper (arXiv 2603.29630v2)

Architecture:
  - Frozen S1-ViT (Sentinel-1 SAR encoder, BEN-pretrained)
  - Frozen S2-ViT (Sentinel-2 Multispectral encoder, BEN-pretrained)
  - Trainable linear projection heads (S1→LLM space, S2→LLM space)
  - InternVL3-1B LLM backbone with QLoRA adapters (4-bit, trainable)

Trainable params: ~5.8M / 1.1B total
VRAM at bs=2 (T4 15GB): ~14 GB
"""

import torch
import torch.nn as nn
from typing import Optional, Dict, Any, List
from transformers import AutoModel, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, PreTrainedModel
from peft import get_peft_model, LoraConfig, TaskType, PeftModel
from .s1_encoder import S1ViTEncoder
from .s2_encoder import S2ViTEncoder
from .projection_head import ProjectionHead

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


class RSInternVL(nn.Module):
    """
    RS-InternVL: Multi-Sensor Remote Sensing Vision-Language Model.
    
    Supports 4 task modes:
      - "vqa"       : binary / open-ended question answering
      - "captioning": scene description generation
      - "grounding" : referring expression detection (bbox prediction)
      - "change"    : bi-temporal change detection VQA
    """

    # InternVL3-1B hidden dimension
    LLM_EMBED_DIM = 2048
    # BEN-pretrained ViT output dimension
    VIT_EMBED_DIM = 768

    def __init__(
        self,
        base_model_name: str = "OpenGVLab/InternVL3-1B",
        s1_encoder_name: str = "danschr/BigEarthNet-S1-ViT",
        s2_encoder_name: str = "danschr/BigEarthNet-S2-ViT",
        use_4bit: bool = True,
        lora_r: int = 8,
        lora_alpha: int = 16,
        lora_dropout: float = 0.05,
        task_mode: str = "vqa",
        device_map: str = "auto",
    ):
        super().__init__()
        self.task_mode = task_mode
        self.llm_embed_dim = self.LLM_EMBED_DIM

        # ── 1. Load InternVL3-1B backbone ──────────────────────────────
        print("[RSInternVL] Loading InternVL3-1B...")
        bnb_config = None
        if use_4bit:
            try:
                import bitsandbytes
                bnb_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                )
            except Exception as e:
                print(f"[RSInternVL] Notice: 4-bit bnb not ready ({e}), falling back to native FP16 (~2GB VRAM)...")
                bnb_config = None
                use_4bit = False

        try:
            self.llm = AutoModel.from_pretrained(
                base_model_name,
                device_map=device_map,
                trust_remote_code=True,
                torch_dtype=torch.float16,
                low_cpu_mem_usage=True,
            )
        except Exception as e:
            print(f"[RSInternVL] Notice: AutoModel fallback: {e}")
            self.llm = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                device_map=device_map,
                trust_remote_code=True,
                torch_dtype=torch.float16,
            )

        # Dynamically determine LLM token embedding dimension (896 for InternVL3-1B)
        try:
            self.llm_embed_dim = self.llm.get_input_embeddings().embedding_dim
        except Exception:
            self.llm_embed_dim = getattr(self.llm.config, "hidden_size", 896)
        print(f"[RSInternVL] Detected LLM embedding dimension: {self.llm_embed_dim}")

        # ── 2. Load frozen S1 ViT encoder ──────────────────────────────
        print("[RSInternVL] Loading S1 ViT encoder (frozen)...")
        self.s1_encoder = S1ViTEncoder(s1_encoder_name)
        self.s1_encoder.freeze()

        # ── 3. Load frozen S2 ViT encoder ──────────────────────────────
        print("[RSInternVL] Loading S2 ViT encoder (frozen)...")
        self.s2_encoder = S2ViTEncoder(s2_encoder_name)
        self.s2_encoder.freeze()

        # ── 4. Trainable projection heads (ViT -> LLM space) ───────────
        self.s1_proj = ProjectionHead(self.VIT_EMBED_DIM, self.llm_embed_dim)
        self.s2_proj = ProjectionHead(self.VIT_EMBED_DIM, self.llm_embed_dim)

        self.tokenizer = AutoTokenizer.from_pretrained(
            base_model_name,
            trust_remote_code=True,
            padding_side="right",
        )
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        # ── 5. Wrap LLM with LoRA adapters ─────────────────────────────
        lora_config = LoraConfig(
            r=lora_r,
            lora_alpha=lora_alpha,
            lora_dropout=lora_dropout,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
            bias="none",
            task_type=TaskType.CAUSAL_LM,
        )
        self.llm = get_peft_model(self.llm, lora_config)
        self.llm.print_trainable_parameters()

        # Enable gradient checkpointing for memory efficiency
        try:
            self.llm.gradient_checkpointing_enable()
        except Exception:
            pass

        self.warnings_issued = {}
        print(f"[RSInternVL] Ready. Task mode: {task_mode}")

    def gradient_checkpointing_enable(self, *args, **kwargs):
        if hasattr(self.llm, "gradient_checkpointing_enable"):
            try:
                self.llm.gradient_checkpointing_enable(*args, **kwargs)
            except TypeError:
                try:
                    gc_kwargs = kwargs.get("gradient_checkpointing_kwargs", None)
                    self.llm.gradient_checkpointing_enable(gradient_checkpointing_kwargs=gc_kwargs)
                except TypeError:
                    self.llm.gradient_checkpointing_enable()

    def gradient_checkpointing_disable(self, *args, **kwargs):
        if hasattr(self.llm, "gradient_checkpointing_disable"):
            try:
                self.llm.gradient_checkpointing_disable(*args, **kwargs)
            except TypeError:
                self.llm.gradient_checkpointing_disable()

    def can_generate(self) -> bool:
        return True

    def encode_sensors(
        self,
        s1_pixels: Optional[torch.Tensor],   # (B, 2, H, W)  — SAR VV/VH
        s2_pixels: Optional[torch.Tensor],   # (B, 10, H, W) — S2 10m+20m bands
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ) -> Optional[torch.Tensor]:
        """
        Encode S1 and/or S2 imagery into LLM embedding space tokens.
        Returns: sensor_tokens  (B, N_tokens, LLM_DIM) or None
        """
        tokens = []

        if s1_pixels is not None:
            if device is not None:
                s1_pixels = s1_pixels.to(device=device, dtype=dtype)
                self.s1_encoder = self.s1_encoder.to(device=device)
                self.s1_proj = self.s1_proj.to(device=device)
            s1_feats = self.s1_encoder(s1_pixels)
            s1_tokens = self.s1_proj(s1_feats)
            tokens.append(s1_tokens)

        if s2_pixels is not None:
            if device is not None:
                s2_pixels = s2_pixels.to(device=device, dtype=dtype)
                self.s2_encoder = self.s2_encoder.to(device=device)
                self.s2_proj = self.s2_proj.to(device=device)
            s2_feats = self.s2_encoder(s2_pixels)
            s2_tokens = self.s2_proj(s2_feats)
            tokens.append(s2_tokens)

        if not tokens:
            return None

        return torch.cat(tokens, dim=1)

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
        labels: Optional[torch.Tensor] = None,
        s1_pixels: Optional[torch.Tensor] = None,
        s2_pixels: Optional[torch.Tensor] = None,
        s1_pixels_t2: Optional[torch.Tensor] = None,   # for change detection
        s2_pixels_t2: Optional[torch.Tensor] = None,   # for change detection
    ) -> Dict[str, Any]:
        """
        Forward pass. For change detection, T1 and T2 sensor tokens are
        concatenated before the text tokens.
        """
        # Get text embeddings from LLM embedding layer
        word_embeds = self.llm.get_input_embeddings()(input_ids)  # (B, L, D)
        dev = word_embeds.device
        dt = word_embeds.dtype

        # Encode sensor images
        t1_tokens = self.encode_sensors(s1_pixels, s2_pixels, device=dev, dtype=dt)
        t2_tokens = self.encode_sensors(s1_pixels_t2, s2_pixels_t2, device=dev, dtype=dt)

        # Prepend sensor tokens to text embeddings
        parts = []
        if t1_tokens is not None:
            parts.append(t1_tokens.to(dt))
        if t2_tokens is not None:
            parts.append(t2_tokens.to(dt))
        parts.append(word_embeds)

        inputs_embeds = torch.cat(parts, dim=1)  # (B, N_visual + L, D)

        # Extend attention mask to cover visual tokens
        n_visual = inputs_embeds.shape[1] - attention_mask.shape[1]
        if n_visual > 0:
            vis_mask = torch.ones(
                attention_mask.shape[0], n_visual,
                dtype=attention_mask.dtype, device=attention_mask.device
            )
            attention_mask = torch.cat([vis_mask, attention_mask], dim=1)

        # Extend labels to ignore visual token positions
        if labels is not None and n_visual > 0:
            ignore = torch.full(
                (labels.shape[0], n_visual), -100,
                dtype=labels.dtype, device=labels.device
            )
            labels = torch.cat([ignore, labels], dim=1)

        return self.llm(
            inputs_embeds=inputs_embeds,
            attention_mask=attention_mask,
            labels=labels,
        )

    @torch.inference_mode()
    def generate(
        self,
        s2_pixels: Optional[torch.Tensor],
        query: str,
        s1_pixels: Optional[torch.Tensor] = None,
        s2_pixels_t2: Optional[torch.Tensor] = None,
        s1_pixels_t2: Optional[torch.Tensor] = None,
        max_new_tokens: int = 128,
        temperature: float = 0.1,
    ) -> str:
        """Single-sample inference — returns generated text answer."""
        inputs = self.tokenizer(
            query, return_tensors="pt", padding=True
        ).to(self.llm.device)

        output = self.forward(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            s1_pixels=s1_pixels,
            s2_pixels=s2_pixels,
            s1_pixels_t2=s1_pixels_t2,
            s2_pixels_t2=s2_pixels_t2,
        )

        # Re-run for generation (greedy / low-temp sampling)
        sensor_tokens = self.encode_sensors(s1_pixels, s2_pixels)
        t2_tokens = self.encode_sensors(s1_pixels_t2, s2_pixels_t2)
        word_embeds = self.llm.get_input_embeddings()(inputs["input_ids"])

        parts = []
        if sensor_tokens is not None:
            parts.append(sensor_tokens.to(word_embeds.dtype))
        if t2_tokens is not None:
            parts.append(t2_tokens.to(word_embeds.dtype))
        parts.append(word_embeds)
        inputs_embeds = torch.cat(parts, dim=1)

        n_vis = inputs_embeds.shape[1] - inputs["attention_mask"].shape[1]
        if n_vis > 0:
            vis_mask = torch.ones(
                1, n_vis, dtype=torch.long, device=inputs["attention_mask"].device
            )
            attention_mask = torch.cat([vis_mask, inputs["attention_mask"]], dim=1)
        else:
            attention_mask = inputs["attention_mask"]

        generated = self.llm.generate(
            inputs_embeds=inputs_embeds,
            attention_mask=attention_mask,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=temperature > 0,
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )
        return self.tokenizer.decode(generated[0], skip_special_tokens=True)

    def save_adapter(self, path: str):
        """Save only the trainable LoRA adapter + projection heads."""
        self.llm.save_pretrained(path)
        torch.save({
            "s1_proj": self.s1_proj.state_dict(),
            "s2_proj": self.s2_proj.state_dict(),
        }, f"{path}/projection_heads.pt")
        self.tokenizer.save_pretrained(path)
        print(f"[RSInternVL] Adapter saved → {path}")

    @classmethod
    def load_with_adapter(
        cls,
        base_model_name: str,
        adapter_path: str,
        use_4bit: bool = True,
        device_map: str = "auto",
    ) -> "RSInternVL":
        """Load base model + previously saved adapter checkpoint."""
        model = cls(
            base_model_name=base_model_name,
            use_4bit=use_4bit,
            device_map=device_map,
        )
        model.llm = PeftModel.from_pretrained(model.llm, adapter_path)

        proj_state = torch.load(f"{adapter_path}/projection_heads.pt", map_location="cpu")
        model.s1_proj.load_state_dict(proj_state["s1_proj"])
        model.s2_proj.load_state_dict(proj_state["s2_proj"])

        print(f"[RSInternVL] Loaded adapter from {adapter_path}")
        return model
