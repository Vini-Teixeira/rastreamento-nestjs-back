import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateLojistaDto {
    @IsString()
    @IsNotEmpty()
    nomeCompleto: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, {message: 'A senha deve ter no mínimo 6 caracteres.'})
    password: string;
}