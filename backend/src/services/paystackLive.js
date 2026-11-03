import {observeDependency} from '../monitoring/observability.js';
import {hostedIntentReference,hostedRequestHash,checkoutPending} from './hostedCheckoutIntent.js';
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../config/index.js";
import { query } from "../storage/db.js";
import { ApiError } from "../api/middleware/errorHandler.js";
import { CHECKOUT_POLICY_VERSION, prices, validCheckoutUrl } from "./paystackCommon.js";
export const liveReferencePattern = /^continua-live-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function liveCheckoutEnabled() {
    if (!env.PAYSTACK_LIVE_CHECKOUT_ENABLED || !env.PAYSTACK_SECRET_KEY?.startsWith("sk_live_") || !env.PAYSTACK_CALLBACK_URL)
        return false;
    try {
        const u = new URL(env.PAYSTACK_CALLBACK_URL);
        return u.protocol === "https:" && !u.username && !u.password;
    }
    catch {
        return false;
    }
}
function requireEnabled() { if (!liveCheckoutEnabled())
    throw new ApiError(503, "Live checkout is not configured. No payment has been taken."); }
const provider=(...args)=>observeDependency('paystack',()=>callProvider(...args));
async function callProvider(path, body) {
    requireEnabled();
    let response;
    try {
        response = await fetch(`https://api.paystack.co${path}`, {
            method: body ? "POST" : "GET", redirect: "error",
            headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000),
        });
    }
    catch {
        throw new ApiError(502, "Payment provider could not be reached. Please retry verification before paying again.");
    }
    if (!response.ok)
        throw new ApiError(502, "Payment provider could not complete this request.");
    const result = z.object({ status: z.literal(true), data: z.unknown() }).safeParse(await response.json());
    if (!result.success)
        throw new ApiError(502, "Payment provider returned an unexpected response.");
    return result.data.data;
}
const transactionSchema = z.object({
    id: z.number().int().positive().safe(), domain: z.literal("live"), status: z.string(), reference: z.string(),
    amount: z.number().int().nonnegative(), currency: z.literal("KES"), paid_at: z.string().datetime({ offset: true }).nullable().optional(),
    customer: z.object({ email: z.string().email() }),
    authorization: z.object({ authorization_code: z.string(), channel: z.string(), reusable: z.boolean() }).optional(),
    metadata: z.object({ continua_reference: z.string(), continua_user: z.string(), mode: z.literal("live") }),
});
export function validateLiveTransaction(raw, order) {
    const parsed = transactionSchema.safeParse(raw);
    if (!parsed.success)
        throw new ApiError(409, "This payment does not match your live checkout.");
    const t = parsed.data;
    if (t.reference !== order.reference || t.amount !== order.amount_minor || t.customer.email.toLowerCase() !== order.email.toLowerCase() || t.metadata.continua_reference !== order.reference || t.metadata.continua_user !== order.user_id || (t.status === "success" && !t.paid_at))
        throw new ApiError(409, "This payment does not match your live checkout.");
    return t;
}
export async function initializeLiveCheckout(userId, email, input, policyVersion, paymentMethod, intentId) {
    if (policyVersion !== CHECKOUT_POLICY_VERSION)
        throw new ApiError(400, 'Acknowledge the current checkout terms before proceeding.');
    requireEnabled();
    if (!z.string().email().safeParse(email).success)
        throw new ApiError(400, "Your account needs an email address for checkout.");
    const profile = await query("SELECT public.effective_subscription_plan($1) AS plan", [userId]);
    if (!profile.rows[0])
        throw new ApiError(409, "Create your membership profile before checkout.");
    if (profile.rows[0].plan === 'premium_plus' && input.plan === 'premium')
        throw new ApiError(409, "Premium is already included in your active Premium Plus membership. Renew Plus or wait until it expires to switch.");
    const amount = prices[input.plan][input.cycle];
    const useIntent=env.PAYSTACK_CHECKOUT_INTENTS_ENABLED===true;
    const reference = useIntent?hostedIntentReference(userId,intentId):`continua-live-${randomUUID()}`;
    const requestHash=useIntent?hostedRequestHash(userId,email,input,policyVersion,paymentMethod,amount):null;
    if(useIntent){
        const inserted=await query(`INSERT INTO public.paystack_live_orders(reference,user_id,email,plan,cycle,amount_minor,terms_version,terms_accepted_at,initialization_request_hash,initialization_state)
        VALUES($1,$2,$3,$4,$5,$6,$7,now(),$8,'initializing') ON CONFLICT(reference) DO NOTHING RETURNING reference`,[reference,userId,email,input.plan,input.cycle,amount,policyVersion,requestHash]);
        if(!inserted.rows.length){
            const previous=(await query('SELECT initialization_request_hash,initialization_state,authorization_url,checkout_access_code,status FROM public.paystack_live_orders WHERE reference=$1 AND user_id=$2',[reference,userId])).rows[0];
            if(!previous||previous.initialization_request_hash!==requestHash)throw new ApiError(409,'This checkout intent belongs to a different request.');
            if(previous.status==='paid')throw new ApiError(409,'This checkout is already paid. Verify its receipt instead.');
            if(previous.initialization_state!=='initialized'||!validCheckoutUrl(previous.authorization_url))throw checkoutPending(reference);
            return {url:previous.authorization_url,accessCode:previous.checkout_access_code??null,reference,mode:'live',amount:amount/100,currency:'KES'};
        }
    }else
    await query(`INSERT INTO public.paystack_live_orders (reference,user_id,email,plan,cycle,amount_minor,terms_version,terms_accepted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())`, [reference, userId, email, input.plan, input.cycle, amount, policyVersion]);
    let data;try{data = z.object({ authorization_url: z.string(), reference: z.literal(reference), access_code: z.string().min(1).max(200).optional() }).safeParse(await provider("/transaction/initialize", {
        email, amount, currency: "KES", reference, callback_url: env.PAYSTACK_CALLBACK_URL,
        metadata: JSON.stringify({ continua_reference: reference, continua_user: userId, mode: "live", terms_version: policyVersion }),
        ...(paymentMethod ? { channels: [paymentMethod] } : {}),
        // One-time checkout supports M-PESA. Never save reusable card authorizations or auto-charge.
    }));
    }catch(error){if(useIntent)await query("UPDATE public.paystack_live_orders SET initialization_state='unknown' WHERE reference=$1 AND initialization_state='initializing'",[reference]).catch(()=>{});if(useIntent)throw checkoutPending(reference);throw error;}
    if (!data.success || !validCheckoutUrl(data.data.authorization_url)) {
        if(useIntent){await query("UPDATE public.paystack_live_orders SET initialization_state='unknown' WHERE reference=$1 AND initialization_state='initializing'",[reference]).catch(()=>{});throw checkoutPending(reference);}
        throw new ApiError(502, "Payment provider returned an invalid checkout link.");
    }
    if(useIntent){let saved;try{saved=await query("UPDATE public.paystack_live_orders SET initialization_state='initialized',authorization_url=$2,checkout_access_code=$3 WHERE reference=$1 AND initialization_request_hash=$4 AND initialization_state='initializing'",[reference,data.data.authorization_url,data.data.access_code??null,requestHash]);}catch{throw checkoutPending(reference);}if(saved.rowCount!==1)throw checkoutPending(reference);}
    return { url: data.data.authorization_url, accessCode: data.data.access_code ?? null, reference, mode: "live", amount: amount / 100, currency: 'KES' };
}
export async function verifyLiveCheckout(reference, userId) {
    requireEnabled();
    if (!liveReferencePattern.test(reference))
        throw new ApiError(400, "Invalid checkout reference.");
    const found = await query(`SELECT * FROM public.paystack_live_orders WHERE reference=$1${userId ? " AND user_id=$2" : ""}`, userId ? [reference, userId] : [reference]);
    const order = found.rows[0];
    if (!order)
        throw new ApiError(404, "Checkout not found.");
    const t = validateLiveTransaction(await provider(`/transaction/verify/${encodeURIComponent(reference)}`), order);
    let entitlement = null;
    if (t.status === "success") {
        const result = await query("SELECT public.fulfill_paystack_live_order($1,$2,$3::timestamptz) AS receipt", [reference, t.id, t.paid_at]);
        entitlement = result.rows[0]?.receipt ?? null;
        if (!entitlement)
            throw new ApiError(503, "Payment verified but membership activation needs another verification attempt. Do not pay again.");
    }
    return { reference, mode: "live", status: t.status === "success" ? "paid" : ["failed", "abandoned", "reversed"].includes(t.status) ? t.status : "pending", plan: order.plan, cycle: order.cycle, amount: order.amount_minor / 100, currency: "KES", policyVersion: order.terms_version ?? null, membershipChanged: !!entitlement, ...entitlement };
}
export async function expirePaidMemberships() { await query("SELECT public.expire_paid_memberships()"); }
