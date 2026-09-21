# 05_02 Database Backup & Recovery

**Scope**: Defines the backup and restore procedure for the NutriVision AI PostgreSQL database. Required by the university rubric (Section 8).

**Database**: PostgreSQL (local or Supabase cloud).  
**Tools**: `pg_dump` and `pg_restore` (native PostgreSQL tools).

---

## Backup Procedure

### Full Database Backup (Custom Format)
The custom format (`-Fc`) produces a compressed binary dump that supports selective restore and is smaller than plain SQL.

```bash
pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --format=custom \
  --file=nutrivision_backup_$(date +%Y%m%d_%H%M%S).dump
```

All environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`) must be sourced from the `.env` file. Never hardcode credentials.

### Schema-Only Backup
Use this to backup the structure without data (useful for version control of schema changes):

```bash
pg_dump \
  --host=$DB_HOST \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --schema-only \
  --file=nutrivision_schema_$(date +%Y%m%d).sql
```

---

## Restore Procedure

### Full Restore from Custom Dump
```bash
pg_restore \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --clean \
  --if-exists \
  nutrivision_backup_YYYYMMDD_HHMMSS.dump
```

`--clean --if-exists` drops all existing objects before recreating them, ensuring a clean restore without conflicts.

### Restore to a New Database
```bash
createdb --host=$DB_HOST --username=$DB_USER nutrivision_restored

pg_restore \
  --host=$DB_HOST \
  --username=$DB_USER \
  --dbname=nutrivision_restored \
  nutrivision_backup_YYYYMMDD_HHMMSS.dump
```

---

## Backup Storage
- Backup files are stored in the `backups/` directory at the repository root.
- `backups/` is listed in `.gitignore` — dump files must never be committed to GitHub.
- For submission purposes, one sample `.dump` file is to be placed in a shared Google Drive link referenced in the project README.
