import os
import sys
import shutil

try:
    from gradio_client import Client, handle_file
except ImportError:
    print("Dependencies missing. Please run:")
    print("pip install gradio_client")
    sys.exit(1)

def run_lgm(image_path, output_dir):
    print("--- Starting LGM (Large Multi-View Gaussian Model) ---")
    try:
        client = Client("ashawkey/LGM")
        # Api requires image, true/false for background removal
        result = client.predict(
            input_image=handle_file(image_path),
            api_name="/process_image"
        )
        
        # result is typically [video_path, ply_path] 
        print(f"LGM Output received: {result}")
        
        if len(result) > 1 and result[1].endswith(".ply"):
            shutil.copy(result[1], os.path.join(output_dir, "lgm_splat.ply"))
            print("Successfully saved LGM splat to lgm_splat.ply")
        else:
            print("Failed to find .ply in LGM response.")

    except Exception as e:
        print(f"LGM Generation failed: {e}")

def run_splatter_image(image_path, output_dir):
    print("--- Starting Splatter Image ---")
    try:
        # Note: Space names can be volatile, we'll hit symild/Splatter-Image
        client = Client("szymanowiczs/splatter-image-v2")
        result = client.predict(
            image=handle_file(image_path),
            api_name="/run"
        )
        
        print(f"Splatter Image Output received: {result}")
        if result and result.endswith(".ply"):
            shutil.copy(result, os.path.join(output_dir, "splatter_splat.ply"))
            print("Successfully saved Splatter Splat.")
            
    except Exception as e:
        print(f"Splatter Image Generation failed: {e}")

def run_dreamgaussian(image_path, output_dir):
    print("--- Starting DreamGaussian ---")
    try:
        client = Client("ashawkey/dreamgaussian")
        result = client.predict(
            input_image=handle_file(image_path),
            api_name="/process_image"
        )
        
        print(f"DreamGaussian Output received: {result}")
        if len(result) > 1 and result[1].endswith(".obj"):
            # DreamGaussian primarily outputs meshes on its Gradio space, but uses splats internally.
            shutil.copy(result[1], os.path.join(output_dir, "dreamgaussian_mesh.obj"))
            print("Successfully saved DreamGaussian obj (Note: space defaults to mesh export).")
            
    except Exception as e:
        print(f"DreamGaussian Generation failed: {e}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, "public", "assets")
    target_image = os.path.join(assets_dir, "base.png")
    
    if not os.path.exists(target_image):
        print(f"Error: Could not find target image at {target_image}")
        sys.exit(1)
        
    print(f"Sending {target_image} to Hugging Face Spaces for 3D generation...")
    
    # Run all three to compare
    run_lgm(target_image, assets_dir)
    run_splatter_image(target_image, assets_dir)
    run_dreamgaussian(target_image, assets_dir)
    
    print("All generations complete!")
