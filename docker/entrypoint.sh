#!/bin/sh
set -e

if [ -f /app/prisma/schema.prisma ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy
fi

echo "Starting API server..."
exec node dist/main
