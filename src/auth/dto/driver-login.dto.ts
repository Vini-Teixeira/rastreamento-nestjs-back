import { IsNotEmpty, IsString } from "class-validator";

export class DriverLoginDto {
    @IsString()
    @IsNotEmpty()
    telefone: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}