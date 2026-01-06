import re
import os
import subprocess
import argparse
import sys

def download_images(url, output_dir):
    print(f"Processing {url} -> {output_dir}")
    
    # Fetch raw HTML
    try:
        result = subprocess.run(['curl', '-L', '-s', url], capture_output=True, text=True)
        content = result.stdout
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return

    # Find all framer images matching the URL pattern directly
    # This avoids issues with src="" attribute formatting or whitespace
    matches = re.findall(r'(https://framerusercontent.com/images/[a-zA-Z0-9_\-\.]+(?:\?[a-zA-Z0-9_\-\.=&]+)?)', content)

    # Filter for image extensions
    images = [url for url in matches if any(ext in url for ext in ['.png', '.jpg', '.webp', '.jpeg', '.gif'])]

    # Deduplicate preserving order
    seen = set()
    unique_images = []
    for img in images:
        base = img.split('?')[0]
        if base not in seen:
            unique_images.append(img)
            seen.add(base)

    print(f"Found {len(unique_images)} images.")
    os.makedirs(output_dir, exist_ok=True)

    for i, img_url in enumerate(unique_images):
        # Determine extension
        ext = 'png'
        if '.webp' in img_url: ext = 'webp'
        elif '.jpg' in img_url: ext = 'jpg'
        elif '.jpeg' in img_url: ext = 'jpg'
        
        filename = f"image_{i+1:02d}.{ext}"
        filepath = os.path.join(output_dir, filename)
        
        if os.path.exists(filepath):
            print(f"Skipping {filename} (exists)")
            continue
            
        # Download
        print(f"Downloading {filename}...")
        subprocess.run(['curl', '-s', '-L', '-o', filepath, img_url])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="URL to scrape")
    parser.add_argument("slug", help="Slug for output directory")
    args = parser.parse_args()
    
    output_dir = os.path.join("images", args.slug)
    download_images(args.url, output_dir)
