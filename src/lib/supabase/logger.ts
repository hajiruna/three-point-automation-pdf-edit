import { supabase, isSupabaseConfigured } from './client'

export interface UsageLog {
  file_name: string
  total_pages: number
  selected_pages: number[]
  pages_extracted: number
  user_agent?: string
}

export interface MergeLog {
  file_names: string[]
  file_count: number
  total_pages: number
  user_agent?: string
}

export async function logPdfExtraction(data: UsageLog): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping log')
    return
  }

  try {
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        action_type: 'extract',
        file_name: data.file_name,
        total_pages: data.total_pages,
        selected_pages: data.selected_pages,
        pages_extracted: data.pages_extracted,
        user_agent: data.user_agent || navigator.userAgent,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to log usage:', error.message)
    } else {
      console.log('Usage logged successfully')
    }
  } catch (err) {
    console.error('Error logging usage:', err)
  }
}

export async function logPdfMerge(data: MergeLog): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping log')
    return
  }

  try {
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        action_type: 'merge',
        file_name: data.file_names.join(', '),
        total_pages: data.total_pages,
        selected_pages: [],
        pages_extracted: data.file_count,
        user_agent: data.user_agent || navigator.userAgent,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to log merge:', error.message)
    } else {
      console.log('Merge logged successfully')
    }
  } catch (err) {
    console.error('Error logging merge:', err)
  }
}
