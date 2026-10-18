import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UsuarioModule } from '../usuario/usuario.module';
import { RolModule } from '../rol/rol.module';

@Module({
    imports: [UsuarioModule, RolModule],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule {}