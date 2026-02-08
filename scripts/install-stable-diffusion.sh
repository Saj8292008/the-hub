#!/bin/bash

echo "🎨 Setting up local AI image generation..."
echo ""

# Check if dependencies exist
if pip3 show diffusers &>/dev/null; then
  echo "✅ Diffusers already installed"
else
  echo "📦 Installing diffusers (Stable Diffusion library)..."
  pip3 install --quiet diffusers transformers accelerate
fi

if pip3 show torch &>/dev/null; then
  echo "✅ PyTorch already installed"
else
  echo "📦 Installing PyTorch..."
  pip3 install --quiet torch torchvision
fi

if pip3 show Pillow &>/dev/null; then
  echo "✅ Pillow already installed"
else
  echo "📦 Installing Pillow (image processing)..."
  pip3 install --quiet Pillow
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎨 Vega (AI Image Generator) is ready to deploy!"
echo ""
echo "Next: Deploy agent with:"
echo "  curl -X POST http://localhost:4003/api/deployment/deploy -H 'Content-Type: application/json' -d '{\"templateId\":\"image-generator\"}'"
