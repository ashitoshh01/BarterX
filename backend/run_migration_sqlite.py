import os
import sqlite3
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
print(f"Connecting to database at {db_path}...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Dropping views...")
cursor.execute("DROP VIEW IF EXISTS v_user_dashboard_stats;")
cursor.execute("DROP VIEW IF EXISTS v_trending_items;")
cursor.execute("DROP VIEW IF EXISTS v_user_verification;")
conn.commit()

print("Cleaning up orphan barteritemimage records...")
cursor.execute("DELETE FROM api_barteritemimage WHERE item_id NOT IN (SELECT id FROM api_barteritem);")
conn.commit()

print("Running django makemigrations...")
from django.core.management import call_command
call_command('makemigrations')

print("Running django migrate...")
call_command('migrate')

print("Recreating views...")
sql_file_path = os.path.join(os.path.dirname(__file__), 'migrations', '0001_dashboard_views.sql')
with open(sql_file_path, 'r', encoding='utf-8') as f:
    sql_script = f.read()

cursor.executescript(sql_script)
conn.commit()
conn.close()

print("Migration completed and views restored!")
