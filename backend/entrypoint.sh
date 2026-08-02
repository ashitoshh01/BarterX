#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Daphne ASGI server..."
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
