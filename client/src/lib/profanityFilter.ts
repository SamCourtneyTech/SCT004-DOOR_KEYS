// Basic profanity filter - replace with more comprehensive solution as needed
const PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'asshole',
  'bastard', 'cock', 'dick', 'piss', 'pussy', 'slut', 'whore',
  'nigger', 'nigga', 'faggot', 'retard', 'gay', 'lesbian'
];

export function filterProfanity(text: string): string {
  let filtered = text.toLowerCase();
  
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  
  // Restore original case for non-profane parts
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (filtered[i] === '*') {
      result += '*';
    } else {
      result += text[i];
    }
  }
  
  return result || 'Player';
}

export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
}
