"""
download_all.py: Download all training datasets to Google Drive.
Usage: python data/download_all.py --output /content/drive/MyDrive/SatQuery_AI/datasets --dataset all
"""

import os
import json
import argparse
import zipfile
import requests
from pathlib import Path
from tqdm import tqdm


def download_file(url: str, dest: str, desc: str = "") -> bool:
    dest_path = Path(dest)
    if dest_path.exists() and dest_path.stat().st_size > 1024:
        print(f"  ✅ Already exists: {dest_path.name}")
        return True
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        r = requests.get(url, stream=True, timeout=60)
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        with open(dest, "wb") as f, tqdm(
            total=total, unit="B", unit_scale=True, desc=desc or dest_path.name
        ) as bar:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                bar.update(len(chunk))
        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def download_rsvqa_lr(output_dir: str):
    """RSVQA Low-Resolution: 772 images, ~8 MB"""
    print("\n📥 Downloading RSVQA-LR (~8 MB)...")
    # HuggingFace dataset
    os.system(
        f"python -c \""
        f"from datasets import load_dataset; "
        f"ds = load_dataset('syrainy/RSVQA-LR', split='train'); "
        f"ds.to_json('{output_dir}/rsvqa_lr_train.json')"
        f"\""
    )
    os.system(
        f"python -c \""
        f"from datasets import load_dataset; "
        f"ds = load_dataset('syrainy/RSVQA-LR', split='test'); "
        f"ds.to_json('{output_dir}/rsvqa_lr_val.json')"
        f"\""
    )
    print("  ✅ RSVQA-LR saved!")


def download_ben_bench(output_dir: str):
    """BEN-Bench: 1,082 curated S1+S2 pairs from BigEarthNet-v2, ~500 MB"""
    print("\n📥 Downloading BEN-Bench (~500 MB)...")
    print("  Streaming from HuggingFace BigEarthNet-v2.0 (test split)...")
    
    script = f"""
import json
from datasets import load_dataset

# Load BigEarthNet-v2 test split (BEN-Bench verified pairs)
print("  Loading BigEarthNet-v2 test split...")
ds = load_dataset(
    "BigEarthNet/BigEarthNet-v2.0",
    split="test",
    trust_remote_code=True
)

# The 1082 BEN-Bench pairs are the full test split
samples = []
for item in ds:
    # Build binary VQA annotations
    for q in item.get("binary_vqa", []):
        samples.append({{
            "id": f"{{item['patch_id']}}_bvqa_{{len(samples)}}",
            "task_type": "binary_vqa",
            "s2_path": item.get("s2_path", ""),
            "s1_path": item.get("s1_path", ""),
            "question": q["question"],
            "answer": q["answer"],
        }})
    # MCQ annotations
    for q in item.get("mcq", []):
        samples.append({{
            "id": f"{{item['patch_id']}}_mcq_{{len(samples)}}",
            "task_type": "mcq",
            "s2_path": item.get("s2_path", ""),
            "s1_path": item.get("s1_path", ""),
            "question": q["question"],
            "choices": q["choices"],
            "answer": q["answer"],
        }})
    # Caption
    if "caption" in item:
        samples.append({{
            "id": f"{{item['patch_id']}}_cap",
            "task_type": "captioning",
            "s2_path": item.get("s2_path", ""),
            "s1_path": item.get("s1_path", ""),
            "caption": item["caption"],
        }})
    # GenDet bounding boxes
    for det in item.get("gendet", []):
        samples.append({{
            "id": f"{{item['patch_id']}}_det_{{len(samples)}}",
            "task_type": "grounding",
            "s2_path": item.get("s2_path", ""),
            "s1_path": item.get("s1_path", ""),
            "target_class": det["class"],
            "bbox": det["bbox"],
        }})

with open('{output_dir}/ben_bench.json', 'w') as f:
    json.dump(samples, f)

print(f"  Saved {{len(samples)}} annotations to ben_bench.json")
"""
    with open("/tmp/dl_ben.py", "w") as f:
        f.write(script)
    os.system("python /tmp/dl_ben.py")
    print("  ✅ BEN-Bench saved!")


def download_cdvqa(output_dir: str):
    """CDVQA: Change Detection VQA, 2,968 T1/T2 pairs, ~150 MB"""
    print("\n📥 Downloading CDVQA (~150 MB)...")
    # GitHub release
    urls = {
        f"{output_dir}/cdvqa_train.json":
            "https://raw.githubusercontent.com/YZHJessica/CDVQA/main/data/train_qa.json",
        f"{output_dir}/cdvqa_val.json":
            "https://raw.githubusercontent.com/YZHJessica/CDVQA/main/data/test_qa.json",
    }
    for dest, url in urls.items():
        download_file(url, dest, "CDVQA")
    print("  ✅ CDVQA saved!")


def download_levir_cd(output_dir: str):
    """LEVIR-CD: High-res change detection pairs, ~200 MB"""
    print("\n📥 Downloading LEVIR-CD (~200 MB)...")
    # HuggingFace
    os.system(
        f"python -c \""
        f"from datasets import load_dataset; "
        f"ds = load_dataset('LHRS-Bot/LEVIR-CD', trust_remote_code=True); "
        f"ds['train'].to_json('{output_dir}/levir_train.json'); "
        f"ds['test'].to_json('{output_dir}/levir_val.json')"
        f"\""
    )
    print("  ✅ LEVIR-CD saved!")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=str, required=True, help="Output directory")
    parser.add_argument("--dataset", type=str, default="all",
                        choices=["all", "rsvqa_lr", "ben_bench", "cdvqa", "levir_cd"],
                        help="Which dataset to download")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    if args.dataset in ("all", "rsvqa_lr"):
        download_rsvqa_lr(args.output)
    if args.dataset in ("all", "ben_bench"):
        download_ben_bench(args.output)
    if args.dataset in ("all", "cdvqa"):
        download_cdvqa(args.output)
    if args.dataset in ("all", "levir_cd"):
        download_levir_cd(args.output)

    print(f"\n✅ Downloads complete → {args.output}")
    sizes = {f: Path(args.output, f).stat().st_size / 1e6
             for f in os.listdir(args.output)
             if Path(args.output, f).is_file()}
    total_mb = sum(sizes.values())
    for name, mb in sorted(sizes.items()):
        print(f"  {name}: {mb:.1f} MB")
    print(f"  Total: {total_mb:.1f} MB")


if __name__ == "__main__":
    main()
