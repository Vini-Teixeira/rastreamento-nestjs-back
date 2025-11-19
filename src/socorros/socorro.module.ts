import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Socorro, SocorroSchema } from './schemas/socorro.schema';
import { SocorrosController } from './socorros.controller';
import { SocorrosService } from './socorros.service';
import { GoogleMapsModule } from 'src/google-maps/google-maps.module';
import { EntregasModule } from 'src/entregas/entregas.module';
import { EntregadoresModule } from 'src/entregadores/entregadores.module';
import { EntregadorSchema, Entregador } from 'src/entregadores/schemas/entregador.schema';
import { LojistasModule } from 'src/lojistas/lojistas.module';
import { FcmModule } from 'src/fcm/fcm.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Socorro.name, schema: SocorroSchema },
      { name: Entregador.name, schema: EntregadorSchema }
    ]),
    GoogleMapsModule,
    FcmModule,
    forwardRef(() => EntregasModule),
    forwardRef(() => EntregadoresModule),
    forwardRef(() => LojistasModule)
  ],
  controllers: [SocorrosController],
  providers: [SocorrosService],
  exports: [SocorrosService,
    MongooseModule.forFeature([{ name: Socorro.name, schema: SocorroSchema }])
  ]
})
export class SocorroModule {}