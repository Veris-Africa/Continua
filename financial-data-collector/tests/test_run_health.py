import io
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from continua_scraper.run_health import describe_run, write_action_summary


class RunHealthTests(unittest.TestCase):
    def test_budget_pause_is_explicit_and_never_claims_publication(self):
        summary, warning = describe_run({'status': 'budget-paused', 'pauseReason': 'daily-reservation-limit'})
        self.assertIn('budget-paused', summary)
        self.assertIn('Not certified', summary)
        self.assertIn('Freshness was not advanced', warning)

    def test_completed_empty_and_partial_runs_do_not_hide_failed_processing(self):
        self.assertIn('without new processed observations', describe_run({'status': 'completed'})[1])
        summary, warning = describe_run({'status': 'completed', 'processingBefore': {'failed': 1}, 'processingAfter': {'observations': 5}})
        self.assertIn('| Evidence observations | 5 |', summary)
        self.assertIn('failed', warning)

    def test_summary_never_includes_provider_urls_secrets_or_unknown_status_text(self):
        summary, warning = describe_run({'status': 'private-token\n::error::injection', 'sources': [{'url': 'https://private.invalid/secret'}], 'processingAfter': {'observations': True}})
        self.assertNotIn('private', summary)
        self.assertNotIn('injection', summary)
        self.assertIn('| Evidence observations | 0 |', summary)

    def test_runner_summary_is_optional_and_does_not_change_receipt(self):
        receipt = {'status': 'budget-paused'}
        with tempfile.TemporaryDirectory() as directory:
            target = pathlib.Path(directory) / 'summary.md'
            stream = io.StringIO()
            write_action_summary(receipt, {'GITHUB_ACTIONS': 'true', 'GITHUB_STEP_SUMMARY': str(target)}, stream)
            self.assertIn('budget-paused', target.read_text())
            self.assertIn('::warning', stream.getvalue())
            self.assertEqual(receipt, {'status': 'budget-paused'})
        write_action_summary(receipt, {}, io.StringIO())
