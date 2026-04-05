import sys
import os
import torch
import numpy as np
from PIL import Image

try:
    import tsr
    import trimesh
except ImportError:
    print("Dependencies missing. Please run:")
    print("pip install torch torchvision torchaudio trimesh tsr")
    sys.exit(1)

from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground

def process_image(image_path, output_path, device="cpu"):
    print(f"Loading TripoSR model on {device}...")
    model = TSR.from_pretrained(
        "stabilityai/TripoSR",
        config_name="config.yaml",
        weight_name="model.ckpt",
    )
    model.renderer.set_chunk_size(131072)
    model.to(device)

    print(f"Processing image: {image_path}")
    image = Image.open(image_path)
    
    print("Removing background...")
    image = remove_background(image, rembg_session=None)
    image = resize_foreground(image, 0.85)

    print("Generating 3D mesh...")
    with torch.no_grad():
        scene_codes = model(image, device=device)
        mesh = model.extract_mesh(scene_codes, resolution=256)[0]

    print(f"Exporting to {output_path}...")
    mesh.export(output_path)
    print("Done!")

if __name__ == "__main__":
    # Determine best device
    device = "cpu"
    if torch.backends.mps.is_available():
        device = "mps"
    elif torch.cuda.is_available():
        device = "cuda:0"
        
    print(f"Using compute device: {device}")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, "public", "assets")
    
    images_to_process = [
        ("base.png", "base_mesh.obj"),
        ("alt1.png", "alt1_mesh.obj"),
        ("alt2.png", "alt2_mesh.obj")
    ]
    
    for in_file, out_file in images_to_process:
        in_path = os.path.join(assets_dir, in_file)
        out_path = os.path.join(assets_dir, out_file)
        
        if os.path.exists(in_path):
            process_image(in_path, out_path, device=device)
        else:
            print(f"Skipping {in_file}: not found.")

    print("All generations complete!")
