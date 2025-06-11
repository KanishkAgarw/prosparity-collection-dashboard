
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { users } = await req.json()
    console.log('Creating users:', users.length)

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const userData of users) {
      try {
        const { email, password, fullName, role = 'user' } = userData
        console.log(`Creating user: ${email} with role: ${role}`)

        // Create the user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            full_name: fullName
          },
          email_confirm: true
        })

        if (authError) {
          console.error(`Auth error for ${email}:`, authError)
          if (authError.message.includes('User already registered')) {
            // Try to update existing user's role if they already exist
            const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
            if (existingUser.user) {
              console.log(`User ${email} already exists, updating role to ${role}`)
              
              // Update or create role for existing user
              const { error: roleError } = await supabaseAdmin
                .from('user_roles')
                .upsert({
                  user_id: existingUser.user.id,
                  role: role
                })

              if (roleError) {
                console.error(`Role update error for ${email}:`, roleError)
                results.errors.push(`${email}: Failed to update role - ${roleError.message}`)
                results.failed++
              } else {
                console.log(`Successfully updated role for existing user: ${email}`)
                results.successful++
              }
            } else {
              results.errors.push(`${email}: User exists but couldn't be found`)
              results.failed++
            }
          } else {
            results.errors.push(`${email}: ${authError.message}`)
            results.failed++
          }
          continue
        }

        if (authData.user) {
          console.log(`User created successfully: ${email}`)
          
          // Assign role to the new user
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: authData.user.id,
              role: role
            })

          if (roleError) {
            console.error(`Role assignment error for ${email}:`, roleError)
            results.errors.push(`${email}: User created but role assignment failed - ${roleError.message}`)
            results.failed++
          } else {
            console.log(`Role ${role} assigned successfully to ${email}`)
            results.successful++
          }
        }
      } catch (error) {
        console.error(`Unexpected error for user ${userData.email}:`, error)
        results.errors.push(`${userData.email}: Unexpected error - ${error.message}`)
        results.failed++
      }
    }

    console.log('Bulk user creation completed:', results)

    return new Response(
      JSON.stringify(results),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        successful: 0,
        failed: 0,
        errors: [error.message]
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
