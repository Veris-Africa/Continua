// An environment key is not activation approval. No provider is enabled here.
export function applyPaidAiApproval(config){
 return {...config,OPENAI_API_KEY:config.ENGINE_PAID_AI_ENABLED===true?config.OPENAI_API_KEY:undefined};
}
