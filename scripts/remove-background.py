#!/usr/bin/env python3
"""
使用 rembg 库去除图片背景
"""

import os
import sys
from pathlib import Path
from rembg import remove
from PIL import Image

def remove_background(input_path, output_path):
    """
    去除图片背景并保存为透明PNG
    """
    try:
        print(f"🎨 Processing: {input_path}")
        
        # 打开图片
        with Image.open(input_path) as img:
            # 去除背景
            result = remove(img)
            
            # 确保是RGBA模式
            if result.mode != 'RGBA':
                result = result.convert('RGBA')
            
            # 保存结果
            result.save(output_path, 'PNG')
            print(f"✅ Saved to: {output_path}")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def process_all_images():
    """
    处理所有需要去背景的图片
    """
    base_dir = Path(__file__).parent.parent
    
    # 定义需要处理的图片
    images_to_process = [
        (base_dir / "favicon" / "favicon.png", base_dir / "favicon" / "favicon.png"),
        (base_dir / "favicon_io" / "site-logo.png", base_dir / "favicon_io" / "site-logo.png"),
        (base_dir / "favicon_io" / "site-theme.png", base_dir / "favicon_io" / "site-theme.png"),
    ]
    
    print("=" * 40)
    print("   Background Removal Tool")
    print("=" * 40)
    
    success_count = 0
    for input_path, output_path in images_to_process:
        if input_path.exists():
            if remove_background(str(input_path), str(output_path)):
                success_count += 1
        else:
            print(f"⚠️ File not found: {input_path}")
    
    print("\n" + "=" * 40)
    print(f"✨ Processed {success_count}/{len(images_to_process)} images")
    print("=" * 40)

if __name__ == "__main__":
    # 如果提供了参数，处理单个文件
    if len(sys.argv) == 3:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        remove_background(input_file, output_file)
    elif len(sys.argv) == 2:
        # 覆盖原文件
        input_file = sys.argv[1]
        remove_background(input_file, input_file)
    else:
        # 处理所有默认图片
        process_all_images()