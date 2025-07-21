import { supabase } from '../supabaseClient';

export const setTemplatesService = {
  // Get all set templates for the current user
  async getAllSetTemplates() {
    const { data, error } = await supabase
      .from('set_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get a single set template by ID with its songs
  async getSetTemplateById(id) {
    const { data, error } = await supabase
      .from('set_templates')
      .select(`
        *,
        set_template_songs (
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
      .order('song_order', { foreignTable: 'set_template_songs', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Set template not found');
      }
      throw new Error(error.message);
    }
    return data;
  },

  // Create a new set template
  async createSetTemplate(templateData) {
    const { name, songs, user_id } = templateData;

    if (!name || !user_id) {
      throw new Error('Template name and user_id are required.');
    }

    // Check for duplicate template name for this user
    const { data: existingTemplate, error: existingError } = await supabase
      .from('set_templates')
      .select('id')
      .eq('name', name)
      .eq('user_id', user_id)
      .single();

    if (existingTemplate) {
      throw new Error('A set template with this name already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data: newTemplate, error: templateError } = await supabase
      .from('set_templates')
      .insert([{ name, user_id }])
      .select()
      .single();

    if (templateError) throw new Error(templateError.message);

    if (songs && songs.length > 0) {
      const templateSongsToInsert = songs.map((s) => ({
        set_template_id: newTemplate.id,
        song_id: s.song_id,
        song_order: s.song_order,
      }));

      const { error: templateSongsError } = await supabase
        .from('set_template_songs')
        .insert(templateSongsToInsert);

      if (templateSongsError) {
        await supabase.from('set_templates').delete().eq('id', newTemplate.id);
        throw new Error(templateSongsError.message);
      }
    }

    return newTemplate;
  },

  // Update a set template
  async updateSetTemplate(id, templateData) {
    const { name, songs } = templateData;

    if (!name) {
      throw new Error('Template name is required.');
    }

    // Get the template to check ownership
    const { data: template, error: templateFetchError } = await supabase
      .from('set_templates')
      .select('user_id')
      .eq('id', id)
      .single();

    if (templateFetchError) {
      throw new Error('Set template not found');
    }

    // Check for duplicate template name for this user, excluding the current template
    const { data: existingTemplate, error: existingError } = await supabase
      .from('set_templates')
      .select('id')
      .eq('name', name)
      .eq('user_id', template.user_id)
      .neq('id', id)
      .single();

    if (existingTemplate) {
      throw new Error('Another set template with this name already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data: updatedTemplate, error: templateError } = await supabase
      .from('set_templates')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (templateError) throw new Error(templateError.message);

    // Update associated songs
    if (songs !== undefined) {
      // Delete existing template_songs for this template
      const { error: deleteError } = await supabase
        .from('set_template_songs')
        .delete()
        .eq('set_template_id', id);

      if (deleteError) throw new Error(deleteError.message);

      if (songs.length > 0) {
        const templateSongsToInsert = songs.map((s) => ({
          set_template_id: id,
          song_id: s.song_id,
          song_order: s.song_order,
        }));

        const { error: insertError } = await supabase
          .from('set_template_songs')
          .insert(templateSongsToInsert);

        if (insertError) throw new Error(insertError.message);
      }
    }

    return updatedTemplate;
  },

  // Delete a set template
  async deleteSetTemplate(id) {
    const { error } = await supabase
      .from('set_templates')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};