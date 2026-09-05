import numpy as np
from PIL import Image
from pathlib import Path

def create_synthetic_datasets(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    width, height = 512, 512

    # 1. Delhi Optical 2022 (Baseline true-color RGB)
    # Grids of urban (gray/brown), vegetation (green), river (blue)
    img_2022 = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Vegetation base (greenish-olive)
    img_2022[:, :] = [75, 125, 65]
    
    # Urban core in western half (gray/tan)
    img_2022[50:450, 40:240] = [170, 160, 150]
    # Urban road arteries
    img_2022[200:215, 20:480] = [110, 110, 115]
    img_2022[40:480, 140:155] = [110, 110, 115]

    # River meandering down eastern side (blue/teal)
    for y in range(height):
        x_center = int(360 + 35 * np.sin(y / 60.0))
        img_2022[y, max(0, x_center - 22): min(width, x_center + 22)] = [35, 95, 150]

    # Add realistic texture noise
    noise = np.random.normal(0, 12, (height, width, 3)).astype(np.int16)
    img_2022 = np.clip(img_2022.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    p1 = output_dir / "delhi_optical_2022.tif"
    Image.fromarray(img_2022).save(p1, format="TIFF")
    print(f"Created {p1}")

    # 2. Delhi Optical 2024 (Urban expansion into east + new highway)
    img_2024 = np.array(img_2022)
    
    # Urban expansion in eastern sector (replacing vegetation with concrete/roofs)
    img_2024[180:350, 260:420] = [185, 175, 165]
    # New expressway connecting east to west
    img_2024[310:325, 20:500] = [95, 95, 100]

    noise2 = np.random.normal(0, 8, (height, width, 3)).astype(np.int16)
    img_2024 = np.clip(img_2024.astype(np.int16) + noise2, 0, 255).astype(np.uint8)

    p2 = output_dir / "delhi_optical_2024.tif"
    Image.fromarray(img_2024).save(p2, format="TIFF")
    print(f"Created {p2}")

    # 3. Delhi SAR 2024 (Active Microwave VV/VH Backscatter)
    # Bright specular reflections on urban structures, dark zero-return on calm water
    sar = np.zeros((height, width), dtype=np.uint8)
    
    # Moderate vegetation volume scattering (~ -14 dB)
    sar[:, :] = 80
    
    # High urban double-bounce scattering (> -8 dB)
    sar[50:450, 40:240] = 215
    sar[180:350, 260:420] = 225
    sar[310:325, 20:500] = 190
    
    # Specular null on smooth river (< -22 dB)
    for y in range(height):
        x_center = int(360 + 35 * np.sin(y / 60.0))
        sar[y, max(0, x_center - 24): min(width, x_center + 24)] = 15

    # SAR Rayleigh speckle noise
    speckle = np.random.gamma(4, 0.25, (height, width))
    sar_speckled = np.clip(sar.astype(np.float32) * speckle, 0, 255).astype(np.uint8)

    p3 = output_dir / "delhi_sar_2024.tif"
    Image.fromarray(sar_speckled).save(p3, format="TIFF")
    print(f"Created {p3}")

    # 4. Airport Optical (Runway corridors, aprons, taxiways, tarmac)
    airport = np.zeros((height, width, 3), dtype=np.uint8)
    # Surrounding grassland
    airport[:, :] = [90, 140, 70]

    # Terminal building
    airport[210:270, 180:340] = [210, 215, 220]
    # Apron tarmac
    airport[270:340, 150:370] = [140, 145, 150]

    # Primary Runway 10/28 (dark asphalt, high contrast)
    airport[115:185, 40:470] = [50, 50, 55]
    # Centerline markings
    for x in range(50, 460, 30):
        airport[148:152, x:x+18] = [240, 240, 245]

    # Secondary Runway 09/27 (rigid concrete)
    airport[380:445, 60:470] = [80, 82, 85]
    for x in range(70, 460, 30):
        airport[411:414, x:x+18] = [240, 240, 245]

    # Taxiway connectors
    airport[185:270, 100:125] = [65, 65, 70]
    airport[185:270, 390:415] = [65, 65, 70]

    noise_air = np.random.normal(0, 7, (height, width, 3)).astype(np.int16)
    airport = np.clip(airport.astype(np.int16) + noise_air, 0, 255).astype(np.uint8)

    p4 = output_dir / "airport_optical.tif"
    Image.fromarray(airport).save(p4, format="TIFF")
    print(f"Created {p4}")

if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "sample_images"
    create_synthetic_datasets(out)
