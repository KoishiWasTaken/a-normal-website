// Username validation
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3 || username.length > 16) {
    return { valid: false, error: 'Username must be 3-16 characters long' }
  }

  // Only alphanumeric, dashes, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, dashes, and underscores' }
  }

  // Must have at least one alphanumeric character
  if (!/[a-zA-Z0-9]/.test(username)) {
    return { valid: false, error: 'Username must contain at least one letter or number' }
  }

  // No consecutive dashes or underscores
  if (/__|--|-_|_-/.test(username)) {
    return { valid: false, error: 'Username cannot have consecutive dashes or underscores' }
  }

  return { valid: true }
}

// Password validation
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8 || password.length > 24) {
    return { valid: false, error: 'Password must be 8-24 characters long' }
  }

  // Alphanumeric + common symbols
  // Allow: A-Z, a-z, 0-9, and common symbols: !@#$%^&*()_+-=[]{}|;:,.<>?
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/.test(password)) {
    return { valid: false, error: 'Password contains invalid characters' }
  }

  return { valid: true }
}
