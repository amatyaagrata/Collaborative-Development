import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

/**
 * Validates if an email address actually exists (at the domain level).
 * 1. Checks basic regex format.
 * 2. Checks if the domain has valid MX (Mail Exchange) records.
 * 
 * Note: This does not guarantee the specific mailbox exists (e.g., 'abc' in 'abc@gmail.com'),
 * as most mail servers disable the VRFY command for security reasons.
 * However, it filters out fake domains and typos.
 */
export async function validateEmailExistence(email: string): Promise<{ valid: boolean; reason?: string }> {
  // 1. Basic Regex Check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: "Invalid email format." };
  }

  // 2. Domain MX Record Check
  const domain = email.split("@")[1];
  
  try {
    const mxRecords = await resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: "The domain does not appear to have a valid mail server." };
    }
    
    return { valid: true };
  } catch (error: any) {
    console.error(`[EMAIL-VALIDATION] MX lookup failed for ${domain}:`, error.code || error.message);
    
    // Common errors: ENOTFOUND, ENODATA
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return { valid: false, reason: "The email domain does not exist or cannot receive emails." };
    }
    
    // For other errors (timeout, etc.), we might want to fail-safe and allow it, 
    // or block it. Let's be strict for now but allow if it's just a temporary DNS issue.
    // Actually, for a professional app, if DNS fails, we should probably tell them.
    return { valid: false, reason: "Could not verify the email domain. Please check if it's correct." };
  }
}
