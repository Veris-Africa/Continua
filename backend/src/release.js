// Bump for a reviewed configuration contract, never hash secret environment values.
export const releaseContract = Object.freeze({configurationVersion: 'phase1-v1', schemaContract: 'existing-additive-20261102'});
export function releaseInfo() {
    return {...releaseContract, revision: /^[a-f0-9]{40}$/i.test(process.env.RENDER_GIT_COMMIT ?? '') ? process.env.RENDER_GIT_COMMIT : null};
}
