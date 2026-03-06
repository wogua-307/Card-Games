const fs = require('fs');

const sampleRate = 22050; // lower sample rate for retro feel
const duration = 8; // 8 seconds loop
const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples);

// WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
buffer.writeUInt16LE(1, 22); // NumChannels (Mono)
buffer.writeUInt32LE(sampleRate, 24); // SampleRate
buffer.writeUInt32LE(sampleRate, 28); // ByteRate
buffer.writeUInt16LE(1, 32); // BlockAlign
buffer.writeUInt16LE(8, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples, 40);

// Melody notes (frequencies in Hz)
// Happy upbeat C major melody
// Notes: C5, E5, G5, C6
const freqs = [
  523.25, // C5
  659.25, // E5
  783.99, // G5
  1046.50, // C6
  783.99, // G5
  659.25, // E5
  523.25, // C5
  392.00, // G4
];

const tempo = 4; // notes per second

for (let i = 0; i < numSamples; i++) {
  const time = i / sampleRate;
  const beat = Math.floor(time * tempo * 2); // 8th notes

  // Create a bouncy rhythm pattern
  // Play note on beat 0, 1, 2, but rest on 3, etc.
  const pattern = [1, 1, 1, 0, 1, 1, 0, 1];
  const isPlaying = pattern[beat % pattern.length];

  // Base frequency
  const noteIdx = Math.floor(beat / 2) % freqs.length;
  let freq = freqs[noteIdx];

  // Add an upbeat arpeggio on top
  if (beat % 2 === 1) {
    freq *= 1.5; // perfect fifth up for bounce
  }

  // Envelope (decay for pluck sound)
  const beatTime = (time * tempo * 2) % 1;
  const envelope = Math.max(0, 1 - beatTime * 2.5); // Fast decay for 'plink' 8-bit sound

  // Square wave generation
  const period = sampleRate / freq;
  let sample = (i % period) < (period / 2) ? 1 : -1;

  if (!isPlaying) sample = 0;

  // Mix and scale to 8-bit (0-255)
  const val = Math.floor(128 + (sample * envelope * 40));

  buffer.writeUInt8(val, 44 + i);
}

fs.writeFileSync('public/audio/bgm.wav', buffer);
console.log('Cute 8-bit bgm.wav generated successfully!');
