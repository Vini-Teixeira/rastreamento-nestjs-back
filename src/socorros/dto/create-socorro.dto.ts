import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class ClientLocationDto {
    @IsString()
    @IsNotEmpty()
    address: string
}

export class CreateSocorroDto {
    @IsObject()
    @ValidateNested()
    @Type(() => ClientLocationDto)
    clientLocation: ClientLocationDto

    @IsString()
    @IsOptional()
    serviceDescription?: string
}