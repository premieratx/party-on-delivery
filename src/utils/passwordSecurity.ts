// Password security utilities - alternative to Supabase Pro leaked password protection

export interface PasswordStrengthResult {
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
  isValid: boolean;
}

const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'sunshine',
  'master', 'dragon', 'football', 'baseball', 'superman', 'hello',
  'freedom', 'whatever', 'trustno1', 'jordan', 'harley', 'robert'
];

const passwordPatterns = [
  /(.)\1{2,}/, // Repeated characters
  /123456|654321/, // Sequential numbers
  /abcdef|fedcba|qwerty|asdfgh/, // Sequential letters
];

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
    return { score: 0, feedback, isValid: false };
  }
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  if (!hasLower) feedback.push('Include lowercase letters');
  if (!hasUpper) feedback.push('Include uppercase letters');
  if (!hasNumber) feedback.push('Include numbers');
  if (!hasSymbol) feedback.push('Include special characters (!@#$%^&* etc.)');

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (varietyCount >= 3) score += 1;
  if (varietyCount === 4) score += 1;

  // Common password check
  const lowerPassword = password.toLowerCase();
  if (commonPasswords.some(common => lowerPassword.includes(common))) {
    feedback.push('Avoid common passwords');
    score = Math.max(0, score - 1);
  }

  // Pattern checks
  if (passwordPatterns.some(pattern => pattern.test(password))) {
    feedback.push('Avoid predictable patterns');
    score = Math.max(0, score - 1);
  }

  // Personal information check (basic)
  if (/\b(admin|user|test|demo)\b/i.test(password)) {
    feedback.push('Avoid using common words');
  }

  const isValid = score >= 3 && feedback.length === 0;

  return {
    score,
    feedback,
    isValid
  };
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Weak';
  }
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-destructive';
    case 2:
      return 'text-warning';
    case 3:
      return 'text-primary';
    case 4:
      return 'text-success';
    default:
      return 'text-destructive';
  }
}

export async function checkPasswordAgainstBreaches(password: string): Promise<boolean> {
  try {
    // Use HaveIBeenPwned API (free tier) - hash the password for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    
    return text.includes(suffix);
  } catch (error) {
    console.warn('Password breach check failed:', error);
    return false; // Assume safe if check fails
  }
}