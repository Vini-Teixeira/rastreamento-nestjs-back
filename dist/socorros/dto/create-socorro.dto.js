"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSocorroDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CoordinatesDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CoordinatesDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CoordinatesDto.prototype, "lng", void 0);
class ClientLocationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O endereço do cliente é obrigatório.' }),
    __metadata("design:type", String)
], ClientLocationDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CoordinatesDto),
    __metadata("design:type", CoordinatesDto)
], ClientLocationDto.prototype, "coordinates", void 0);
class CreateSocorroDto {
}
exports.CreateSocorroDto = CreateSocorroDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ClientLocationDto),
    __metadata("design:type", ClientLocationDto)
], CreateSocorroDto.prototype, "clientLocation", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'O nome do cliente deve ser um texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O nome do cliente deve ser obrigatório' }),
    (0, class_validator_1.Length)(2, 100, { message: 'O nome do cliente deve ter entre 2 e 100 caracteres' }),
    __metadata("design:type", String)
], CreateSocorroDto.prototype, "clienteNome", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'O telefone do cliente deve ser um número de telefone' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O telefone do cliente é obrigatório' }),
    (0, class_validator_1.Length)(10, 15, { message: "O telefone do cliente deve ter entre 10 e 15 caracteres (ex: 79912345678)" }),
    __metadata("design:type", String)
], CreateSocorroDto.prototype, "clienteTelefone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(7, 8, { message: 'A placa deve ter entre 7 e 8 caracteres.' }),
    __metadata("design:type", String)
], CreateSocorroDto.prototype, "placaVeiculo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 50, { message: 'O modelo deve ter entre 2 e 50 caracteres.' }),
    __metadata("design:type", String)
], CreateSocorroDto.prototype, "modeloVeiculo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSocorroDto.prototype, "serviceDescription", void 0);
//# sourceMappingURL=create-socorro.dto.js.map