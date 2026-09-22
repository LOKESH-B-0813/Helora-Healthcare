import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get('SQLALCHEMY_DATABASE_URI')
if not DATABASE_URL:
    # default to sqlite for development
    DATABASE_URL = 'sqlite:///./medi_ai.db'

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith('sqlite') else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Import models at module level (after Base is defined) so SQLAlchemy sees them.
# Avoid `from .models import *` inside a function which raises SyntaxError.
from . import models  # noqa: F401

def _migrate_schema(engine):
    """Idempotent development-schema migration for Medi-AI.

    Only touches SQLite; newer production schemas should use real migrations.
    """
    if not (DATABASE_URL.startswith('sqlite') or DATABASE_URL.startswith('sqlite:///')):
        return
    import sqlalchemy as sa
    try:
        with engine.connect() as conn:
            tables = {row[0] for row in conn.execute(sa.text("SELECT name FROM sqlite_master WHERE type='table'"))}
            if 'conversations' not in tables:
                return

            columns = {
                row[1]: row[2] for row in
                conn.execute(sa.text("PRAGMA table_info(conversations)"))
            }
            if 'status' not in columns:
                conn.execute(sa.text("ALTER TABLE conversations ADD COLUMN status VARCHAR(20)"))
                conn.commit()

            user_type = str(columns.get('user_id', '')).upper()
            if 'INT' in user_type:
                # Old schema stored user_id as INTEGER. If empty, rebuild the
                # table with the current model; otherwise keep data (SQLite
                # string affinity still accepts the Appwrite uid).
                count = conn.execute(sa.text("SELECT COUNT(*) FROM conversations")).scalar()
                if count == 0:
                    conn.execute(sa.text("DROP TABLE IF EXISTS messages"))
                    conn.execute(sa.text("DROP TABLE IF EXISTS conversations"))
                    conn.commit()
    except Exception:
        logging.exception('Medi-AI schema migration failed (non-fatal)')

def init_db(app=None):
    """Initialize the existing SQLAlchemy store used by chat services.

    The Flask application argument is accepted for the application-factory
    lifecycle; Appwrite remains the source of truth for healthcare records.
    """
    # Models are imported at module level to register with Base.
    _migrate_schema(engine)
    Base.metadata.create_all(bind=engine)
