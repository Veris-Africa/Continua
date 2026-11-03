"""Read-only collector status and actual cgroup memory, including child processes."""
import pathlib
from datetime import datetime,timezone

def timestamp():return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')

async def document_recovery_status(database,*,max_attempts=5):
    """One aggregate operator read. No URL/document payloads, resets or polling loop."""
    if type(max_attempts) is not int or not 1<=max_attempts<=10:
        raise ValueError('Invalid scheduled retry ceiling')
    rows=await database.query("""SELECT source_id,status,count(*) AS count,
      max(extract(epoch FROM now()-updated_at)) AS oldest_update_seconds,
      max(extract(epoch FROM now()-created_at)) AS oldest_work_seconds,
      count(*) FILTER(WHERE status='processing' AND lease_until<now()) AS expired_leases,
      count(*) FILTER(WHERE status='failed' AND attempts>=%s) AS scheduled_retry_exhausted,
      count(*) FILTER(WHERE status IN ('pending','failed') AND next_attempt_at<=now() AND attempts<%s) AS due
      FROM scraping.document_jobs WHERE status<>'complete' GROUP BY source_id,status ORDER BY source_id,status""",
      (max_attempts,max_attempts))
    return {'scheduledRetryCeiling':max_attempts,'groups':[
      {'sourceId':r['source_id'],'status':r['status'],'count':int(r['count']),
       'oldestUpdateSeconds':float(r['oldest_update_seconds'] or 0),'oldestWorkSeconds':float(r['oldest_work_seconds'] or 0),
       'expiredLeases':int(r['expired_leases']),'scheduledRetryExhausted':int(r['scheduled_retry_exhausted']),
       'due':int(r['due'])} for r in rows]}

async def health(database):
    try:
        await database.query('SELECT 1 FROM scraping.sources LIMIT 1')
        return {'status':'ok','database':'ok','timestamp':timestamp()}
    except Exception:return {'status':'degraded','database':'unreachable','timestamp':timestamp()}

async def crawl_status(database):
    # Sequential reads fit the two-connection native pool; no six-query burst.
    sources=await database.query('SELECT id,name,enabled FROM scraping.sources ORDER BY id')
    states=await database.query('SELECT source_id,status,count(*) AS count FROM scraping.crawl_state GROUP BY source_id,status ORDER BY source_id,status')
    artifacts=await database.query('SELECT count(*) AS count FROM scraping.raw_artifacts')
    extractions=await database.query('SELECT method,count(*) AS count FROM scraping.extractions GROUP BY method ORDER BY method')
    review=await database.query("SELECT count(*) AS count FROM (SELECT DISTINCT ON(artifact_id) needs_review FROM scraping.extractions ORDER BY artifact_id,extracted_at DESC,id DESC) latest WHERE needs_review=true")
    dead=await database.query('SELECT count(*) AS count FROM scraping.dead_letters')
    count=lambda rows:int(rows[0]['count']) if rows else 0
    return {'sources':sources,'crawlStateBySourceAndStatus':[{'sourceId':r['source_id'],'status':r['status'],'count':int(r['count'])} for r in states],
        'totalRawArtifacts':count(artifacts),'extractionsByMethod':[{'method':r['method'],'count':int(r['count'])} for r in extractions],'needsReviewCount':count(review),'deadLetterCount':count(dead)}

def memory_snapshot():
    def read(*paths):
        for path in paths:
            try:
                n=int(pathlib.Path(path).read_text().strip())
                if n>=0:return n
            except (OSError,ValueError):pass
        return None
    current=read('/sys/fs/cgroup/memory.current','/sys/fs/cgroup/memory/memory.usage_in_bytes')
    limit=read('/sys/fs/cgroup/memory.max','/sys/fs/cgroup/memory/memory.limit_in_bytes')
    return {'containerBytes':current,'containerLimitBytes':limit,'containerUtilization':current/limit if current is not None and limit is not None and limit>0 else None}
