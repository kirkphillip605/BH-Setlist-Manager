import { Router } from 'express';
import { supabase } from '../index';

const router = Router();

// Get all set templates
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('set_templates')
    .select('*')
    .order('name', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a single set template by ID with its songs
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('set_templates')
    .select(`
      *,
      template_songs (
        position,
        songs (
          id,
          original_artist,
          title,
          key_signature
        )
      )
    `)
    .eq('id', id)
    .order('position', { foreignTable: 'template_songs', ascending: true })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Set template not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Create a new set template
router.post('/', async (req, res) => {
  const { name, songs } = req.body; // songs is an array of { song_id, position }

  if (!name) {
    return res.status(400).json({ error: 'Template name is required.' });
  }

  // Check for duplicate template name
  const { data: existingTemplate, error: existingError } = await supabase
    .from('set_templates')
    .select('id')
    .eq('name', name)
    .single();

  if (existingTemplate) {
    return res.status(409).json({ error: 'A set template with this name already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: existingError.message });
  }

  const { data: newTemplate, error: templateError } = await supabase
    .from('set_templates')
    .insert([{ name }])
    .select()
    .single();

  if (templateError) return res.status(500).json({ error: templateError.message });

  if (songs && songs.length > 0) {
    const templateSongsToInsert = songs.map((s: { song_id: string; position: number }) => ({
      template_id: newTemplate.id,
      song_id: s.song_id,
      position: s.position,
    }));

    const { error: templateSongsError } = await supabase
      .from('template_songs')
      .insert(templateSongsToInsert);

    if (templateSongsError) {
      // If inserting template_songs fails, delete the created template to prevent orphans
      await supabase.from('set_templates').delete().eq('id', newTemplate.id);
      return res.status(500).json({ error: templateSongsError.message });
    }
  }

  res.status(201).json(newTemplate);
});

// Update a set template
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, songs } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Template name is required.' });
  }

  // Check for duplicate template name, excluding the current template
  const { data: existingTemplate, error: existingError } = await supabase
    .from('set_templates')
    .select('id')
    .eq('name', name)
    .neq('id', id)
    .single();

  if (existingTemplate) {
    return res.status(409).json({ error: 'Another set template with this name already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: existingError.message });
  }

  const { data: updatedTemplate, error: templateError } = await supabase
    .from('set_templates')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (templateError) return res.status(500).json({ error: templateError.message });

  // Update associated songs
  if (songs !== undefined) {
    // Delete existing template_songs for this template
    const { error: deleteError } = await supabase
      .from('template_songs')
      .delete()
      .eq('template_id', id);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    if (songs.length > 0) {
      const templateSongsToInsert = songs.map((s: { song_id: string; position: number }) => ({
        template_id: id,
        song_id: s.song_id,
        position: s.position,
      }));

      const { error: insertError } = await supabase
        .from('template_songs')
        .insert(templateSongsToInsert);

      if (insertError) return res.status(500).json({ error: insertError.message });
    }
  }

  res.json(updatedTemplate);
});

// Delete a set template
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('set_templates')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
