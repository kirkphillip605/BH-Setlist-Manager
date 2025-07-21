import { Router } from 'express';
import { supabase } from '../index';

const router = Router();

// Helper function to flatten songs from a template into setlist_songs
async function flattenTemplateSongs(setlistId: string, templateId: string) {
  const { data: templateSongs, error: templateSongsError } = await supabase
    .from('template_songs')
    .select('song_id')
    .eq('template_id', templateId);

  if (templateSongsError) throw templateSongsError;

  if (templateSongs && templateSongs.length > 0) {
    const setlistSongsToInsert = templateSongs.map(ts => ({
      setlist_id: setlistId,
      song_id: ts.song_id,
    }));

    const { error: insertError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongsToInsert)
      .select(); // Select to get potential errors from unique constraint

    if (insertError) {
      // Check if the error is due to duplicate key (song already in setlist)
      if (insertError.code === '23505') { // PostgreSQL unique violation error code
        throw new Error('One or more songs from this template are already in the setlist.');
      }
      throw insertError;
    }
  }
}

// Helper function to remove songs from setlist_songs that belong to a specific template
async function removeFlattenedTemplateSongs(setlistId: string, templateId: string) {
  const { data: templateSongs, error: templateSongsError } = await supabase
    .from('template_songs')
    .select('song_id')
    .eq('template_id', templateId);

  if (templateSongsError) throw templateSongsError;

  if (templateSongs && templateSongs.length > 0) {
    const songIdsToRemove = templateSongs.map(ts => ts.song_id);
    const { error: deleteError } = await supabase
      .from('setlist_songs')
      .delete()
      .eq('setlist_id', setlistId)
      .in('song_id', songIdsToRemove);

    if (deleteError) throw deleteError;
  }
}

// Get all setlists
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('setlists')
    .select('*')
    .order('name', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a single setlist by ID with its templates and flattened songs
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('setlists')
    .select(`
      *,
      setlist_sets (
        position,
        set_templates (
          id,
          name,
          template_songs (
            position,
            songs (
              id,
              original_artist,
              title,
              key_signature,
              lyrics
            )
          )
        )
      ),
      setlist_songs (
        song_id
      )
    `)
    .eq('id', id)
    .order('position', { foreignTable: 'setlist_sets', ascending: true })
    .order('position', { foreignTable: 'setlist_sets.set_templates.template_songs', ascending: true })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Create a new setlist
router.post('/', async (req, res) => {
  const { name, templates } = req.body; // templates is an array of { template_id, position }

  if (!name) {
    return res.status(400).json({ error: 'Setlist name is required.' });
  }

  // Check for duplicate setlist name
  const { data: existingSetlist, error: existingError } = await supabase
    .from('setlists')
    .select('id')
    .eq('name', name)
    .single();

  if (existingSetlist) {
    return res.status(409).json({ error: 'A setlist with this name already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: existingError.message });
  }

  const { data: newSetlist, error: setlistError } = await supabase
    .from('setlists')
    .insert([{ name }])
    .select()
    .single();

  if (setlistError) return res.status(500).json({ error: setlistError.message });

  if (templates && templates.length > 0) {
    const setlistSetsToInsert = templates.map((t: { template_id: string; position: number }) => ({
      setlist_id: newSetlist.id,
      template_id: t.template_id,
      position: t.position,
    }));

    const { error: setlistSetsError } = await supabase
      .from('setlist_sets')
      .insert(setlistSetsToInsert);

    if (setlistSetsError) {
      await supabase.from('setlists').delete().eq('id', newSetlist.id); // Rollback
      return res.status(500).json({ error: setlistSetsError.message });
    }

    // Flatten songs for each template
    for (const template of templates) {
      try {
        await flattenTemplateSongs(newSetlist.id, template.template_id);
      } catch (flattenError: any) {
        await supabase.from('setlist_sets').delete().eq('setlist_id', newSetlist.id); // Rollback
        await supabase.from('setlist_songs').delete().eq('setlist_id', newSetlist.id); // Rollback
        await supabase.from('setlists').delete().eq('id', newSetlist.id); // Rollback
        return res.status(409).json({ error: flattenError.message }); // Specific error for duplicate song
      }
    }
  }

  res.status(201).json(newSetlist);
});

// Update a setlist
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, templates } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Setlist name is required.' });
  }

  // Check for duplicate setlist name, excluding the current setlist
  const { data: existingSetlist, error: existingError } = await supabase
    .from('setlists')
    .select('id')
    .eq('name', name)
    .neq('id', id)
    .single();

  if (existingSetlist) {
    return res.status(409).json({ error: 'Another setlist with this name already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: existingError.message });
  }

  const { data: updatedSetlist, error: setlistError } = await supabase
    .from('setlists')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (setlistError) return res.status(500).json({ error: setlistError.message });

  // Update associated templates and flattened songs
  if (templates !== undefined) {
    // Get current templates in the setlist
    const { data: currentSetlistSets, error: currentSetlistSetsError } = await supabase
      .from('setlist_sets')
      .select('template_id')
      .eq('setlist_id', id);

    if (currentSetlistSetsError) return res.status(500).json({ error: currentSetlistSetsError.message });

    const currentTemplateIds = new Set(currentSetlistSets.map(s => s.template_id));
    const newTemplateIds = new Set(templates.map((t: { template_id: string }) => t.template_id));

    // Templates to remove
    for (const currentTemplateId of currentTemplateIds) {
      if (!newTemplateIds.has(currentTemplateId)) {
        await removeFlattenedTemplateSongs(id, currentTemplateId);
      }
    }

    // Delete existing setlist_sets for this setlist
    const { error: deleteError } = await supabase
      .from('setlist_sets')
      .delete()
      .eq('setlist_id', id);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    if (templates.length > 0) {
      const setlistSetsToInsert = templates.map((t: { template_id: string; position: number }) => ({
        setlist_id: id,
        template_id: t.template_id,
        position: t.position,
      }));

      const { error: insertError } = await supabase
        .from('setlist_sets')
        .insert(setlistSetsToInsert);

      if (insertError) return res.status(500).json({ error: insertError.message });

      // Flatten songs for newly added templates or re-added templates
      for (const template of templates) {
        if (!currentTemplateIds.has(template.template_id)) { // Only flatten if it's a new template for this setlist
          try {
            await flattenTemplateSongs(id, template.template_id);
          } catch (flattenError: any) {
            // If flattening fails, attempt to rollback the setlist_sets and setlist_songs for this setlist
            await supabase.from('setlist_sets').delete().eq('setlist_id', id);
            await supabase.from('setlist_songs').delete().eq('setlist_id', id);
            return res.status(409).json({ error: flattenError.message });
          }
        }
      }
    } else {
      // If no templates are provided, clear all flattened songs for this setlist
      const { error: clearSongsError } = await supabase
        .from('setlist_songs')
        .delete()
        .eq('setlist_id', id);
      if (clearSongsError) return res.status(500).json({ error: clearSongsError.message });
    }
  }

  res.json(updatedSetlist);
});

// Delete a setlist
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('setlists')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
