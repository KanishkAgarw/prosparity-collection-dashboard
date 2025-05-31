
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  email: string;
  fullName: string;
  password: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { users }: { users: UserData[] } = await req.json();
    
    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const userData of users) {
      try {
        const { email, fullName, password } = userData;

        // Basic validation
        if (!email || !fullName || !password) {
          results.failed++;
          results.errors.push(`Missing required fields for ${email}`);
          continue;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed++;
          results.errors.push(`Invalid email format: ${email}`);
          continue;
        }

        // Password length validation
        if (password.length < 6) {
          results.failed++;
          results.errors.push(`Password too short for ${email}`);
          continue;
        }

        console.log('Creating user:', email);

        // Create user using admin client with email confirmation enabled
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            full_name: fullName,
          },
          email_confirm: true // Auto-confirm email for bulk uploads
        });

        if (error) {
          console.error('User creation error:', error);
          results.failed++;
          if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
            results.errors.push(`${email}: User already exists`);
          } else {
            results.errors.push(`${email}: ${error.message}`);
          }
        } else {
          console.log('User created successfully:', email);
          results.successful++;
        }
      } catch (error) {
        console.error('Unexpected error creating user:', error);
        results.failed++;
        results.errors.push(`${userData.email || 'Unknown'}: Unexpected error`);
      }
    }

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
