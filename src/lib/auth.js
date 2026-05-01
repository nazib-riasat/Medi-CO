import { supabase } from './supabaseClient'

// SIGN UP
export async function signUp({ fullName, email, password, phone, dob, nid }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })
  if (error) return { error }

  // Save extra fields to manager table
  const { error: dbError } = await supabase
    .from('manager')
    .update({ phone, dob, nid })
    .eq('auth_id', data.user.id)

  return { data, error: dbError }
}

// SIGN IN
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

// SIGN OUT
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// GET CURRENT SESSION
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}