"""Small, cancellable native PostgreSQL pool; all values are parameter-bound."""
import asyncio
import contextlib
from .query_volume import QueryVolume

class DatabaseUnavailable(RuntimeError):
    """Sanitized dependency failure safe for operational receipts."""

class DatabaseQuotaUnavailable(DatabaseUnavailable):
    pass

class Database:
    def __init__(self, pool):
        self.pool=pool
        self.volume=QueryVolume()

    @classmethod
    async def open(cls, connection,*,probe=False):
        from .database_tls import secure_connection
        from psycopg.rows import dict_row
        from psycopg import AsyncConnection, OperationalError
        from psycopg_pool import AsyncConnectionPool
        verified=secure_connection(connection)
        options={"autocommit":True,"row_factory":dict_row,"connect_timeout":5,"prepare_threshold":None,
                 "options":"-c statement_timeout=12000 -c lock_timeout=10000"}
        # Pool workers retry failed startup connections in the background. A
        # single explicit probe makes a suspended/quota-limited job fail before
        # entering that loop; no SQL writes or automatic mutation replays.
        if probe:
            try:
                initial=await AsyncConnection.connect(verified,**options)
                await initial.close()
            except OperationalError as error:
                quota=any(word in str(error).lower() for word in ('exceeded the quota','transfer quota','quota exceeded'))
                if quota:raise DatabaseQuotaUnavailable('Database quota unavailable; job stopped without retry') from None
                raise DatabaseUnavailable('Database unavailable; startup stopped without retry') from None
        pool=AsyncConnectionPool(verified,min_size=0,max_size=2,max_waiting=16,
            timeout=10,reconnect_timeout=1,open=False,kwargs=options)
        await pool.open()
        return cls(pool)

    async def query(self, sql, params=()):
        async with asyncio.timeout(15):
            async with self.pool.connection() as connection:
                cursor=await connection.execute(sql,params)
                rows=await cursor.fetchall() if cursor.description is not None else []
                self.observe(sql,rows)
                return rows

    def observe(self,sql,rows):
        try:self.volume.record(sql,rows)
        except Exception:pass  # Metrics cannot alter financial work.

    @contextlib.asynccontextmanager
    async def transaction(self):
        async with asyncio.timeout(30):
            async with self.pool.connection() as connection:
                async with connection.transaction():
                    yield ConnectionQueries(connection,self.observe)

    async def close(self):
        try:await self.pool.close()
        finally:
            import json,sys
            if self.volume.entries:print(json.dumps(self.volume.snapshot(),separators=(',',':')),file=sys.stderr)

class ConnectionQueries:
    def __init__(self,connection,observe=None):
        self.connection=connection
        self.observe=observe

    async def query(self,sql,params=()):
        cursor=await self.connection.execute(sql,params)
        rows=await cursor.fetchall() if cursor.description is not None else []
        if self.observe:self.observe(sql,rows)
        return rows
