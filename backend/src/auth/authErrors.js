export class AuthenticationError extends Error {
 constructor(status,code,message){super(message);this.status=status;this.code=code;}
}
export const invalidSession=()=>new AuthenticationError(401,'AUTH_INVALID','Invalid or revoked user session. Sign in again.');
export const unavailableAuth=()=>new AuthenticationError(503,'AUTH_UNAVAILABLE','Account verification is temporarily unavailable. Please retry shortly.');
export const recentAuthentication=()=>new AuthenticationError(403,'AUTH_RECENT_REQUIRED','Recent authentication is required.');
const invalidJwtCodes=new Set(['ERR_JWT_EXPIRED','ERR_JWT_CLAIM_VALIDATION_FAILED','ERR_JWT_INVALID','ERR_JWS_INVALID','ERR_JWS_SIGNATURE_VERIFICATION_FAILED','ERR_JOSE_ALG_NOT_ALLOWED','ERR_JWKS_NO_MATCHING_KEY']);
export function authenticationFailure(error){
 if(error instanceof AuthenticationError)return error;
 if(error?.status===401||error?.statusCode===401||error?.status==='UNAUTHORIZED'||error?.code==='PASSWORD_CHANGED'||invalidJwtCodes.has(error?.code))return invalidSession();
 if(error?.status===403)return new AuthenticationError(403,'AUTH_FORBIDDEN','Additional account verification is required.');
 // Unknown verifier/transport/SQL errors are unavailability, never proof of revocation.
 return unavailableAuth();
}
export function sendAuthenticationFailure(res,error){
 const failure=authenticationFailure(error);res.set('Cache-Control','private, no-store');
 if(failure.status===503)res.set('Retry-After','5');
 return res.status(failure.status).json({error:failure.message,message:failure.message,code:failure.code});
}
