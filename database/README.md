# Database Setup Instructions

## Blog Platform + AI Features Schema

### Prerequisites
- Supabase project created
- Supabase credentials in your `.env` file:
  ```
  SUPABASE_URL=your-project-url
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  OPENAI_API_KEY=your-openai-key
  ```

### Setup Steps

1. **Open Supabase SQL Editor**
   - Go to https://app.supabase.com
   - Select your project
   - Click "SQL Editor" in the left sidebar

2. **Run the Schema**
   - Copy the contents of `blog_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd+Enter

3. **Verify Installation**
   - The script includes verification queries at the end
   - You should see:
     - 5 new tables starting with `blog_`
     - 5 categories in `blog_categories`
     - Multiple indexes created
     - New `deal_score` column in `watch_listings`

### Tables Created

1. **blog_posts** - Main blog content
2. **blog_post_views** - Analytics tracking
3. **blog_subscribers** - Email newsletter
4. **blog_post_relations** - Related posts
5. **blog_categories** - Category metadata

### Security

The schema includes Row Level Security (RLS) policies:
- Public users can READ published posts
- Authenticated users can MANAGE posts (admin)
- Anyone can subscribe to newsletter
- View tracking is public

### Storage Bucket

A storage bucket `blog-images` will be created for:
- Hero images
- Thumbnail images
- Post content images

**Upload limits**: 10MB per image
**Allowed formats**: JPEG, PNG, WebP, GIF

### Next Steps

After running the schema:

1. **Create an admin account**:
   ```javascript
   // In Supabase Auth dashboard, create a new user
   Email: your-admin@email.com
   Password: secure-password
   ```

2. **Test the setup**:
   ```bash
   npm start
   # Server should start without database errors
   ```

3. **Verify tables**:
   - Go to Supabase Table Editor
   - Confirm all blog tables appear
   - Check that categories are populated

### Troubleshooting

**Error: "relation already exists"**
- Tables already created, safe to ignore
- Or drop existing tables first (careful!)

**Error: "permission denied"**
- Ensure you're using Service Role Key
- Check RLS policies are enabled

**Error: "storage bucket already exists"**
- Bucket already created, safe to ignore
- Or use a different bucket name

### Rollback (if needed)

To remove all blog tables:
```sql
DROP TABLE IF EXISTS blog_post_relations CASCADE;
DROP TABLE IF EXISTS blog_post_views CASCADE;
DROP TABLE IF EXISTS blog_subscribers CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;

-- Remove storage bucket
DELETE FROM storage.buckets WHERE id = 'blog-images';

-- Remove deal scoring columns
ALTER TABLE watch_listings DROP COLUMN IF EXISTS deal_score;
ALTER TABLE watch_listings DROP COLUMN IF EXISTS score_breakdown;
```
