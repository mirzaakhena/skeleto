/// <reference types="node" resolution-mode="require"/>
import express from "express";
import { FuncInstanceMetadata } from "skeleto";
type RequestWithContext = express.Request & {
    context?: Record<string, any>;
};
export declare function generateController(router: express.Router, useCases: FuncInstanceMetadata[]): void;
export declare const handleJWTAuth: (secretKey: string, fieldName: string) => (req: RequestWithContext, res: express.Response, next: express.NextFunction) => Promise<void>;
export declare function printController(usecases: FuncInstanceMetadata[]): {
    tag: string;
    usecase: string;
    method: string;
    path: string;
}[];
export {};
//# sourceMappingURL=controller.d.ts.map