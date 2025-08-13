import { supabase } from '../supabaseClient';
import { apiService } from './apiService';

export const songCollectionsService = {
  // Get all song collections for the current user
  async getAllSongCollections() {
    return apiService.executeQuery(() => {
      return supabase
        .from('song_collections')
        .select('*')
        .order('name', { ascending: true });
    });
  },

  // Get a single song collection by ID with its songs
  async getSongCollectionById(id) {
    if (!id) {
      throw new Error('Song collection ID is required.');
    }

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
            key_signature,
            performance_note
          )
        )
      `)
      .eq('id', id)
      .order('song_order', { foreignTable: 'song_collection_songs', ascending: true })
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Song collection not found');
    }

    return data;
  },

  // Create a new song collection
  async createSongCollection(collectionData) {
    const { name, songs, user_id, is_public = false } = collectionData;

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
      .insert([{ name, user_id, is_public }])
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
    const { name, songs, is_public } = collectionData;

    if (!name) {
      throw new Error('Collection name is required.');
    }

    if (!id) {
      throw new Error('Collection ID is required.');
    }

    // Get the collection to check ownership
    const { data: collection, error: collectionFetchError } = await supabase
      .from('song_collections')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (collectionFetchError) {
      throw new Error(collectionFetchError.message);
    }

    if (!collection) {
      throw new Error('Song collection not found');
    }

    // Check for duplicate collection name for this user, excluding the current collection
    const { data: existingCollections, error: existingError } = await supabase
      .from('song_collections')
      .select('id')
      .eq('name', name)
      .eq('user_id', collection.user_id)
      .neq('id', id);

    if (existingError) {
      throw new Error(existingError.message);
    }
    
    if (existingCollections && existingCollections.length > 0) {
      throw new Error('Another song collection with this name already exists.');
    }

    const { data: updatedCollection, error: collectionError } = await supabase
      .from('song_collections')
      .update({ name, is_public })
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