import { supabase } from '../supabaseClient';

export const setlistsService = {
  // Get all setlists for the current user
  async getAllSetlists() {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get a single setlist by ID with its sets
  async getSetlistById(id) {
    const { data, error } = await supabase
      .from('setlists')
      .select(`
        *,
        sets (
          id,
          name,
          set_order,
          created_at
        )
      `)
      .eq('id', id)
      .order('set_order', { foreignTable: 'sets', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Setlist not found');
      }
      throw new Error(error.message);
    }
    return data;
  },

  // Create a new setlist
  async createSetlist(setlistData) {
    const { name, user_id } = setlistData;

    if (!name || !user_id) {
      throw new Error('Setlist name and user_id are required.');
    }

    // Check for duplicate setlist name for this user
    const { data: existingSetlist, error: existingError } = await supabase
      .from('setlists')
      .select('id')
      .eq('name', name)
      .eq('user_id', user_id)
      .single();

    if (existingSetlist) {
      throw new Error('A setlist with this name already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data: newSetlist, error: setlistError } = await supabase
      .from('setlists')
      .insert([{ name, user_id }])
      .select()
      .single();

    if (setlistError) throw new Error(setlistError.message);


    return newSetlist;
  },

  // Update a setlist
  async updateSetlist(id, setlistData) {
    const { name } = setlistData;

    if (!name) {
      throw new Error('Setlist name is required.');
    }

    // Get the setlist to check ownership
    const { data: setlist, error: setlistFetchError } = await supabase
      .from('setlists')
      .select('user_id')
      .eq('id', id)
      .single();

    if (setlistFetchError) {
      throw new Error('Setlist not found');
    }

    // Check for duplicate setlist name for this user, excluding the current setlist
    const { data: existingSetlist, error: existingError } = await supabase
      .from('setlists')
      .select('id')
      .eq('name', name)
      .eq('user_id', setlist.user_id)
      .neq('id', id)
      .single();

    if (existingSetlist) {
      throw new Error('Another setlist with this name already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data: updatedSetlist, error: setlistError } = await supabase
      .from('setlists')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (setlistError) throw new Error(setlistError.message);


    return updatedSetlist;
  },

  // Delete a setlist
  async deleteSetlist(id) {
    const { error } = await supabase
      .from('setlists')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};