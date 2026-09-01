from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=5,
    # Neon's serverless compute can auto-suspend/drop idle connections well
    # under 30 minutes — a pool_recycle that long was handing out connections
    # Neon had already killed server-side, surfacing as
    # asyncpg.ConnectionDoesNotExistError mid-request (seen crashing the CSV
    # import commit endpoint). 5 minutes keeps recycled connections comfortably
    # inside Neon's actual suspend window.
    pool_recycle=300,
)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
