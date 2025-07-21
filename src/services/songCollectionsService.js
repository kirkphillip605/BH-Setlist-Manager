import { supabase } from '../supabaseClient';

export const songCollectionsService = {
  // Get all song collections for the current user
  async getAllSongCollections() {
    const { data, error } = await supabase
      .from('song_collections')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get a single song collection by ID with its songs
  async getSongCollectionById(id) {
    const { data, error } = await supabase
      .from('song_collections')
      .select(`
        *,
        song_collection_songs (
          song_order,
          songs (
            id,
            original_artist,
            title,
            key_signature
          )
        )
      `)
      .eq('id', id)
      .order('song_order', { foreignTable: 'song_collection_songs', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Song collection not found');
      }
      throw new Error(error.message);
    }
    return data;
  },

  // Create a new song collection
  async createSongCollection(collectionData) {
    const { name, songs, user_id } = collectionData;

    if (!name || !user_id) {
      throw new Error('Collection name and user_id are required.');
    }

    // Check for duplicate collection name for this user
    const { data: existingCollection, error: existingError } = await supabase
      .from('song_collections')
      .select('id')
      .eq('name', name)
      .eq('user_id', user_id)
      .single();

    if (existingCollection) {
      throw new Error('A song collection with this name already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data: newCollection, error: collectionError } = await supabase
      .from('song_collections')
      .insert([{ name, user_id }])
      .select()
      .single();

    if (collectionError) throw new Error(collectionError.message);

    if (songs && songs.length > 0) {
      const collectionSongsToInsert = songs.map((s) => ({
        song_collection_id: newCollection.id,
        song_id: s.song_id,
        song_order: s.song_order,
      }));

      const { error: collectionSongsError } = await supabase
        .from('song_collection_songs')
        .insert(collectionSongsToInsert);

      if (collectionSongsError) {
        await supabase.from('song_collections').delete().eq('id', newCollection.id);
        throw new Error(collectionSongsError.message);
      }
    }

    return newCollection;
  },

  // Update a song collection
  async updateSongCollection(id, collectionData) {
    const { name, songs } = collectionData;

    if (!name) {
      throw new Error('Collection name is required.');
    }

    // Get the collection to check ownership
    const { data: collection, error: collectionFetchError } = await supabase
      .from('song_collections')
      .select('user_id')
      .eq('id', id)
      .single();

    if (collectionFetchError) {
      throw new Error('Song collection not found');
    }

    // Check for duplicate collection name for this user, excluding the current collection
    const { data: existingCollection, error: existingError } = await supabase
      .from('song_collections')
      .select('id')
      .eq('name', name)
      .eq('user_id', collection.user_id)
      .neq('id', id)
      .single();

    if (existingCollection) {
      throw new Error('Another song collection with this name already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data: updatedCollection, error: collectionError } = await supabase
      .from('song_collections')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (collectionError) throw new Error(collectionError.message);

    // Update associated songs
    if (songs !== undefined) {
      // Delete existing collection_songs for this collection
      const { error: deleteError } = await supabase
        .from('song_collection_songs')
        .delete()
        .eq('song_collection_id', id);

      if (deleteError) throw new Error(deleteError.message);

      if (songs.length > 0) {
        const collectionSongsToInsert = songs.map((s) => ({
          song_collection_id: id,
          song_id: s.song_id,
          song_order: s.song_order,
        }));

        const { error: insertError } = await supabase
          .from('song_collection_songs')
          .insert(collectionSongsToInsert);

        if (insertError) throw new Error(insertError.message);
      }
    }

    return updatedCollection;
  },

  // Delete a song collection
  async deleteSongCollection(id) {
    const { error } = await supabase
      .from('song_collections')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};