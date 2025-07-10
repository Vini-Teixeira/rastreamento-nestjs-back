import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { EntregadoresService } from 'src/entregadores/entregadores.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly entregadoresService;
    constructor(configService: ConfigService, entregadoresService: EntregadoresService);
    validate(payload: {
        sub: string;
        telefone: string;
    }): Promise<any>;
}
export {};
