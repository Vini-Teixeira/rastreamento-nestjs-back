"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('RequestLogger');
let RequestLoggerMiddleware = class RequestLoggerMiddleware {
    use(req, res, next) {
        const start = Date.now();
        const safeHeaders = {
            authorization: !!req.headers.authorization,
            host: req.headers.host,
            'content-type': req.headers['content-type'],
        };
        logger.log(`→ ${req.method} ${req.originalUrl} | headers: ${JSON.stringify(safeHeaders)}`);
        let chunksSize = 0;
        req.on('data', (chunk) => { chunksSize += chunk.length; });
        res.on('finish', () => {
            const ms = Date.now() - start;
            logger.log(`← ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms - bodyBytes:${chunksSize}`);
        });
        next();
    }
};
exports.RequestLoggerMiddleware = RequestLoggerMiddleware;
exports.RequestLoggerMiddleware = RequestLoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestLoggerMiddleware);
//# sourceMappingURL=request-logger.middleware.js.map