
import sys
import os
from PIL import Image
from rembg import remove

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import locale
    if locale.getpreferredencoding().upper() != 'UTF-8':
        os.environ['PYTHONIOENCODING'] = 'utf-8'

try:
    with Image.open(sys.argv[1]) as img:
        output = remove(img)
        output.save(sys.argv[2], 'PNG')
    print("Success")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
