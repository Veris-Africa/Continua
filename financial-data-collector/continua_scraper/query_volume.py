"""Bounded decoded-result estimates, never SQL/parameters/row contents in logs."""
import hashlib

class QueryVolume:
    def __init__(self):self.entries={}
    def record(self,sql,rows):
        key=hashlib.sha256(sql.encode()).hexdigest()[:16]
        if key not in self.entries and len(self.entries)>=128:key='overflow'
        entry=self.entries.setdefault(key,{'fingerprint':key,'calls':0,'rows':0,'estimatedResultValueBytes':0,'sampleTruncations':0})
        entry['calls']+=1;entry['rows']+=len(rows)
        nodes=0;truncated=False
        def size(value,depth=0):
            nonlocal nodes,truncated
            nodes+=1
            if nodes>4096 or depth>12:truncated=True;return 0
            if value is None:return 0
            if isinstance(value,str):return len(value.encode('utf-8'))
            if isinstance(value,(bytes,bytearray,memoryview)):return len(value)
            if isinstance(value,(dict,list,tuple)):
                result=0
                for item in value.values() if isinstance(value,dict) else value:
                    result+=size(item,depth+1)
                    if nodes>4096:break
                return result
            return len(str(value).encode('utf-8'))
        sample=rows[:8]
        amount=sum(size(row) for row in sample)
        entry['estimatedResultValueBytes']+=round(amount*len(rows)/len(sample)) if sample else 0
        entry['sampleTruncations']+=int(truncated)
    def snapshot(self):
        return {'kind':'database-result-volume','unit':'sampled decoded result-value byte estimate; not Neon billed/network transfer',
            'queries':sorted(self.entries.values(),key=lambda entry:entry['estimatedResultValueBytes'],reverse=True)}
