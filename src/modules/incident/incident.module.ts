import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsService } from './incident.service';
import { IncidentsController } from './incident.controller';
import { Incident } from '@entity/incidents.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incident])],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentModule {}
