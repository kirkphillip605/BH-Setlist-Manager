import { supabase } from '../supabaseClient';
import { apiService } from './apiService';

export const setlistsService = {
  // Get all setlists for the current user
  async getAllSetlists() {
    return apiService.executeQuery(() => {
      return supabase
        .from('setlists')
        .select('*')
        .order('name', { ascending: true });
    });
  },

  // Get a single setlist by ID with its sets
  async getSetlistById(id) {
    if (!id) {
      throw new Error('Setlist ID is required.');
    }
    
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
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Setlist not found');
    }
    
    return data;
  },

  // Create a new setlist
  async createSetlist(setlistData) {
    const { name, user_id, is_public = false } = setlistData;

    if (!name || !user_id) {
      throw new Error('Setlist name and user_id are required.');
    }

    // Check for duplicate setlist name for this user
    const { data: existingSetlist, error: existingError } = await supabase
      .from('setlists')
      .select('id')
      .eq('name', name)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    if (existingSetlist) {
      throw new Error('A setlist with this name already exists.');
    }

    const { data: newSetlist, error: setlistError } = await supabase
      .from('setlists')
      .insert([{ name, user_id, is_public }])
      .select()
      .single();

    if (setlistError) throw new Error(setlistError.message);

    return newSetlist;
  },

  // Update a setlist
  async updateSetlist(id, setlistData) {
    const { name, is_public } = setlistData;

    if (!name) {
      throw new Error('Setlist name is required.');
    }

    if (!id) {
      throw new Error('Setlist ID is required.');
    }

    // Get the setlist to check ownership
    const { data: setlist, error: setlistFetchError } = await supabase
      .from('setlists')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (setlistFetchError) {
      throw new Error(setlistFetchError.message);
    }

    if (!setlist) {
      throw new Error('Setlist not found');
    }

    // Check for duplicate setlist name for this user, excluding the current setlist
    const { data: existingSetlist, error: existingError } = await supabase
      .from('setlists')
      .select('id')
      .eq('name', name)
      .eq('user_id', setlist.user_id)
      .neq('id', id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    if (existingSetlist) {
      throw new Error('Another setlist with this name already exists.');
    }

    const { data: updatedSetlist, error: setlistError } = await supabase
      .from('setlists')
      .update({ name, is_public })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (setlistError) throw new Error(setlistError.message);

    if (!updatedSetlist) {
      throw new Error('Failed to update setlist - setlist may have been deleted.');
    }

    return updatedSetlist;
  },

  // Delete a setlist
  async deleteSetlist(id) {
    if (!id) {
      throw new Error('Setlist ID is required.');
    }

    // Check if setlist exists first
    const { data: existingSetlist, error: checkError } = await supabase
      .from('setlists')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (!existingSetlist) {
      throw new Error('Setlist not found.');
    }

    const { error } = await supabase
      .from('setlists')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // Duplicate an existing setlist
  async duplicateSetlist(sourceSetlistId, newName, userId, isPublic = false) {
    if (!sourceSetlistId || !newName || !userId) {
      throw new Error('Source setlist ID, new setlist name and user_id are required.');
    }

    // Check for duplicate setlist name for this user
    const { data: existingSetlist, error: existingError } = await supabase
      .from('setlists')
      .select('id')
      .eq('name', newName)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    if (existingSetlist) {
      throw new Error('A setlist with this name already exists.');
    }

    // Get the source setlist with all its sets and songs
    const sourceSetlist = await this.getSetlistById(sourceSetlistId);
    
    // Create new setlist
    const { data: newSetlist, error: setlistError } = await supabase
      .from('setlists')
      .insert([{ name: newName, user_id: userId, is_public: isPublic }])
      .select()
      .single();

    if (setlistError) throw new Error(setlistError.message);

    // Duplicate each set
    for (const sourceSet of sourceSetlist.sets || []) {
      // Get full set data with songs
      const { data: fullSet, error: setError } = await supabase
        .from('sets')
        .select(`
          *,
          set_songs (
            song_order,
            songs (id)
          )
        `)
        .eq('id', sourceSet.id)
        .maybeSingle();

      if (setError || !fullSet) continue; // Skip this set if error or not found

      // Create new set
      const { data: newSet, error: newSetError } = await supabase
        .from('sets')
        .insert([{
          name: fullSet.name,
          setlist_id: newSetlist.id,
          set_order: fullSet.set_order
        }])
        .select()
        .single();

      if (newSetError || !newSet) continue; // Skip this set if error

      // Add songs to new set
      if (fullSet.set_songs && fullSet.set_songs.length > 0) {
        const setSongsToInsert = fullSet.set_songs.map((ss) => ({
          set_id: newSet.id,
          song_id: ss.songs.id,
          song_order: ss.song_order,
        }));

        const { error: setSongsError } = await supabase
          .from('set_songs')
          .insert(setSongsToInsert);

        if (setSongsError) {
          console.error('Error inserting set songs:', setSongsError);
        }
      }
    }

    return newSetlist;
  }
};