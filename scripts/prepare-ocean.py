"""Prepare the supplied recording for a continuous, sample-accurate ocean loop.

Usage: python scripts/prepare-ocean.py input.mp3
Requires ffmpeg and numpy. The main recording keeps its stereo image and dynamics;
only the final four seconds overlap the first four seconds at equal power.
"""
from pathlib import Path
import subprocess
import sys
import wave

import numpy as np

RATE = 44100
FADE_SECONDS = 4
destination = Path(__file__).resolve().parents[1] / 'assets/audio'
destination.mkdir(parents=True, exist_ok=True)
decoded = subprocess.run([
    'ffmpeg', '-v', 'error', '-i', sys.argv[1], '-f', 'f32le',
    '-ac', '2', '-ar', str(RATE), 'pipe:1',
], capture_output=True, check=True)
samples = np.frombuffer(decoded.stdout, dtype='<f4').reshape(-1, 2)
overlap = FADE_SECONDS * RATE
angle = np.linspace(0, np.pi / 2, overlap, dtype=np.float32)[:, None]
seam = samples[-overlap:] * np.cos(angle) + samples[:overlap] * np.sin(angle)
loop = np.concatenate((samples[overlap:-overlap], seam)) * 3
assert np.max(np.abs(loop)) < 1, 'The recording must not clip.'
subprocess.run([
    'ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '2',
    '-ar', str(RATE), '-i', 'pipe:0', '-map_metadata', '-1',
    '-codec:a', 'libmp3lame', '-q:a', '2',
    str(destination / 'waves-against-rocks-loop.mp3'),
], input=loop.astype('<f4').tobytes(), check=True)
# Older iOS releases lack AudioSession. A native, unmuted silent media element
# selects the media playback route while Web Audio supplies the actual ocean.
with wave.open(str(destination / 'playback-silence.wav'), 'wb') as bridge:
    bridge.setnchannels(1)
    bridge.setsampwidth(2)
    bridge.setframerate(8000)
    bridge.writeframes(bytes(8000 * 2))
print(f'Prepared stereo loop: {len(loop) / RATE:.2f}s; overlap: {FADE_SECONDS}s')
