#!/usr/bin/env python3
"""
AI Image Generator for Instagram Posts
Uses Stable Diffusion for local, FREE image generation
"""

import sys
import os
from pathlib import Path

# Will be implemented once diffusers is installed
def generate_deal_image(prompt, output_path, size=(1080, 1080)):
    """
    Generate an image for an Instagram post
    
    Args:
        prompt: Text description of the image
        output_path: Where to save the image
        size: Output dimensions (default 1080x1080 for Instagram)
    """
    try:
        from diffusers import StableDiffusionPipeline
        import torch
        from PIL import Image
        
        # Load model (cached after first run)
        # Using runwayml/stable-diffusion-v1-5 - open and doesn't require auth
        pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16
        )
        
        # Use MPS (Metal) on Mac, or CPU fallback
        if torch.backends.mps.is_available():
            pipe = pipe.to("mps")
        else:
            pipe = pipe.to("cpu")
        
        # Generate image
        image = pipe(
            prompt,
            num_inference_steps=30,
            guidance_scale=7.5,
            height=size[1],
            width=size[0]
        ).images[0]
        
        # Save
        image.save(output_path)
        print(f"✅ Image generated: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 generate-ai-image.py <prompt> <output_path>")
        sys.exit(1)
    
    prompt = sys.argv[1]
    output_path = sys.argv[2]
    
    print(f"🎨 Generating image...")
    print(f"   Prompt: {prompt[:100]}...")
    
    success = generate_deal_image(prompt, output_path)
    sys.exit(0 if success else 1)
