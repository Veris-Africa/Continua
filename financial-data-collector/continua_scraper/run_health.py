"""Redacted run health. Successful execution is not proof of fresh publication."""
import os
import sys
import re
from pathlib import Path


def describe_run(receipt):
    status = receipt.get('status')
    status = status if status in ('completed', 'failed', 'budget-paused', 'overlap-skipped', 'duplicate-skipped') else 'unclassified'
    counts = {name: 0 for name in ('processed', 'observations', 'failed', 'blocked', 'review')}
    for stage in ('processingBefore', 'processingAfter'):
        values = receipt.get(stage) or {}
        if not isinstance(values, dict):
            continue
        for name in counts:
            value = values.get(name)
            if type(value) is int and 0 <= value <= 10**9:
                counts[name] += value
    rows = ['## Financial collection outcome', '', '| Measure | Result |', '|---|---|',
            f'| Execution | {status} |',
            '| Current fundamentals published | Not certified by this execution receipt |']
    rows.extend(f'| Evidence {name} | {value} |' for name, value in counts.items())
    source_failures=0
    for source in (receipt.get('sources') or [])[:20]:
        if not isinstance(source,dict):continue
        value=source.get('failed',0)
        if type(value) is int and 0<=value<=10**9:source_failures+=value
        for category,count in (source.get('errorClasses') or {}).items():
            if not isinstance(category,str) or not re.fullmatch(r'(?:fetch|parse|store|discover): ?(?:[A-Za-z]{1,50}(?::[0-9]{3})?|browser_exit_(?:[0-9]{1,2}|other)|pdf_invalid_header)',category):continue
            if type(count) is int and 0<count<=10**9:
                rows.append(f'| Source error `{category}` | {count} |')
    rows.append(f'| Source failures | {source_failures} |')
    notice = None
    if status == 'budget-paused':
        notice = 'Collection paused within its approved reservation budget. Freshness was not advanced; review the durable allowance and prior incomplete runs before proposing recovery.'
    elif status in ('overlap-skipped', 'duplicate-skipped'):
        notice = 'Collection was skipped by its existing concurrency or idempotency guard. This execution does not establish freshness.'
    elif status == 'failed' or counts['failed'] or source_failures:
        notice = 'Collection or evidence processing failed. Existing published records remain; inspect redacted receipts before recovery.'
    elif status == 'completed' and not counts['observations']:
        notice = 'Execution completed without new processed observations. Verify per-company publication dates separately.'
    if notice:
        rows.extend(['', notice])
    return '\n'.join(rows) + '\n', notice


def write_action_summary(receipt, environ=None, stream=None):
    environ = os.environ if environ is None else environ
    if environ.get('GITHUB_ACTIONS') != 'true':
        return
    summary, notice = describe_run(receipt)
    target = environ.get('GITHUB_STEP_SUMMARY')
    if target:
        # This is the runner-provided summary file, never a source document path.
        try:
            with Path(target).open('a', encoding='utf-8') as output:
                output.write(summary)
        except OSError:
            # Optional presentation cannot turn a durably completed run into failure.
            pass
    if notice:
        print('::warning title=Financial collection freshness::' + notice, file=stream or sys.stdout)
