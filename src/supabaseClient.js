import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sozkprejeqvpiibtwvpa.supabase.co' // Found in Supabase Settings > API
const supabaseKey = 'sb_publishable_X7baOAXfooxnbJRXRBZTgg_MxZVw5el' // Found in Supabase Settings > API

export const supabase = createClient(supabaseUrl, supabaseKey)