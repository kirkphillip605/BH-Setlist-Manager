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
            performance_note,
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

    // Check for duplicates within the setlist (across all sets)
    if (songs && songs.length > 0) {
      const duplicates = await this.checkForDuplicatesInSetlist(setlist_id, songs.map(s => s.song_id));
      if (duplicates.length > 0) {
        throw new Error(JSON.stringify({
          type: 'DUPLICATES_FOUND',
          duplicates: duplicates,
          message: 'Some songs already exist in other sets within this setlist'
        }));
      }
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

    // Check for duplicates within the setlist (across all sets) excluding current set
    if (songs !== undefined && songs.length > 0) {
      const { data: currentSet } = await supabase
        .from('sets')
        .select('setlist_id')
        .eq('id', id)
        .single();

      if (currentSet) {
        const duplicates = await this.checkForDuplicatesInSetlist(
          currentSet.setlist_id, 
          songs.map(s => s.song_id),
          id // Exclude current set from duplicate check
        );
        if (duplicates.length > 0) {
          throw new Error(JSON.stringify({
            type: 'DUPLICATES_FOUND',
            duplicates: duplicates,
            message: 'Some songs already exist in other sets within this setlist'
          }));
        }
      }
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
  },

  // Check for duplicate songs in a setlist (across all sets)
  async checkForDuplicatesInSetlist(setlistId, songIds, excludeSetId = null) {
    let query = supabase
      .from('set_songs')
      .select(`
        song_id,
        sets!inner(id, name, setlist_id),
        songs(title, original_artist)
      `)
      .eq('sets.setlist_id', setlistId)
      .in('song_id', songIds);

    if (excludeSetId) {
      query = query.neq('sets.id', excludeSetId);
    }

    const { data, error } = await query;
    
    if (error) throw new Error(error.message);
    
    return data || [];
  },

  // Move song to another set within the same setlist
  async moveSongToSet(songId, fromSetId, toSetId, newOrder = null) {
    // First verify both sets are in the same setlist
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('setlist_id')
      .in('id', [fromSetId, toSetId]);

    if (setsError) throw new Error(setsError.message);
    
    if (sets.length !== 2 || sets[0].setlist_id !== sets[1].setlist_id) {
      throw new Error('Both sets must be in the same setlist');
    }

    // Remove from original set
    const { error: deleteError } = await supabase
      .from('set_songs')
      .delete()
      .eq('set_id', fromSetId)
      .eq('song_id', songId);

    if (deleteError) throw new Error(deleteError.message);

    // Get next order if not specified
    if (!newOrder) {
      const { data: maxOrder } = await supabase
        .from('set_songs')
        .select('song_order')
        .eq('set_id', toSetId)
        .order('song_order', { ascending: false })
        .limit(1);
      
      newOrder = (maxOrder && maxOrder[0]?.song_order || 0) + 1;
    }

    // Add to new set
    const { error: insertError } = await supabase
      .from('set_songs')
      .insert({
        set_id: toSetId,
        song_id: songId,
        song_order: newOrder
      });

    if (insertError) throw new Error(insertError.message);
  },

  // Reorder songs within a set
  async reorderSongs(setId, songOrderMap) {
    const updates = Object.entries(songOrderMap).map(([songId, order]) => ({
      set_id: setId,
      song_id: songId,
      song_order: order
    }));

    // Delete existing order
    const { error: deleteError } = await supabase
      .from('set_songs')
      .delete()
      .eq('set_id', setId);

    if (deleteError) throw new Error(deleteError.message);

    // Insert with new order
    const { error: insertError } = await supabase
      .from('set_songs')
      .insert(updates);

    if (insertError) throw new Error(insertError.message);
  },

  // Remove song from set
  async removeSongFromSet(setId, songId) {
    const { error } = await supabase
      .from('set_songs')
      .delete()
      .eq('set_id', setId)
      .eq('song_id', songId);
    if (error) throw new Error(error.message);
  }
};