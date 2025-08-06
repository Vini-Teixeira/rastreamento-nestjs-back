"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map