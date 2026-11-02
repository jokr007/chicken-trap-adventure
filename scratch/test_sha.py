import sys

sys.stdout.reconfigure(encoding='utf-8')

# Pure JS SHA256 logic tested in Python
import hashlib

password = 'Admin2026@Coco'
expected_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
print(f'Expected hash for {password}:')
print(expected_hash)
assert expected_hash == '9c89c9129bcf3d431aecd4ed456e4f3dcd9cc00fd612067b60fcd4d84a78a250'
print('Matches expected hash!')
