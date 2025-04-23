import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Strategy Games' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Strategic board games and simulations' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'category-image.jpg' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}