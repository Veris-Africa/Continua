"""Offline failure-path regression: no publisher, database or storage calls."""
import asyncio
import importlib.util
import os
import pathlib
import sys
import unittest
from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

root=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root))
spec=importlib.util.spec_from_file_location('scheduled_budget_fixture',root/'scheduled_collect.py')
scheduled=importlib.util.module_from_spec(spec);spec.loader.exec_module(scheduled)
from continua_scraper import transfer_budget
from continua_scraper.browser import BrowserRenderer,PublisherRenderError
from continua_scraper.process import NativeWorkerError

class BudgetRecovery(unittest.IsolatedAsyncioTestCase):
    async def test_browser_timeout_is_not_hidden_unless_shared_budget_is_exhausted(self):
        @asynccontextmanager
        async def proxy(*args):yield SimpleNamespace(port=1234)
        renderer=BrowserRenderer(None,SimpleNamespace(policy=SimpleNamespace(allowed_domains=('fixture.invalid',),user_agent='fixture')),chromium='fixture',driver='fixture')
        for exhausted in (False,True):
            budget=transfer_budget.TransferBudget(1)
            if exhausted:
                with self.assertRaises(transfer_budget.TransferLimitReached):budget.consume('downloadBytes',2)
            with patch.object(transfer_budget,'active',budget),patch('continua_scraper.browser.BrowserProxy',proxy),patch('continua_scraper.browser.run_process',AsyncMock(side_effect=NativeWorkerError(16))):
                with self.assertRaises(transfer_budget.TransferLimitReached if exhausted else PublisherRenderError):
                    await renderer._render('https://fixture.invalid/',{})

    async def test_archive_budget_pause_preserves_completed_processing_and_real_source_failures(self):
        for source_failed in (False,True):
            db=SimpleNamespace(query=AsyncMock(return_value=[{'ready':True}]),close=AsyncMock())
            @asynccontextmanager
            async def slot(*args,**kwargs):yield None
            async def collect(*args,**kwargs):return {'failed':int(source_failed),'fetched':1}
            runtime=SimpleNamespace(jobs=SimpleNamespace(max_attempts=0),sources=SimpleNamespace(enabled=AsyncMock(return_value=[{'id':'fixture','adapter':'rss'}])),registry=SimpleNamespace(build=AsyncMock(return_value=SimpleNamespace())),runner=SimpleNamespace(run=collect),close=AsyncMock())
            processor=SimpleNamespace(run=AsyncMock(return_value={'processed':2,'observations':2,'failed':0}),available_financials=AsyncMock(return_value=[]))
            storage=SimpleNamespace(r2=object())
            with patch.dict(os.environ,{'DATABASE_URL':'fixture','COLLECTOR_PROCESS_RESEARCH':'true','PROCESSED_PAYLOAD_MODE':'r2','R2_DUAL_WRITE':'false'},clear=True),patch.object(scheduled,'validate_environment'),patch.object(scheduled.Database,'open',AsyncMock(return_value=db)),patch.object(scheduled,'scheduled_slot',slot),patch.object(scheduled.RawStorage,'from_environment',return_value=storage),patch.object(scheduled,'CollectorRuntime',return_value=runtime),patch('continua_scraper.research_processing.ResearchProcessor',return_value=processor),patch('continua_scraper.research_processing.reparse_archived_views',AsyncMock(return_value={})),patch('continua_scraper.processed_archive.ProcessedArchive') as archive:
                archive.return_value.run=AsyncMock(side_effect=transfer_budget.TransferLimitReached('fixture'))
                receipt=await scheduled.run('news')
            self.assertEqual(receipt['status'],'failed' if source_failed else 'budget-paused')
            self.assertEqual(receipt['processingAfter']['observations'],2)
            self.assertEqual(receipt['processedCloudExport']['status'],'budget-paused')
            self.assertIsNone(transfer_budget.active)
            self.assertTrue(runtime.close.await_count)
            self.assertTrue(any('receipt=' in args.args[0] for args in db.query.await_args_list))
