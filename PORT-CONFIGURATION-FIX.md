# Port Configuration Fix

## Issue

The Cars page (and potentially other pages) were not working because of port conflicts between the backend API server and multiple Vite dev servers.

## Root Cause

1. **Multiple Vite Instances**: Several Vite dev servers were running on ports 3000, 3001, and 3002
2. **Backend Port Conflict**: The backend API (src/api/server.js) was configured for port 3002, which conflicted with a Vite process
3. **Wrong .env Configuration**: The frontend .env file pointed to port 3002, which was serving HTML instead of API responses

## Solution Applied

### 1. Cleaned Up Processes
```bash
# Killed all conflicting Vite processes
kill -9 41386 41431 51302
```

### 2. Restarted Backend on Port 3001
```bash
cd /Users/sydneyjackson/the-hub
PORT=3001 node src/api/server.js
```

**Backend now runs on:** `http://localhost:3001`

### 3. Updated Frontend .env
```env
# Changed from:
VITE_API_URL=http://localhost:3002

# To:
VITE_API_URL=http://localhost:3001
```

### 4. Restarted Frontend Dev Server
```bash
cd the-hub
npm run dev
```

**Frontend now runs on:** `http://localhost:3000`

## Current Configuration

| Service | Port | URL |
|---------|------|-----|
| **Backend API** | 3001 | http://localhost:3001 |
| **Frontend Dev** | 3000 | http://localhost:3000 |

## Verification

### Test Backend Endpoints
```bash
# Cars
curl http://localhost:3001/cars

# Watches
curl http://localhost:3001/watches

# Sneakers
curl http://localhost:3001/sneakers

# Stats
curl http://localhost:3001/stats
```

### Test Cars Page
1. Open browser: http://localhost:3000/cars
2. Should see car listings with data:
   - Porsche 911 GT3 2024
   - Lamborghini Huracan EVO 2023
   - Ferrari 488 GTB 2022
   - McLaren 720S 2023

## How to Prevent This Issue

### 1. Use PM2 for Backend
```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd /Users/sydneyjackson/the-hub
pm2 start src/api/server.js --name the-hub-api --env PORT=3001

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

### 2. Use Different Ports by Default

**Backend (.env in root):**
```env
PORT=3001
```

**Frontend (.env in the-hub/):**
```env
VITE_API_URL=http://localhost:3001
```

### 3. Check for Port Conflicts
```bash
# Before starting, check what's using ports
lsof -i :3000
lsof -i :3001

# Kill any conflicts
kill -9 <PID>
```

### 4. Use npm Scripts

**Add to package.json:**
```json
{
  "scripts": {
    "start:backend": "PORT=3001 node src/api/server.js",
    "start:frontend": "cd the-hub && npm run dev",
    "dev": "concurrently \"npm run start:backend\" \"npm run start:frontend\""
  }
}
```

Then just run:
```bash
npm run dev
```

## Troubleshooting

### Cars Page Still Not Working?

1. **Check Backend is Running:**
```bash
curl http://localhost:3001/cars
```
Should return JSON array of cars.

2. **Check Frontend .env:**
```bash
cat the-hub/.env
```
Should have `VITE_API_URL=http://localhost:3001`

3. **Check Browser Console:**
Open DevTools → Console
Look for errors like:
- `Failed to fetch`
- `CORS error`
- `Network error`

4. **Restart Everything:**
```bash
# Kill all node processes
pkill -f node

# Start backend
cd /Users/sydneyjackson/the-hub
PORT=3001 node src/api/server.js &

# Start frontend (in new terminal)
cd the-hub
npm run dev
```

### Other Pages Not Working?

All category pages use the same API service, so if Cars is fixed, others should work too:
- `/watches` → calls `api.getScraperListings()`
- `/cars` → calls `api.getCars()`
- `/sneakers` → calls `api.getSneakers()`
- `/sports` → calls `api.getScores()`

If any page fails:
1. Check if the API endpoint exists in `src/api/server.js`
2. Verify the method exists in `src/services/api.ts`
3. Check browser console for specific errors

## Files Modified

1. `/Users/sydneyjackson/the-hub/the-hub/.env`
   - Changed `VITE_API_URL` from port 3002 to 3001

## Status

✅ **FIXED** - Cars page now loads successfully with real data from backend API.

**Date:** January 24, 2026
**Time:** ~3:40 PM PST
