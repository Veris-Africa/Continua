import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from reconcile_cloud import reconciliation_limits
from unittest.mock import AsyncMock,Mock,patch
from contextlib import asynccontextmanager
from types import SimpleNamespace
import reconcile_cloud


class ReconciliationLimitsTests(unittest.TestCase):
    def test_migration_allowance_is_separate_from_normal_collection(self):
        env={'COLLECTOR_RUN_TRANSFER_BYTES':str(16*1024**2),'COLLECTOR_DAILY_TRANSFER_BYTES':str(192*1024**2)}
        self.assertEqual(reconciliation_limits(env,False),(16*1024**2,192*1024**2,600))
        self.assertEqual(reconciliation_limits(env,True),(384*1024**2,1024**3,600))
        self.assertEqual(env['COLLECTOR_DAILY_TRANSFER_BYTES'],str(192*1024**2))

    def test_migration_cannot_exceed_approved_run_or_daily_ceiling(self):
        for env in ({'CLOUD_MIGRATION_RUN_TRANSFER_BYTES':str(385*1024**2)},
                    {'CLOUD_MIGRATION_DAILY_TRANSFER_BYTES':str(1024**3+1)},
                    {'CLOUD_MIGRATION_DAILY_TRANSFER_BYTES':'1'},
                    {'CLOUD_MIGRATION_RUN_TRANSFER_BYTES':'0'}):
            with self.assertRaises(ValueError):reconciliation_limits(env,True)


class ReconciliationTrafficTests(unittest.IsolatedAsyncioTestCase):
    async def test_305_archive_receipts_refresh_context_once_and_keep_all_checkpoints(self):
        database=SimpleNamespace(query=AsyncMock(return_value=[{'ready':True}]),close=AsyncMock())
        processor=SimpleNamespace(run=AsyncMock(return_value={'processed':0,'failed':0}),
            refresh_company_contexts=AsyncMock(return_value=70),contexts_pending=0,stock_coverage=AsyncMock(return_value=[]))
        pending=305
        async def archive_batch(limit):
            nonlocal pending
            copied=min(limit,pending);pending-=copied
            return {'copied':copied,'failed':0,'superseded':0}
        archive=SimpleNamespace(run=AsyncMock(side_effect=archive_batch),close=AsyncMock())
        exporter=SimpleNamespace(run=AsyncMock(return_value={'copied':0,'failed':0,'superseded':0}))
        storage=SimpleNamespace(r2=object(),materialize=Mock(),close=Mock())
        @asynccontextmanager
        async def slot(*args,**kwargs):yield None
        with patch.dict('os.environ',{'DATABASE_URL':'fixture','R2_DUAL_WRITE':'false'}),\
             patch.object(reconcile_cloud,'validate_environment'),\
             patch.object(reconcile_cloud.Database,'open',AsyncMock(return_value=database)),\
             patch.object(reconcile_cloud.RawStorage,'from_environment',return_value=storage),\
             patch.object(reconcile_cloud,'ResearchProcessor',return_value=processor),\
             patch.object(reconcile_cloud,'ProcessedArchive',return_value=exporter),\
             patch.object(reconcile_cloud,'R2Archive',return_value=archive),\
             patch.object(reconcile_cloud,'scheduled_slot',slot):
            receipt=await reconcile_cloud.reconcile()
        self.assertEqual(receipt['archiveRecords'],305)
        self.assertEqual(pending,0)
        self.assertEqual(processor.run.await_count,62)
        self.assertTrue(all(call.kwargs=={'refresh_contexts':False} for call in processor.run.await_args_list))
        processor.refresh_company_contexts.assert_awaited_once()
        self.assertEqual(receipt['companyContextRefreshes'],1)
        self.assertEqual(receipt['status'],'completed')
        self.assertFalse(any('CREATE ' in call.args[0] for call in database.query.await_args_list))
        self.assertIn('UPDATE scraping.scheduled_runs',database.query.await_args_list[-1].args[0])
        database.close.assert_awaited_once()
