import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client = context.switchToWs().getClient()
            const authToken = client.handshake.auth.token
            if(!authToken) {
                throw new WsException('Token de autenticação não fornecido.')
            }
            const payload = await this.jwtService.verifyAsync(authToken, {
                secret: process.env.JWT_SECRET,
            })
            client.user = payload
        } catch (err) {
            throw new WsException('Token inválido ou expirado') 
        }
        return true
    }
}