import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Copropriete } from '../../entity/copropriete.entity';
import { CoproprieteController } from './copropriete.controller';
import { CoproprieteService } from './copropriete.service';

@Module({
  imports: [TypeOrmModule.forFeature([Copropriete])],
  controllers: [CoproprieteController],
  providers: [CoproprieteService],
})
export class CoproprieteModule {}
