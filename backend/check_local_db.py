import sqlite3

conn = sqlite3.connect("landstack.db")
c = conn.cursor()
tables = [row[0] for row in c.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
print("Tables in landstack.db:", tables)
for tbl in tables:
    count = c.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
    sample = c.execute(f"SELECT * FROM {tbl} LIMIT 1").fetchone()
    print(f"Table '{tbl}': {count} rows. Sample: {sample}")
