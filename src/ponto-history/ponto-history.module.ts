import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PontoHistory, PontoHistorySchema } from './schemas/ponto-history.schema';
import { PontoHistoryService } from './ponto-history.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: PontoHistory.name, schema: PontoHistorySchema}]),
    ],
    providers: [PontoHistoryService],
    exports: [MongooseModule, PontoHistoryService]
})
export class PontoHistoryModule {}