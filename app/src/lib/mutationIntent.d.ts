export declare function createMutationIntent(newId?:()=>string):{prepare<T extends object>(value:T,logicalIdentity?:object):T&{id:string};confirm(id:string):void};
