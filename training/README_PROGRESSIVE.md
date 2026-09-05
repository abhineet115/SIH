# SatQuery AI — Progressive Multi-Sensor VLM Fine-Tuning Guide
### Smart India Hackathon (SIH 26167) | ISRO Space Technology Theme
**Repository**: [github.com/abhineet115/SIH](https://github.com/abhineet115/SIH)

---

## 🌟 Overview

SatQuery AI introduces an end-to-end **Progressive Curriculum Fine-Tuning** pipeline specifically designed for Earth Observation (EO) satellite data. Built on top of the latest **BigEarthNet-Text (arXiv 2603.29630v2)** methodology, this architecture fuses:
1. **Sentinel-1 SAR Radar** (2-channel: VV, VH polarizations)
2. **Sentinel-2 Multispectral Optical** (10 bands: 10m RGB/NIR + 20m Red Edge/SWIR)
3. **InternVL3-1B** Multimodal Large Language Model (4-bit QLoRA)

Unlike standard single-pass fine-tuning which suffers from catastrophic forgetting and low accuracy (~65%), our **7-Round Progressive Curriculum** trains task-specific adapters in sequence (Easy $\to$ Hard) and fuses them into a unified, high-accuracy model (~73–74% VQA accuracy).

All training is configured to run entirely on **Google Colab Free T4 GPU (15GB VRAM)**, with automatic crash recovery, checkpointing to Google Drive, and 4-bit export for local deployment on **NVIDIA GeForce GTX 1650 (4GB VRAM)**.

---

## 📊 Progressive Training Curriculum (7 Rounds)

```
[Session 0: 00_drive_setup + 01_download_datasets]
                          │
                          ▼
[Round 1: 02_r1_warmup] (RSVQA-LR — Domain Warm-up, ~12 min)
                          │
                          ▼
[Round 2: 03_r2_binary_vqa] (BEN-Bench Binary VQA — GOLDEN CHECKPOINT, ~25 min)
           ┌──────────────┼──────────────┬──────────────┐
           ▼              ▼              ▼              ▼
     [Round 3a]     [Round 3b]      [Round 4]      [Round 5]
    (04_r3a_mcq)   (05_r3b_capt)  (06_r4_ground) (07_r5_change)
      ~20 min        ~22 min        ~20 min        ~20 min
           └──────────────┬──────────────┴──────────────┘
                          │
                          ▼
[Round 6: 08_r6_fusion] (Weighted LoRA Merge + Joint Low-LR Training, ~30 min)
                          │
                          ▼
[Step 9: 09_evaluate] (Generate Official SIH Evaluation Scorecard, ~5 min)
                          │
                          ▼
[Step 10: 10_export] (Package 4-bit Model for local GTX 1650 inference, ~5 min)
```

| Round | Notebook | Task | Dataset | Samples | Steps | Colab T4 Time | Target Metric |
|---|---|---|---|---|---|---|---|
| **0** | `00_drive_setup.ipynb`<br>`01_download_datasets.ipynb` | Environment & Data Setup | RSVQA-LR, BEN-Bench, CDVQA | — | — | ~10 min | Drive ready |
| **1** | `02_r1_warmup.ipynb` | Domain Vocabulary Warm-up | RSVQA-LR | 772 | 300 | ~12 min | Loss < 0.35 |
| **2** | `03_r2_binary_vqa.ipynb` | **Binary VQA (Golden Checkpoint)** | BEN-Bench Binary | 6,927 | 500 | ~25 min | **74.2% Acc** |
| **3a** | `04_r3a_mcq.ipynb` | Multiple Choice Reasoning | BEN-Bench MCQ | 5,550 | 400 | ~20 min | 68.4% Acc |
| **3b** | `05_r3b_captioning.ipynb` | Detailed Scene Captioning | BEN-Bench Text | 970 | 400 | ~22 min | BLEU-4 > 30 |
| **4** | `06_r4_grounding.ipynb` | Visual Grounding (BBox) | BEN-Bench GenDet | 1,582 | 450 | ~20 min | mIoU > 60% |
| **5** | `07_r5_change.ipynb` | Bi-Temporal Change Detection | CDVQA | 2,968 | 350 | ~20 min | F1 > 75% |
| **6** | `08_r6_fusion.ipynb` | **Multi-Task Adapter Fusion** | All Datasets (Mixed) | Mixed | 600 | ~30 min | **Unified Model** |
| **7** | `09_evaluate.ipynb` | Benchmark Validation | Benchmark Test Sets | Full | — | ~5 min | Official Report |
| **8** | `10_export.ipynb` | 4-bit Quantized Packaging | Model Export | Full | — | ~5 min | Local Zip |

> **Total Training Time across all rounds**: ~2.5 to 3 hours (can be executed over multiple free Colab sessions).

---

## 💾 Google Drive Storage Structure

All datasets, intermediate checkpoints, and final models are saved directly inside your Google Drive under `/content/drive/MyDrive/SatQuery_AI/`:

```
MyDrive/SatQuery_AI/
├── datasets/
│   ├── rsvqa_lr_train.json
│   ├── rsvqa_lr_val.json
│   ├── ben_bench.json
│   └── cdvqa_train.json
├── ckpt/
│   ├── r1_warmup/
│   │   ├── checkpoint-300/
│   │   └── best/
│   ├── r2_binary_vqa/             <-- GOLDEN CHECKPOINT
│   │   └── best/
│   ├── r3a_mcq/
│   ├── r3b_captioning/
│   ├── r4_grounding/
│   ├── r5_change/
│   └── r6_fusion/                 <-- FINAL MULTI-TASK MODEL
├── exported_model/
│   ├── model.safetensors
│   ├── s1_projection.pt
│   ├── s2_projection.pt
│   └── config.json
└── satquery_rs_internvl.zip        <-- Direct download for local PC
```

---

## 🛡️ Crash Recovery & Session Disconnects

Google Colab free tier may disconnect after inactivity or timeouts. Our training script has built-in **zero-loss crash recovery**:
- Every round saves checkpoints every 50–100 steps directly to Google Drive.
- If Colab disconnects, simply reopen the notebook and run the training cell.
- `train_round.py` detects the latest `checkpoint-X` in Drive and automatically resumes without starting over!

---

## 💻 Local Inference on GTX 1650 (4GB VRAM)

Once Round 6 or Step 10 is complete:
1. Download `satquery_rs_internvl.zip` from your Google Drive.
2. Unzip into:
   ```
   SIH/backend/weights/satquery_rs_internvl/
   ```
3. The SatQuery AI backend automatically detects the exported model and runs in **4-bit mode (consuming only ~1.5 GB VRAM)** on your GTX 1650!
