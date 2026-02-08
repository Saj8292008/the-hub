# Feature Spec: Real-Time Dashboard Updates
> Priority: P0 | Effort: 3 days | Status: Planned

---

## User Story

> As a collector, I want to see price updates live without refreshing the page, so I can react quickly to market changes.

---

## Problem Statement

Currently, users must manually refresh to see new prices. This creates:
- Missed opportunities (deals sell before user sees them)
- Poor experience (feels "stale")
- Extra server load (unnecessary full page reloads)

---

## Solution Overview

Implement WebSocket connections to push price updates in real-time from server to all connected clients.

---

## Requirements

### Functional
- [ ] WebSocket server using Socket.io
- [ ] Price updates broadcast when scrapers find new data
- [ ] "Live" indicator in dashboard header
- [ ] Visual animation when prices change
  - Green flash for price increase
  - Red flash for price decrease
- [ ] Reconnection logic with exponential backoff
- [ ] Fallback to polling if WebSocket fails
- [ ] "Last updated" timestamp per item

### Non-Functional
- [ ] Updates should arrive within 2 seconds
- [ ] Handle 1000+ concurrent connections
- [ ] Graceful degradation on poor network
- [ ] Mobile-friendly (low battery impact)

---

## UI Design

### Dashboard Header
```
┌─────────────────────────────────────────────────────────────┐
│  📊 My Portfolio                    🟢 Live • Updated 2s ago │
├─────────────────────────────────────────────────────────────┤
```

### Price Card Animation
```
┌────────────────┐
│ Rolex Sub      │
│ $12,450 ▲ 2.1% │  ← Green background flash, fades over 1s
│ [Deal Score 87]│
└────────────────┘
```

### Connection States
```
Connected:    🟢 Live
Reconnecting: 🟡 Reconnecting...
Disconnected: 🔴 Offline (tap to retry)
```

---

## Technical Design

### Backend Changes

**New File: `src/realtime/socketServer.js`**
```javascript
const { Server } = require('socket.io');

let io;

function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join user-specific room for targeted updates
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function emitPriceUpdate(itemId, category, newPrice, oldPrice) {
  if (!io) return;
  
  const change = ((newPrice - oldPrice) / oldPrice) * 100;
  
  io.emit('priceUpdate', {
    itemId,
    category,
    newPrice,
    oldPrice,
    changePercent: change.toFixed(2),
    direction: change >= 0 ? 'up' : 'down',
    timestamp: new Date().toISOString()
  });
}

module.exports = { initSocketServer, emitPriceUpdate };
```

**Modify: `src/api/server.js`**
```javascript
const http = require('http');
const { initSocketServer } = require('../realtime/socketServer');

// After Express app setup
const server = http.createServer(app);
initSocketServer(server);

// Change app.listen to server.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Modify: Scraper service**
```javascript
const { emitPriceUpdate } = require('../realtime/socketServer');

// After successful price update
emitPriceUpdate(item.id, 'watches', newPrice, item.currentPrice);
```

### Frontend Changes

**New Hook: `hooks/useRealTimeUpdates.ts`**
```typescript
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface PriceUpdate {
  itemId: string;
  category: string;
  newPrice: number;
  oldPrice: number;
  changePercent: string;
  direction: 'up' | 'down';
  timestamp: string;
}

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export function useRealTimeUpdates(onUpdate: (update: PriceUpdate) => void) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setStatus('disconnected');
    });

    newSocket.on('priceUpdate', (update: PriceUpdate) => {
      setLastUpdate(new Date());
      onUpdate(update);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [onUpdate]);

  return { status, lastUpdate, socket };
}
```

**Modify: `Dashboard.tsx`**
```typescript
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [flashingItem, setFlashingItem] = useState<string | null>(null);

  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setItems(prev => prev.map(item => 
      item.id === update.itemId 
        ? { ...item, price: update.newPrice, priceChange: update.changePercent }
        : item
    ));
    
    // Trigger flash animation
    setFlashingItem(update.itemId);
    setTimeout(() => setFlashingItem(null), 1000);
  }, []);

  const { status, lastUpdate } = useRealTimeUpdates(handlePriceUpdate);

  return (
    <div>
      <Header>
        <ConnectionIndicator status={status} lastUpdate={lastUpdate} />
      </Header>
      
      {items.map(item => (
        <PriceCard 
          key={item.id} 
          item={item} 
          isFlashing={flashingItem === item.id}
        />
      ))}
    </div>
  );
}
```

---

## Database Changes

None required. Real-time updates are in-memory only.

---

## Testing Plan

### Unit Tests
- [ ] Socket connection establishes successfully
- [ ] Price updates emit to all clients
- [ ] Reconnection logic works after disconnect
- [ ] Flash animation triggers on update

### Integration Tests
- [ ] End-to-end: scraper → socket → frontend update
- [ ] Multiple clients receive same update
- [ ] User-specific updates only go to that user

### Load Tests
- [ ] 1000 concurrent WebSocket connections
- [ ] 100 updates/second broadcast

---

## Rollout Plan

1. **Day 1:** Backend Socket.io setup, basic emit/receive
2. **Day 2:** Frontend hook, connection indicator, basic updates
3. **Day 3:** Flash animations, reconnection logic, polish
4. **Deploy:** Feature flag, roll out to 10% → 50% → 100%

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Update latency | < 2s | Log timestamp diff |
| Connection success | > 99% | Socket.io logs |
| User engagement | +10% time on site | Analytics |
| Page refreshes | -50% | Analytics events |

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Socket connections overload server | Medium | Add connection pooling, rate limiting |
| Mobile battery drain | Low | Throttle updates, use polling on mobile |
| WebSocket blocked by firewall | Low | Fallback to long-polling |

---

## Dependencies

- Socket.io library (`npm install socket.io socket.io-client`)
- HTTP server (modify existing Express setup)

---

## Open Questions

1. Should we send updates only for items user tracks, or all items?
   - **Decision:** Start with all items, optimize later if needed

2. How frequently should we emit updates?
   - **Decision:** Real-time (as scrapers update), max 1 update per item per minute

---

*Spec Author: Feature Builder Agent*
*Created: Feb 5, 2026*
