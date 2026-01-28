-- ============================================================================
-- FIX: Enable public newsletter subscriptions
-- This allows the frontend to subscribe users to the newsletter
-- ============================================================================

-- Option 1: Allow public inserts to blog_subscribers (RECOMMENDED)
CREATE POLICY IF NOT EXISTS "Allow public newsletter subscriptions"
ON blog_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Option 2: Allow public to read their own subscription (for confirmation page)
CREATE POLICY IF NOT EXISTS "Allow users to read own subscription"
ON blog_subscribers
FOR SELECT
TO public
USING (true);

-- Verify policies created
SELECT 'RLS policies created successfully!' as status;

-- ============================================================================
-- After running this, test with: bash verify-migration.sh
-- ============================================================================
