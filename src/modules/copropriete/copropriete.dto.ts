import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CoproprieteDto {
  @ApiProperty({
    example: 'Copropriete A',
    description: 'The name of the copropriete',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'The address of the copropriete',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'A beautiful copropriete',
    description: 'Description of the copropriete',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 10,
    description: 'The number of units in the copropriete',
  })
  @IsNumber()
  @IsNotEmpty()
  units: number;

  @ApiProperty({ example: 'John Doe', description: 'The name of the advisor' })
  @IsString()
  @IsOptional()
  advisor_name?: string;

  @ApiProperty({
    example: 'advisor@example.com',
    description: 'The email of the advisor',
  })
  @IsString()
  @IsOptional()
  advisor_email?: string;

  @ApiProperty({
    example: '+123456789',
    description: 'The phone number of the advisor',
  })
  @IsString()
  @IsOptional()
  advisor_phone?: string;
}
