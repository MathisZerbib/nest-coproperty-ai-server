import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { Metadata } from '../../entities/metadata.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Metadata])],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
