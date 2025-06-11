// Create task with priority/tags
router.post('/', auth, async (req, res) => {
  try {
    const { title, priority, tags } = req.body;
    const task = new Task({ 
      title, 
      priority: priority || 'Medium',
      tags: tags || [],
      user: req.user.id 
    });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update task (add to existing routes)
router.patch('/:id', auth, async (req, res) => {
  const { priority, tags } = req.body;
  const updates = {};
  if (priority) updates.priority = priority;
  if (tags) updates.tags = tags;
  
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});