import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from continua_scraper.query_volume import QueryVolume

class VolumeTests(unittest.TestCase):
    def test_retains_only_aggregate_sizes_and_hashes(self):
        metrics=QueryVolume()
        metrics.record('SELECT private_email',[{'email':'secret@example.test','price':'123.456'}])
        result=metrics.snapshot()
        self.assertEqual(result['queries'][0]['calls'],1)
        self.assertEqual(result['queries'][0]['rows'],1)
        self.assertGreater(result['queries'][0]['estimatedResultValueBytes'],0)
        self.assertNotIn('secret',str(result));self.assertNotIn('private_email',str(result))
    def test_recursion_and_cardinality_are_bounded(self):
        metrics=QueryVolume()
        for index in range(200):metrics.record('SELECT '+str(index),[])
        cyclic={};cyclic['self']=cyclic
        metrics.record('SELECT cycle',[cyclic])
        self.assertLessEqual(len(metrics.entries),129)
        self.assertGreater(metrics.entries['overflow']['sampleTruncations'],0)
