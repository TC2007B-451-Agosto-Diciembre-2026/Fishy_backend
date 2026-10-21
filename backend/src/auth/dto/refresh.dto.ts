import { ApiProperty } from '@nestjs/swagger';
import { IsString } from "class-validator";

export class RefreshDto {
    @ApiProperty({
        description: 'El refreshToken que regresó POST /auth/login',
        example: 'eyJhbGciOi...<token-de-ejemplo>',
    })
    @IsString()
    refreshToken: string;
}