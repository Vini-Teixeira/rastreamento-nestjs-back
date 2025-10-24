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
exports.FlexibleAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const firebase_auth_guard_1 = require("./firebase-auth/firebase-auth.guard");
let FlexibleAuthGuard = class FlexibleAuthGuard {
    constructor(jwtGuard, firebaseGuard) {
        this.jwtGuard = jwtGuard;
        this.firebaseGuard = firebaseGuard;
    }
    async canActivate(context) {
        try {
            const canActivateJwt = await this.jwtGuard.canActivate(context);
            if (canActivateJwt) {
                return true;
            }
        }
        catch (error) { }
        try {
            const canActivateFirebase = await this.firebaseGuard.canActivate(context);
            if (canActivateFirebase) {
                return true;
            }
        }
        catch (error) { }
        return false;
    }
};
exports.FlexibleAuthGuard = FlexibleAuthGuard;
exports.FlexibleAuthGuard = FlexibleAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_auth_guard_1.JwtAuthGuard,
        firebase_auth_guard_1.FirebaseAuthGuard])
], FlexibleAuthGuard);
//# sourceMappingURL=flexible-auth.guard.js.map