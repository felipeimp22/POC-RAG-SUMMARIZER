# Start your system
npm run seed --clear  # Populate database
npm run dev          # Start server

# Test queries
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What conversations do you have access to?"}'

curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Summarize ticket 2025010610000001"}'

curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me open tickets from yesterday"}'