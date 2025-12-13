import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SupabaseClient } from "@supabase/supabase-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Record a page discovery with retry logic to handle race conditions
 * during user signup where profile may not be fully created yet
 */
export async function recordPageDiscovery(
  supabase: SupabaseClient,
  userId: string,
  pageKey: string,
  maxRetries = 3,
  delayMs = 500
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc('record_page_discovery', {
        p_user_id: userId,
        p_page_key: pageKey
      })

      if (error) {
        // If it's a foreign key error and we have retries left, wait and retry
        if (
          error.message?.includes('foreign key') ||
          error.message?.includes('violates')
        ) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
            continue
          }
        }
        return { success: false, error: error.message }
      }

      // Check if the RPC returned an error in the data
      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success === false) {
          // If it's a "User not found" error and we have retries left, wait and retry
          if (
            data.error?.includes('not found') ||
            data.error?.includes('User')
          ) {
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
              continue
            }
          }
          return { success: false, error: data.error }
        }
        return { success: true }
      }

      return { success: true }
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
        continue
      }
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}
