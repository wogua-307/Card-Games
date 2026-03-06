const fs = require('fs');

const sampleRate = 22050;
const duration = 16; // 16 seconds loop for a slow ambient track
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

// Pentatonic ambient scale (C4, D4, F4, G4, A4, C5)
const freqs = [
  261.63, // C4
  293.66, // D4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  523.25, // C5
];

// We will use multiple oscillators with long decay for ambient drone feel
const activeNotes = [];
const tempo = 0.5; // very slow, 1 note every 2 seconds

for (let i = 0; i < Math.floor(duration * tempo); i++) {
  // Random note from scale
  const freq = freqs[Math.floor(Math.random() * freqs.length)];
  const startTime = i / tempo;
  activeNotes.push({ freq, startTime });
}

for (let i = 0; i < numSamples; i++) {
  const time = i / sampleRate;
  let sample = 0;

  // Sum active notes
  for (const note of activeNotes) {
    if (time >= note.startTime) {
      // Very slow attack, long tail
      const dt = time - note.startTime;
      if (dt < 4) { // active for 4 seconds
        // Sine wave is smooth
        const osc = Math.sin(2 * Math.PI * note.freq * time);
        // Envelope: soft attack (1s), decay (3s)
        let env = 0;
        if (dt < 1) env = dt; // fade in
        else env = 1 - (dt - 1) / 3; // fade out slowly

        sample += osc * Math.pow(env, 2) * 0.4;
      }
    }
  }

  // Soft low pass filter approximation
  if (sample > 1) sample = 1;
  if (sample < -1) sample = -1;

  // Map to 8-bit
  const val = Math.floor(128 + sample * 127);
  buffer.writeUInt8(val, 44 + i);
}

fs.writeFileSync('public/audio/bgm_quiet.wav', buffer);
console.log('Quiet Zen bgm_quiet.wav generated successfully!');
