#!/bin/bash

# Create Icons for EyeTrip 360 PWA
# This creates icons using ImageMagick or a Python fallback

echo "🎨 Creating icons for EyeTrip 360..."

# Create icons directory
mkdir -p assets/icons

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to create icons..."
    
    # Create icons with ImageMagick
    for size in 72 96 128 144 192 512; do
        convert -size ${size}x${size} \
            -background '#1976d2' \
            -fill white \
            -gravity center \
            -font Arial-Bold \
            -pointsize $((size/3)) \
            label:"360°" \
            assets/icons/icon-${size}x${size}.png
        echo "✅ Created icon-${size}x${size}.png"
    done
    
elif command -v python3 &> /dev/null; then
    echo "ImageMagick not found. Using Python to create icons..."
    
    # Create icons with Python/Pillow
    python3 << 'PYTHON_SCRIPT'
import os
from PIL import Image, ImageDraw, ImageFont
import sys

# Create icons directory
os.makedirs('assets/icons', exist_ok=True)

# Icon sizes
sizes = [72, 96, 128, 144, 192, 512]

# Colors
bg_color = (25, 118, 210)  # Material Blue #1976d2
text_color = (255, 255, 255)  # White

for size in sizes:
    # Create new image with blue background
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw a circle
    margin = size // 10
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill=bg_color, outline=text_color, width=max(2, size//50))
    
    # Add text "360°"
    text = "360°"
    
    # Try to use a font, fallback to default if not available
    try:
        # Try to find a suitable font size
        font_size = size // 3
        # Use default font (Pillow's built-in)
        font = None
        # Get text bbox for centering
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except:
        text_width = size // 2
        text_height = size // 4
    
    # Calculate position to center text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - size // 10
    
    # Draw text
    draw.text((x, y), text, fill=text_color)
    
    # Add "VR" text below
    vr_text = "VR"
    try:
        vr_bbox = draw.textbbox((0, 0), vr_text, font=font)
        vr_width = vr_bbox[2] - vr_bbox[0]
    except:
        vr_width = size // 4
    
    vr_x = (size - vr_width) // 2
    vr_y = y + text_height + size // 20
    draw.text((vr_x, vr_y), vr_text, fill=text_color)
    
    # Save image
    filename = f'assets/icons/icon-{size}x{size}.png'
    img.save(filename, 'PNG')
    print(f'✅ Created {filename}')

print('✅ All icons created successfully!')
PYTHON_SCRIPT
    
else
    echo "Neither ImageMagick nor Python found. Creating placeholder icons with HTML..."
    
    # Create HTML-based icon generator
    cat > create-icons.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <h1>Icon Generator for EyeTrip 360</h1>
    <p>Right-click each icon and save as the specified filename in assets/icons/</p>
    
    <script>
        const sizes = [72, 96, 128, 144, 192, 512];
        
        sizes.forEach(size => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Blue background
            ctx.fillStyle = '#1976d2';
            ctx.fillRect(0, 0, size, size);
            
            // White circle
            ctx.strokeStyle = 'white';
            ctx.lineWidth = Math.max(2, size/50);
            ctx.beginPath();
            const margin = size/10;
            ctx.arc(size/2, size/2, (size/2) - margin, 0, 2 * Math.PI);
            ctx.stroke();
            
            // White text
            ctx.fillStyle = 'white';
            ctx.font = `bold ${size/3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('360°', size/2, size/2 - size/10);
            
            ctx.font = `bold ${size/5}px Arial`;
            ctx.fillText('VR', size/2, size/2 + size/6);
            
            // Add to page
            const container = document.createElement('div');
            container.style.margin = '20px';
            container.style.display = 'inline-block';
            
            const label = document.createElement('p');
            label.textContent = `icon-${size}x${size}.png`;
            container.appendChild(label);
            container.appendChild(canvas);
            
            document.body.appendChild(container);
            
            // Convert to downloadable image
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `icon-${size}x${size}.png`;
                link.textContent = 'Download';
                link.style.display = 'block';
                container.appendChild(link);
            });
        });
    </script>
</body>
</html>
HTML
    
    echo "📝 Created create-icons.html"
    echo "Open this file in your browser to generate and save the icons manually"
    open create-icons.html 2>/dev/null || echo "Please open create-icons.html in your browser"
fi

# Create a simple SVG icon as fallback
echo "Creating SVG icon as additional option..."
cat > assets/icons/icon.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1976d2"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="white" stroke-width="20"/>
  <text x="256" y="240" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">360°</text>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">VR</text>
</svg>
SVG

echo "✅ Created icon.svg"

# Check if Pillow is installed for Python fallback
if command -v python3 &> /dev/null; then
    python3 -c "import PIL" 2>/dev/null || {
        echo ""
        echo "📦 To use Python icon generation, install Pillow:"
        echo "pip3 install Pillow"
    }
fi

echo ""
echo "✅ Icon creation complete!"
echo ""
echo "If icons weren't created automatically:"
echo "1. Install ImageMagick: brew install imagemagick"
echo "2. Or install Python Pillow: pip3 install Pillow"
echo "3. Or open create-icons.html in your browser"
echo ""
echo "Then run this script again."
