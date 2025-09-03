interface ToneResult {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export function createTone(audioContext: AudioContext, frequency: number, initialVolume: number = 0.1): ToneResult {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Set up oscillator
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  // Set up gain (volume) with custom initial volume
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(initialVolume, audioContext.currentTime + 0.1); // Fade in
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Start oscillator
  oscillator.start();
  
  return { oscillator, gainNode };
}

export function stopTone(oscillator: OscillatorNode, gainNode: GainNode | null) {
  if (gainNode) {
    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, gainNode.context.currentTime + 0.1);
  }
  
  // Stop oscillator after fade out
  setTimeout(() => {
    try {
      oscillator.stop();
    } catch (e) {
      // Oscillator might already be stopped
    }
  }, 150);
}

export function playSuccessSound() {
  // Create a brief success sound (major chord)
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5 (A major chord)
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime + index * 0.1);
    oscillator.stop(audioContext.currentTime + 0.4);
  });
}

export function playFailSound() {
  // Create a brief failure sound (descending)
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const frequencies = [440, 370, 311]; // Descending notes
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + index * 0.1 + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + index * 0.1 + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime + index * 0.1);
    oscillator.stop(audioContext.currentTime + index * 0.1 + 0.3);
  });
}
