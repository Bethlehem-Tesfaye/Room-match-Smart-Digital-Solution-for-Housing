export interface AuthResponse {
    token?: string | null;
    user?: {
        id: string;
        email: string;
        name: string;
        [key: string]: any;
    };
    [key: string]: any;
}
export declare const signInAdmin: (email: string, password: string) => Promise<AuthResponse>;
export declare const signUpAdmin: (name: string, email: string, password: string, callbackURL?: string | null) => Promise<AuthResponse>;
export declare const promoteAdmin: (userId: string, adminSecret: string) => Promise<AuthResponse>;
