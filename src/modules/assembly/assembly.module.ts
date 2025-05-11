import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssemblyController } from './assembly.controller';
import { AssemblyService } from './assembly.service';
import { Assembly } from './assembly.entity';
import { AgendaItem } from './agenda-item.entity';
import { Decision } from './decision.entity';
import { Attendee } from './attendee.entity';
import { Voter } from './voter.entity';
import { AssemblyDocument } from './assembly-document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assembly,
      AgendaItem,
      Decision,
      Attendee,
      Voter,
      AssemblyDocument,
    ]),
  ],
  controllers: [AssemblyController],
  providers: [AssemblyService],
  exports: [AssemblyService],
})
export class AssemblyModule {}
