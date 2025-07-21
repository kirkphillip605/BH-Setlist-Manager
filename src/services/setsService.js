import { supabase } from '../supabaseClient';

export const setsService = {
  // Get all sets for a specific setlist
  async getSetsBySetlistId(setlistId) {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('setlist_id', setlistId)
      .order('set_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get a single set by ID with its songs
  async getSetById(id) {
    const { data, error } = await supabase
      .from('sets')
      .select(`
        *,
        setlists (name),
        set_songs (
          song_order,
          songs (
            id,
            original_artist,
            title,
            key_signature,
            lyrics
          )
        )
      `)
      .eq('id', id)
      .order('song_order', { foreignTable: 'set_songs', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Set not found');
      }
      throw new Error(error.message);
    }
    return data;
  },

  // Create a new set
  async createSet(setData) {
    const { name, setlist_id, songs } = setData;

    if (!name || !setlist_id) {
      throw new Error('Set name and setlist_id are required.');
    }

    // Get the current highest set_order for this setlist
    const { data: existingSets, error: orderError } = await supabase
      .from('sets')
      .select('set_order')
      .eq('setlist_id', setlist_id)
      .order('set_order', { ascending: false })
      .limit(1);

    if (orderError) throw new Error(orderError.message);

    const nextOrder = existingSets && existingSets.length > 0 ? existingSets[0].set_order + 1 : 1;

    const { data: newSet, error: setError } = await supabase
      .from('sets')
      .insert([{ name, setlist_id, set_order: nextOrder }])
      .select()
      .single();

    if (setError) throw new Error(setError.message);

    if (songs && songs.length > 0) {
      const setSongsToInsert = songs.map((s) => ({
        set_id: newSet.id,
        song_id: s.song_id,
        song_order: s.song_order,
      }));

      const { error: setSongsError } = await supabase
        .from('set_songs')
        .insert(setSongsToInsert);

      if (setSongsError) {
        await supabase.from('sets').delete().eq('id', newSet.id);
        throw new Error(setSongsError.message);
      }
    }

    return newSet;
  },

  // Update a set
  async updateSet(id, setData) {
    const { name, songs } = setData;

    if (!name) {
      throw new Error('Set name is required.');
    }

    const { data: updatedSet, error: setError } = await supabase
      .from('sets')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (setError) throw new Error(setError.message);

    // Update associated songs
    if (songs !== undefined) {
      // Delete existing set_songs for this set
      const { error: deleteError } = await supabase
        .from('set_songs')
        .delete()
        .eq('set_id', id);

      if (deleteError) throw new Error(deleteError.message);

      if (songs.length > 0) {
        const setSongsToInsert = songs.map((s) => ({
          set_id: id,
          song_id: s.song_id,
          song_order: s.song_order,
        }));

        const { error: insertError } = await supabase
          .from('set_songs')
          .insert(setSongsToInsert);

        if (insertError) throw new Error(insertError.message);
      }
    }

    return updatedSet;
  },

  // Delete a set
  async deleteSet(id) {
    const { error } = await supabase
      .from('sets')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};