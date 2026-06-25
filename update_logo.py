import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    is_root = os.path.dirname(filepath).endswith('stackly')
    logo_path = "logo.webp" if is_root else "../logo.webp"
    index_path = "index.html" if is_root else "../index.html"
    
    brand_html = f'<a href="{index_path}" class="brand">\n      <img src="{logo_path}" alt="Stackly" class="logo-img">\n    </a>'

    original_content = content

    # Strategy for headers
    # If there's an existing <a class="brand"> inside header, replace it.
    # Otherwise, insert it after <div class="site-header__inner">
    
    # 1. Replace existing <a class="brand">...</a> that contains svg in header
    # We will just replace any <a ... class="brand"> ... </a> with the new brand_html
    # Wait, the footer also has <a class="brand"> in some files, but in index.html it has <div class="footer-brand"> and no <a>
    
    # Let's handle index.html specifically first for its missing tags
    if filename == "index.html":
        # Header
        content = re.sub(
            r'(<div class="site-header__inner">)\s*(<nav class="nav-main">)',
            rf'\1\n    {brand_html}\n    \2',
            content,
            flags=re.IGNORECASE
        )
        # Footer
        content = re.sub(
            r'(<div class="footer-brand">)\s*<p>',
            rf'\1\n      {brand_html}\n      <p>',
            content,
            flags=re.IGNORECASE
        )
    else:
        # Replace existing brand links in header and footer
        # We look for <a href="..." class="brand"> ... </a>
        # The svg block spans multiple lines
        pattern = re.compile(r'<a[^>]*class="brand"[^>]*>.*?</a>', re.DOTALL)
        
        # In case the footer has <div class="footer-brand"> and no <a> inside (like 404.html maybe?), we can check if replacement happened.
        content = pattern.sub(brand_html, content)
        
        # If the file had empty footer-brand
        content = re.sub(
            r'(<div class="footer-brand">)\s*<p>',
            rf'\1\n      {brand_html}\n      <p>',
            content,
            flags=re.IGNORECASE
        )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
