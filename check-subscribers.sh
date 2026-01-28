#!/bin/bash
# Check newsletter subscribers in database

echo "📊 Checking Newsletter Subscribers"
echo "===================================="
echo ""

echo "Query: All blog_subscribers..."
curl -s "http://localhost:3001/api/newsletter/subscribers" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        subs = data['data']
        print(f'Total subscribers: {len(subs)}')
        print('')
        for sub in subs:
            print(f'Email: {sub.get(\"email\")}')
            print(f'  Confirmed: {sub.get(\"confirmed\", False)}')
            print(f'  Unsubscribed: {sub.get(\"unsubscribed\", False)}')
            print(f'  Subscribed at: {sub.get(\"subscribed_at\", \"N/A\")}')
            print('')
    else:
        print(json.dumps(data, indent=2))
except:
    print(sys.stdin.read())
"

echo ""
echo "===================================="
