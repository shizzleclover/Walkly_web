import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

console.log('Supabase configuration loaded:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
})

// Singleton pattern to prevent multiple client instances
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
      console.log('Supabase client created successfully')
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      throw error
    }
  }
  return supabaseInstance
})()

// Auth helper functions
export const authHelpers = {
  async signUp(email: string, password: string, username?: string) {
    console.log('Starting signup process for:', email, 'with username:', username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable redirect, force OTP
        data: {
          email_confirm: false, // Ensure email confirmation is required
          username: username || email.split('@')[0] // Use provided username or email prefix
        }
      }
    });
    
    console.log('Signup response:', { data, error });
    
    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
    
    // Check if user needs email confirmation
    if (data.user && !data.user.email_confirmed_at) {
      console.log('User created, email confirmation required');
      return { data, error: null, needsEmailConfirmation: true };
    }
    
    return { data, error, needsEmailConfirmation: false };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signInWithOtp: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      }
    })
    return { data, error }
  },

  verifyOtp: async (email: string, token: string, type: 'signup' | 'recovery' | 'email' = 'email') => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    })
    return { data, error }
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      }
    })
    return { data, error }
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}

// User profile helpers
export const userHelpers = {
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  updateUserProfile: async (userId: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  getUserStats: async (userId: string) => {
    const { data, error } = await supabase.rpc('get_user_walk_stats', {
      user_uuid: userId
    })
    return { data, error }
  },

  isUserOnTrial: async (userId: string) => {
    const { data, error } = await supabase.rpc('is_user_on_trial', {
      user_uuid: userId
    })
    return { data, error }
  },

  userHasPremiumAccess: async (userId: string) => {
    const { data, error } = await supabase.rpc('user_has_premium_access', {
      user_uuid: userId
    })
    return { data, error }
  }
}

// Walk helpers
export const walkHelpers = {
  createWalk: async (walkData: {
    user_id: string
    start_time: string
    end_time?: string
    duration?: number
    distance?: number
    route_path?: any[]
    theme?: string
    reflection?: string
    synced?: boolean
  }) => {
    const { data, error } = await supabase
      .from('walks')
      .insert(walkData)
      .select()
      .single()
    return { data, error }
  },

  updateWalk: async (walkId: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('walks')
      .update(updates)
      .eq('id', walkId)
      .select()
      .single()
    return { data, error }
  },

  getUserWalks: async (userId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('walks')
      .select(`
        *,
        moments (
          id,
          description,
          photo_url,
          location,
          timestamp
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  getWalk: async (walkId: string) => {
    const { data, error } = await supabase
      .from('walks')
      .select(`
        *,
        moments (
          id,
          user_id,
          description,
          photo_url,
          location,
          timestamp
        )
      `)
      .eq('id', walkId)
      .single()
    return { data, error }
  },

  deleteWalk: async (walkId: string) => {
    const { error } = await supabase
      .from('walks')
      .delete()
      .eq('id', walkId)
    return { error }
  },

  syncOfflineWalks: async (walks: any[]) => {
    const { data, error } = await supabase
      .from('walks')
      .insert(walks.map(walk => ({ ...walk, synced: true })))
      .select()
    return { data, error }
  }
}

// Moment helpers
export const momentHelpers = {
  createMoment: async (momentData: {
    user_id: string
    walk_id?: string
    description?: string
    photo_url?: string
    location?: { lat: number; lng: number }
    timestamp?: string
  }) => {
    const { data, error } = await supabase
      .from('moments')
      .insert(momentData)
      .select()
      .single()
    return { data, error }
  },

  updateMoment: async (momentId: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('moments')
      .update(updates)
      .eq('id', momentId)
      .select()
      .single()
    return { data, error }
  },

  deleteMoment: async (momentId: string) => {
    const { error } = await supabase
      .from('moments')
      .delete()
      .eq('id', momentId)
    return { error }
  },

  getUserMoments: async (userId: string, limit = 100) => {
    const { data, error } = await supabase
      .from('moments')
      .select(`
        *,
        walks (
          id,
          start_time,
          theme
        )
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  uploadMomentPhoto: async (userId: string, file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('moments')
      .upload(fileName, file)
    
    if (error) return { data: null, error }
    
    const { data: { publicUrl } } = supabase.storage
      .from('moments')
      .getPublicUrl(fileName)
    
    return { data: { path: fileName, publicUrl }, error: null }
  },

  deleteMomentPhoto: async (filePath: string) => {
    const { error } = await supabase.storage
      .from('moments')
      .remove([filePath])
    return { error }
  }
}

// TypeScript types for better type safety
export type User = {
  id: string
  email: string
  username?: string
  trial_start: string
  trial_end: string
  is_premium: boolean
  polar_subscription_id?: string
  created_at: string
  updated_at: string
}

export type Walk = {
  id: string
  user_id: string
  start_time: string
  end_time?: string
  duration?: number
  distance?: number
  route_path?: any[]
  theme?: string
  reflection?: string
  synced: boolean
  created_at: string
  updated_at: string
}

export type Moment = {
  id: string
  user_id: string
  walk_id?: string
  description?: string
  photo_url?: string
  location?: { lat: number; lng: number }
  timestamp: string
  created_at: string
  updated_at: string
} 