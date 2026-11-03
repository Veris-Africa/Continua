import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from continua_scraper.documents import DocumentJobs
from continua_scraper.diagnostics import document_recovery_status

class Database:
    def __init__(self): self.calls=[]
    async def query(self,sql,params=()): self.calls.append((sql,params));return []

class RecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_recovery_status_is_one_aggregate_query_without_document_data(self):
        class StatusDatabase(Database):
            async def query(self,sql,params=()):
                self.calls.append((sql,params))
                return [{'source_id':'synthetic','status':'failed','count':2,'oldest_update_seconds':10,
                         'oldest_work_seconds':90000,'expired_leases':0,'scheduled_retry_exhausted':1,'due':1}]
        db=StatusDatabase();result=await document_recovery_status(db)
        self.assertEqual(len(db.calls),1)
        self.assertEqual(db.calls[0][1],(5,5))
        self.assertEqual(result['groups'][0]['oldestWorkSeconds'],90000)
        self.assertEqual(result['groups'][0]['scheduledRetryExhausted'],1)
        self.assertNotIn('url',result['groups'][0])
        self.assertNotIn('document',result['groups'][0])

    async def test_invalid_status_limits_do_not_query(self):
        db=Database()
        for value in [0,11,True]:
            with self.assertRaises(ValueError): await document_recovery_status(db,max_attempts=value)
        self.assertEqual(db.calls,[])

    async def test_completion_requires_current_attempt_and_unexpired_processing_lease(self):
        db=Database();jobs=DocumentJobs(db,retry_random=lambda:0.5)
        await jobs.finish(42,3)
        sql,params=db.calls[-1]
        self.assertIn("AND status='processing' AND lease_until>now()",sql)
        self.assertEqual(params,("complete",None,14400.0,42,3))

    async def test_failed_jobs_use_bounded_backoff_without_resetting_attempts_or_evidence(self):
        db=Database();jobs=DocumentJobs(db,max_attempts=5,retry_random=lambda:0.5)
        for attempt,expected in [(1,3600),(2,7200),(5,57600),(10,86400)]:
            await jobs.finish(42,attempt,"synthetic transient failure")
            sql,params=db.calls[-1]
            self.assertEqual(params[2],expected)
            self.assertEqual(params[-2:],(42,attempt))
            self.assertNotIn('DELETE',sql)
            self.assertNotIn('attempts=0',sql)
