
from PIL import Image

img = Image.open('d:\\mul\\adtrotemp-mul-main\\favicon_io\\site-theme.png.temp2').convert('RGBA')
pixels = img.load()
width, height = img.size

for x in range(width):
    for y in range(height):
        r, g, b, a = pixels[x, y]
        if a == 0: continue

        # Detect colors to keep
        is_orange = r > 200 and g > 50 and g < 150 and b < 100
        is_red = r > 200 and g < 100 and b < 100
        is_black = max(r, g, b) < 40
        is_white = min(r, g, b) > 240

        if not (is_orange or is_red or is_black or is_white):
            # Check if gray
            if max(r, g, b) - min(r, g, b) < 30:
                pixels[x, y] = (255, 255, 255, 0)
            # Check for light artifacts
            elif (r + g + b) // 3 > 200 and max(r, g, b) - min(r, g, b) < 60:
                pixels[x, y] = (255, 255, 255, 0)

img.save('d:\\mul\\adtrotemp-mul-main\\favicon_io\\site-theme.png', 'PNG', optimize=True)
