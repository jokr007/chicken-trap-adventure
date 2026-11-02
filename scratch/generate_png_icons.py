import zlib
import struct

def create_png(width, height, color_bg, draw_emoji=True):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # Pixels: RGBA
    # Let's create an attractive icon:
    # Background color #ff9800 = (255, 152, 0, 255) with rounded corners
    # Center circle or chicken colors:
    # Yellow chicken body, red comb, white eye, orange beak
    r_bg, g_bg, b_bg = color_bg
    raw_rows = []
    
    radius = width * 0.2
    cx, cy = width / 2, height / 2
    
    for y in range(height):
        row = [0] # filter byte 0 (None)
        for x in range(width):
            # Check rounded rectangle
            dx = max(0, abs(x - cx) - (width/2 - radius))
            dy = max(0, abs(y - cy) - (height/2 - radius))
            dist_sq = dx*dx + dy*dy
            if dist_sq > radius*radius:
                # Transparent outside
                row.extend([0, 0, 0, 0])
                continue
            
            # Inside rounded rect: default bg
            r, g, b, a = r_bg, g_bg, b_bg, 255
            
            # Subtle radial gradient for depth
            grad = 1.0 - (dx*dx + dy*dy) / (width * width) * 0.4
            r = int(min(255, max(0, r * grad)))
            g = int(min(255, max(0, g * grad)))
            b = int(min(255, max(0, b * grad)))
            
            # Chicken body (Yellow circle in center)
            body_rad = width * 0.28
            dist_center = ((x - cx)**2 + (y - (cy + height*0.05))**2)**0.5
            if dist_center <= body_rad:
                # Yellow chicken
                r, g, b = 255, 235, 59
                # Head comb (red) at top
            
            # Chicken comb (top red arches)
            comb_rad = width * 0.1
            dist_comb1 = ((x - cx)**2 + (y - (cy - height*0.28))**2)**0.5
            dist_comb2 = ((x - (cx - width*0.08))**2 + (y - (cy - height*0.24))**2)**0.5
            dist_comb3 = ((x - (cx + width*0.08))**2 + (y - (cy - height*0.24))**2)**0.5
            if dist_comb1 <= comb_rad or dist_comb2 <= comb_rad or dist_comb3 <= comb_rad:
                r, g, b = 244, 67, 54 # Red
                
            # Eyes
            eye_y = cy - height * 0.05
            eye_l_dist = ((x - (cx - width*0.1))**2 + (y - eye_y)**2)**0.5
            eye_r_dist = ((x - (cx + width*0.1))**2 + (y - eye_y)**2)**0.5
            if eye_l_dist <= width * 0.045 or eye_r_dist <= width * 0.045:
                # Pupil
                if eye_l_dist <= width * 0.02 or eye_r_dist <= width * 0.02:
                    r, g, b = 20, 20, 20
                else:
                    r, g, b = 255, 255, 255
                    
            # Orange Beak (triangle at center)
            beak_top = cy
            beak_bottom = cy + height * 0.12
            if beak_top <= y <= beak_bottom:
                prog = (y - beak_top) / (beak_bottom - beak_top)
                beak_w = width * 0.09 * (1.0 - prog)
                if abs(x - cx) <= beak_w:
                    r, g, b = 255, 111, 0 # Dark orange
                    
            # Chicken wattles (red under beak)
            wattle_y = cy + height * 0.15
            dist_wat = ((x - cx)**2 + (y - wattle_y)**2)**0.5
            if dist_wat <= width * 0.045:
                r, g, b = 229, 57, 53
                
            row.extend([r, g, b, a])
        raw_rows.append(bytes(row))
        
    compressed_data = zlib.compress(b''.join(raw_rows), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed_data)
    idat = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc)
    
    # IEND
    iend_crc = zlib.crc32(b'IEND')
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png + ihdr + idat + iend

# Generate 192x192 and 512x512
png_192 = create_png(192, 192, (255, 152, 0))
with open("icon-192.png", "wb") as f:
    f.write(png_192)

png_512 = create_png(512, 512, (255, 152, 0))
with open("icon-512.png", "wb") as f:
    f.write(png_512)

# Maskable icons (no transparent corners, full bleed)
def create_maskable_png(width, height):
    # Same as create_png but without rounded transparent corners
    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data))
    
    cx, cy = width / 2, height / 2
    raw_rows = []
    for y in range(height):
        row = [0]
        for x in range(width):
            r, g, b, a = 255, 152, 0, 255 # Solid theme background
            
            # Chicken body
            body_rad = width * 0.28
            dist_center = ((x - cx)**2 + (y - (cy + height*0.05))**2)**0.5
            if dist_center <= body_rad:
                r, g, b = 255, 235, 59
            
            # Comb
            comb_rad = width * 0.1
            dist_comb1 = ((x - cx)**2 + (y - (cy - height*0.28))**2)**0.5
            dist_comb2 = ((x - (cx - width*0.08))**2 + (y - (cy - height*0.24))**2)**0.5
            dist_comb3 = ((x - (cx + width*0.08))**2 + (y - (cy - height*0.24))**2)**0.5
            if dist_comb1 <= comb_rad or dist_comb2 <= comb_rad or dist_comb3 <= comb_rad:
                r, g, b = 244, 67, 54
                
            # Eyes
            eye_y = cy - height * 0.05
            eye_l_dist = ((x - (cx - width*0.1))**2 + (y - eye_y)**2)**0.5
            eye_r_dist = ((x - (cx + width*0.1))**2 + (y - eye_y)**2)**0.5
            if eye_l_dist <= width * 0.045 or eye_r_dist <= width * 0.045:
                if eye_l_dist <= width * 0.02 or eye_r_dist <= width * 0.02:
                    r, g, b = 20, 20, 20
                else:
                    r, g, b = 255, 255, 255
                    
            # Beak
            beak_top = cy
            beak_bottom = cy + height * 0.12
            if beak_top <= y <= beak_bottom:
                prog = (y - beak_top) / (beak_bottom - beak_top)
                beak_w = width * 0.09 * (1.0 - prog)
                if abs(x - cx) <= beak_w:
                    r, g, b = 255, 111, 0
                    
            # Wattles
            wattle_y = cy + height * 0.15
            dist_wat = ((x - cx)**2 + (y - wattle_y)**2)**0.5
            if dist_wat <= width * 0.045:
                r, g, b = 229, 57, 53
                
            row.extend([r, g, b, a])
        raw_rows.append(bytes(row))
        
    compressed_data = zlib.compress(b''.join(raw_rows), 9)
    idat = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', zlib.crc32(b'IDAT' + compressed_data))
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))
    return png + ihdr + idat + iend

maskable_192 = create_maskable_png(192, 192)
with open("icon-maskable-192.png", "wb") as f:
    f.write(maskable_192)

maskable_512 = create_maskable_png(512, 512)
with open("icon-maskable-512.png", "wb") as f:
    f.write(maskable_512)

print("Created icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png")
