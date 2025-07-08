import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, authHelpers, userHelpers, User as UserProfile } from '@/lib/supabase'

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnTrial, setIsOnTrial] = useState(false)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Loading user profile for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', {
          message: error.message || 'Unknown error',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          fullError: error
        });
        
        // If user profile doesn't exist (new user), return null gracefully
        if (error.code === 'PGRST116') {
          console.log('User profile not found - this is normal for new users');
          return null;
        }
        
        // For other errors, still return null but log them
        console.warn('Profile loading failed, but continuing:', error.message || 'Unknown error');
        return null;
      }

      console.log('User profile loaded successfully:', data);
      return data as UserProfile;
    } catch (error: any) {
      console.error('Unexpected error in loadUserProfile:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        fullError: error
      });
      return null;
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      // Don't recursively fetch if we're already loading
      if (loading) return;
      
      const profileData = await loadUserProfile(user.id);
      setProfile(profileData);
      
      // If profile is null (new user), don't keep retrying
      if (!profileData) {
        console.log('Profile not available yet for user:', user.id);
      }
    } catch (error: any) {
      console.error('Error in refreshProfile:', {
        message: error?.message || 'Unknown error',
        fullError: error
      });
    }
  }, [user, loading]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error: any) {
        console.error('Error in getInitialSession:', {
          message: error?.message || 'Unknown error',
          fullError: error
        })
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    refreshProfile()
  }, [user, refreshProfile])

  const loadAndSetUserData = async (userId: string) => {
    try {
      console.log('Loading and setting user data for:', userId);
      
      // Load user profile using direct supabase call for consistency
      const profileData = await loadUserProfile(userId);
      
      if (profileData) {
        console.log('Profile loaded, setting profile data:', profileData);
        setProfile(profileData);

        // Check trial status
        try {
          const { data: trialStatus, error: trialError } = await userHelpers.isUserOnTrial(userId)
          if (!trialError && trialStatus !== null) {
            setIsOnTrial(Boolean(trialStatus))
            console.log('Trial status loaded:', trialStatus);
          } else if (trialError) {
            console.warn('Error checking trial status:', {
              message: trialError?.message || 'Unknown error',
              fullError: trialError
            });
          }
        } catch (error: any) {
          console.warn('Exception checking trial status:', {
            message: error?.message || 'Unknown error',
            fullError: error
          });
        }

        // Check premium access
        try {
          const { data: premiumAccess, error: premiumError } = await userHelpers.userHasPremiumAccess(userId)
          if (!premiumError && premiumAccess !== null) {
            setHasPremiumAccess(Boolean(premiumAccess))
            console.log('Premium access loaded:', premiumAccess);
          } else if (premiumError) {
            console.warn('Error checking premium access:', {
              message: premiumError?.message || 'Unknown error',
              fullError: premiumError
            });
          }
        } catch (error: any) {
          console.warn('Exception checking premium access:', {
            message: error?.message || 'Unknown error',
            fullError: error
          });
        }
      } else {
        console.log('No profile data available for user:', userId);
      }
    } catch (error: any) {
      console.error('Unexpected error loading user data:', {
        message: error?.message || 'Unknown error',
        fullError: error
      })
    }
  }

  const signUp = async (email: string, password: string, username?: string) => {
    return await authHelpers.signUp(email, password, username);
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authHelpers.signIn(email, password)
    return { data, error }
  }

  const signInWithOtp = async (email: string) => {
    const { data, error } = await authHelpers.signInWithOtp(email)
    return { data, error }
  }

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'email' = 'email') => {
    console.log('Verifying OTP for:', email, 'type:', type);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type as any
      });
      
      console.log('OTP verification response:', { data, error });
      
      if (error) {
        console.error('OTP verification error:', {
          message: error.message || 'Unknown error',
          status: (error as any).status || 'No status',
          code: (error as any).code || 'No code',
          fullError: error
        });
        
        // Handle specific error cases
        if (error.message?.includes('Token has expired') || error.message?.includes('invalid')) {
          return { 
            data: null, 
            error: { 
              ...error, 
              message: 'The verification code has expired. Please request a new one.' 
            } 
          };
        }
        
        return { data: null, error };
      }
      
      if (data.user) {
        console.log('OTP verified successfully for user:', data.user.id);
        
        // For new signups, wait a moment for the trigger to create the profile
        if (type === 'signup') {
          console.log('New user signup verified, waiting for profile creation...');
          // Give the database trigger time to create the user profile
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Refresh the user data (profile, trial status, premium access)
          await loadAndSetUserData(data.user.id);
        }
        
        return { data, error: null };
      }
      
      return { data: null, error: new Error('No user data returned') };
    } catch (error: any) {
      console.error('Error in verifyOtp:', {
        message: error?.message || 'Unknown error',
        fullError: error
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    const { error } = await authHelpers.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await authHelpers.resetPassword(email)
    return { data, error }
  }

  const updatePassword = async (password: string) => {
    const { data, error } = await authHelpers.updatePassword(password)
    return { data, error }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { data: null, error: new Error('No user logged in') }
    
    const { data, error } = await userHelpers.updateUserProfile(user.id, updates)
    if (!error && data) {
      setProfile(data as UserProfile)
      // Refresh access status if relevant fields changed
      if ('is_premium' in updates || 'trial_end' in updates) {
        await loadAndSetUserData(user.id)
      }
    }
    return { data, error }
  }

  const refreshUserData = async () => {
    if (user) {
      await loadAndSetUserData(user.id)
    }
  }

  // Helper function to check if trial is expiring soon (within 1 day)
  const isTrialExpiringSoon = () => {
    if (!profile || !isOnTrial) return false
    const trialEnd = new Date(profile.trial_end)
    const oneDayFromNow = new Date()
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)
    return trialEnd <= oneDayFromNow
  }

  // Helper function to get days left in trial
  const getDaysLeftInTrial = () => {
    if (!profile || !isOnTrial) return 0
    const trialEnd = new Date(profile.trial_end)
    const now = new Date()
    const timeDiff = trialEnd.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return Math.max(0, daysDiff)
  }

  return {
    user,
    profile,
    session,
    loading,
    isOnTrial,
    hasPremiumAccess,
    isTrialExpiringSoon: isTrialExpiringSoon(),
    daysLeftInTrial: getDaysLeftInTrial(),
    signUp,
    signIn,
    signInWithOtp,
    verifyOtp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUserData,
  }
} 