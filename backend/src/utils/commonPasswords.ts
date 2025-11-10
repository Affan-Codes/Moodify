// Top 100 most common passwords to block
export const commonPasswords = new Set([
  "password",
  "password123",
  "password1",
  "12345678",
  "123456789",
  "12345",
  "qwerty",
  "abc123",
  "password1!",
  "password123!",
  "pass123",
  "welcome",
  "welcome123",
  "welcome1",
  "admin",
  "admin123",
  "administrator",
  "root",
  "user",
  "test",
  "test123",
  "demo",
  "demo123",
  "letmein",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "whatever",
  "trustno1",
  "hello",
  "freedom",
  "computer",
  "internet",
  "abcd1234",
  "changeme",
  "change",
  "passw0rd",
  "p@ssword",
  "p@ssw0rd",
  "password!",
  "qwerty123",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "1qaz2wsx",
  "iloveyou",
  "login",
  "access",
  "secret",
  "secure",
  "mypassword",
  "mypass",
  "guest",
  "default",
  "welcome123!",
  "password123!",
  "admin123!",
  "qwerty123!",
  "therapy",
  "therapy123",
  "therapy1",
  "moodify",
  "moodify123",
  "mental",
  "wellness",
  "health",
  "health123",
]);

// Context-specific words to check (related to your app)
export const contextWords = new Set([
  "therapy",
  "therapist",
  "moodify",
  "mood",
  "mental",
  "health",
  "wellness",
  "patient",
  "session",
  "chat",
  "counseling",
  "psychology",
]);

// Check if password contains sequential numbers
export const hasSequentialNumbers = (password: string): boolean => {
  const sequences = [
    "012345",
    "123456",
    "234567",
    "345678",
    "456789",
    "567890",
    "098765",
    "987654",
    "876543",
    "765432",
    "654321",
    "543210",
  ];

  const lowerPass = password.toLowerCase();
  return sequences.some((seq) => lowerPass.includes(seq));
};

// Check if password contains repeated characters (e.g., "aaa", "111")
export const hasRepeatedChars = (password: string): boolean => {
  return /(.)\1{2,}/.test(password);
};

// Check if password is keyboard pattern
export const isKeyboardPattern = (password: string): boolean => {
  const patterns = [
    "qwerty",
    "asdfgh",
    "zxcvbn",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "1qaz2wsx",
    "qazwsx",
  ];

  const lowerPass = password.toLowerCase();
  return patterns.some((pattern) => lowerPass.includes(pattern));
};

// Check if password is in common passwords list
export const isCommonPassword = (password: string): boolean => {
  const lowerPass = password.toLowerCase();

  // Check exact match
  if (commonPasswords.has(lowerPass)) {
    return true;
  }

  // Check if base word (without numbers/symbols) is common
  const baseWord = lowerPass.replace(
    /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g,
    ""
  );
  if (commonPasswords.has(baseWord)) {
    return true;
  }

  return false;
};

// Check if password contains context-specific words
export const hasContextWord = (password: string): boolean => {
  const lowerPass = password.toLowerCase();

  for (const word of contextWords) {
    if (lowerPass.includes(word)) {
      return true;
    }
  }

  return false;
};

export const validatePasswordStrength = (
  password: string
): { isValid: boolean; error?: string } => {
  // Check length first
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  if (password.length > 128) {
    return { isValid: false, error: "Password too long (max 128 characters)" };
  }

  // Check common passwords
  if (isCommonPassword(password)) {
    return {
      isValid: false,
      error: "This password is too common. Please choose a stronger password",
    };
  }

  // Check sequential numbers
  if (hasSequentialNumbers(password)) {
    return {
      isValid: false,
      error: "Password cannot contain sequential numbers (e.g., 123456)",
    };
  }

  // Check repeated characters
  if (hasRepeatedChars(password)) {
    return {
      isValid: false,
      error: "Password cannot contain repeated characters (e.g., aaa, 111)",
    };
  }

  // Check keyboard patterns
  if (isKeyboardPattern(password)) {
    return {
      isValid: false,
      error: "Password cannot contain keyboard patterns (e.g., qwerty)",
    };
  }

  // Check context-specific words
  if (hasContextWord(password)) {
    return {
      isValid: false,
      error: "Password cannot contain therapy or app-related words",
    };
  }

  // Check character requirements
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one number",
    };
  }

  if (!/[@$!%*?&#]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character (@$!%*?&#)",
    };
  }

  return { isValid: true };
};
