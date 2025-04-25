import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { Resident } from '@entity/resident.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resident])],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService],
})
export class ResidentsModule {}
