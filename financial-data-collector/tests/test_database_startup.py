import pathlib
import sys
import unittest
from unittest.mock import AsyncMock,patch
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from continua_scraper.database import Database
from psycopg import OperationalError

class StartupTests(unittest.IsolatedAsyncioTestCase):
    async def test_quota_failure_stops_before_pool_and_omits_private_provider_details(self):
        with patch('psycopg.AsyncConnection.connect',new_callable=AsyncMock) as connect,patch('psycopg_pool.AsyncConnectionPool') as pool:
            connect.side_effect=OperationalError('secret@provider: Your account or project has exceeded the quota')
            with self.assertRaisesRegex(RuntimeError,'quota unavailable') as error:
                await Database.open('postgresql://fixture:fixture@127.0.0.1/fixture',probe=True)
            self.assertNotIn('secret',str(error.exception))
            connect.assert_awaited_once();pool.assert_not_called()

    async def test_successful_probe_is_closed_and_pool_has_finite_retry_window(self):
        probe=AsyncMock();pool=AsyncMock()
        with patch('psycopg.AsyncConnection.connect',new_callable=AsyncMock,return_value=probe),patch('psycopg_pool.AsyncConnectionPool',return_value=pool) as factory:
            database=await Database.open('postgresql://fixture:fixture@127.0.0.1/fixture',probe=True)
            probe.close.assert_awaited_once();pool.open.assert_awaited_once()
            self.assertEqual(factory.call_args.kwargs['max_size'],2)
            self.assertEqual(factory.call_args.kwargs['reconnect_timeout'],1)
            await database.close();pool.close.assert_awaited_once()
