import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

function getCorsHeaders(requestOrigin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (requestOrigin) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  return headers;
}

serve(async (req) => {
  const requestOrigin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(requestOrigin) })
  }

  try {
    // Added 'password' to the destructured request body
    const { email, name, role, user_level, password } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
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

    // Verify admin permissions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      console.error('Auth user error:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' } }
      )
    }

    // Log the user ID being checked
    console.log(`Checking admin status for user ID: ${user.id}`);

    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('user_level')
      .eq('id', user.id)
      .single()

    // Log the result of the admin check query
    console.log(`User data from public.users: ${JSON.stringify(userData)}`);
    console.log(`User data error: ${userDataError?.message}`);

    if (userDataError || !userData || userData.user_level !== 3) {
      console.warn(`Admin access denied for user ${user.id}. User level: ${userData?.user_level}`);
      return new Response(
        JSON.stringify({ code: 'not_admin', message: 'Admin access required' }),
        { status: 403, headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' } }
      )
    }

    let authResponse;
    if (password) {
      // Create user with password
      console.log(`Creating user ${email} with password.`);
      authResponse = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || email.split('@')[0],
          role: role || '',
          user_level: user_level || 1,
        },
      });
    } else {
      // Invite user by email
      console.log(`Inviting user ${email}.`);
      authResponse = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            name: name || email.split('@')[0],
            role: role || '',
            user_level: user_level || 1,
          },
          redirectTo: `${req.headers.get('origin')}/auth/invite-complete`
        }
      );
    }

    if (authResponse.error) {
      console.error('Error in auth operation:', authResponse.error.message);
      throw authResponse.error;
    }

    return new Response(
      JSON.stringify({ success: true, data: authResponse.data }),
      { 
        headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Unhandled error in invite user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }
      }
    )
  }
})