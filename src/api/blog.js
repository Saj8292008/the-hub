const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// Get all blog posts with optional filtering
router.get('/posts', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0, search } = req.query;

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Search functionality
    if (search) {
      query = query.textSearch('search_vector', search);
    }

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      posts: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Blog posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single blog post by slug
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Blog post not found' });
      }
      console.error('Error fetching blog post:', error);
      return res.status(500).json({ error: error.message });
    }

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    // Track view in analytics table
    await supabase
      .from('blog_post_views')
      .insert({
        post_id: data.id,
        viewer_ip: req.ip,
        referrer: req.get('referer'),
        user_agent: req.get('user-agent')
      });

    res.json(data);
  } catch (error) {
    console.error('Blog post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get blog categories with post counts
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get post count for each category
    for (let category of data) {
      const { count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('category', category.slug)
        .eq('status', 'published');

      category.post_count = count;
    }

    res.json(data);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get related posts for a specific post
router.get('/posts/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 3;

    // Get the post to find related ones
    const { data: post } = await supabase
      .from('blog_posts')
      .select('category, tags')
      .eq('id', id)
      .single();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Find posts in same category, exclude current post
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, category, published_at, read_time_minutes')
      .eq('category', post.category)
      .eq('status', 'published')
      .neq('id', id)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related posts:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Related posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name, categories } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const { data, error } = await supabase
      .from('blog_subscribers')
      .insert({
        email,
        name: name || null,
        categories: categories || ['watches', 'cars', 'sneakers', 'sports', 'general']
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Duplicate email
        return res.status(400).json({ error: 'Email already subscribed' });
      }
      console.error('Subscribe error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Successfully subscribed!', subscriber: data });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
