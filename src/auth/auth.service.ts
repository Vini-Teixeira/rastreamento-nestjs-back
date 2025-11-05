import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from './firebase-admin.provider';
import { Inject } from '@nestjs/common';
import { Admin, AdminDocument } from 'src/admin/schemas/admin.schema';

interface DriverPayload {
  sub: string;
  telefone: string;
  role: string;
}

interface LojistaPayload {
  sub: string;
  email: string;
  nome: string;
  role: string
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService,
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>
  ) {}

  async loginDriver(driver: any) {
    if (!driver?._id || !driver?.telefone) {
      throw new UnauthorizedException(
        'Dados do entregador incompletos para geração do token.',
      );
    }

    const payload: DriverPayload = {
      sub: String(driver._id),
      telefone: String(driver.telefone),
      role: driver.role,
    };
    const accessToken = this.jwtService.sign(payload);
    let firebaseToken: string;
    try {
      const uid = String(driver._id);
      const customClaims = {
        role: driver.role,
      };

      firebaseToken = await this.firebase.auth().createCustomToken(uid, customClaims);

    } catch (error) {
      console.error('FIREBASE_AUTH_ERROR: Falha ao criar custom token', error);
      throw new BadRequestException('Falha ao gerar token de autenticação secundária (Firebase).');
    }

    return {
      access_token: accessToken,
      firebase_token: firebaseToken,
    };
  }

  async loginLojista(lojista: any) {
    if (!lojista?._id || !lojista?.email) {
      throw new UnauthorizedException(
        'Dados do lojista incompletos para geração do token.',
      );
    }

    const payload: LojistaPayload = {
      sub: String(lojista._id),
      email: String(lojista.email),
      nome: String(lojista.nomeFantasia),
      role: lojista.role
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginComFirebaseToken(firebaseToken: string) {
    try {
      const decodedToken = await this.firebase.auth().verifyIdToken(firebaseToken)
      const email = decodedToken.email
      const adminUser = await this.adminModel.findOne({ email }).exec()
      if(!adminUser) {
        throw new UnauthorizedException('Administrador não encontrado')
      }
      const payload = {
        sub: decodedToken.uid,
        email: email,
        role: 'admin'
      }
      return {
        access_token: this.jwtService.sign(payload)
      }
    } catch (error) {
      throw new UnauthorizedException('Token do Firebase inválido ou expirado')
    }
  }

  async registerAdminWithFirebaseToken(firebaseToken: string): Promise<AdminDocument> {
    try {
      const decodedToken = await this.firebase.auth().verifyIdToken(firebaseToken)
      const { email, name } = decodedToken

      if(!email) {
        throw new BadRequestException('O token do Firebase não contém um email')
      }
      const existingAdmin = await this.adminModel.findOne({ email }).exec()
      if(existingAdmin) {
        return existingAdmin
      }
      const newAdmin = new this.adminModel({
        email,
        nome: name || email,
        role: 'admin'
      })
      return newAdmin.save()
    } catch (error) {
      throw new UnauthorizedException('Token do Firebase inválido ou falha no registro do Admin.')
    }
  }
}
