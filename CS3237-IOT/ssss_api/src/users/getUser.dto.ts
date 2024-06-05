import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetUser {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: string;
}
