import {query} from '../../storage/db.js';
import {ApiError} from '../../api/middleware/errorHandler.js';

export const publicationPolicy = {
    async revision() {
        try {
            // One small result, no document payloads. Do not cache this decision:
            // turning off a source must invalidate even a 24-hour last-good bundle.
            const result = await query(`SELECT md5(coalesce(jsonb_agg(
              jsonb_build_array(id,enabled,redistribution_allowed,config->>'permissionReference')
              ORDER BY id)::text,'[]')) AS revision FROM scraping.sources`);
            const revision = result.rows[0]?.revision;
            if (!/^[a-f0-9]{32}$/.test(revision ?? '')) throw new Error('Missing policy revision');
            return revision;
        } catch { throw new ApiError(503, 'Research publication permissions could not be verified'); }
    },
};
