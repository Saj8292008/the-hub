-- Fix Row Level Security policies to allow public inserts for testing

-- Car Listings Policies
DROP POLICY IF EXISTS "Public can read car listings" ON car_listings;
CREATE POLICY "Public can read car listings" ON car_listings
  FOR SELECT USING (true);

CREATE POLICY "Public can insert car listings" ON car_listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update car listings" ON car_listings
  FOR UPDATE USING (true);

-- Sneaker Listings Policies
DROP POLICY IF EXISTS "Public can read sneaker listings" ON sneaker_listings;
CREATE POLICY "Public can read sneaker listings" ON sneaker_listings
  FOR SELECT USING (true);

CREATE POLICY "Public can insert sneaker listings" ON sneaker_listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update sneaker listings" ON sneaker_listings
  FOR UPDATE USING (true);

-- Watch Listings Policies (update existing)
DROP POLICY IF EXISTS "Public can read watch listings" ON watch_listings;
CREATE POLICY "Public can read watch listings" ON watch_listings
  FOR SELECT USING (true);

CREATE POLICY "Public can insert watch listings" ON watch_listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update watch listings" ON watch_listings
  FOR UPDATE USING (true);
