import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AssemblyService } from './assembly.service';
import { Assembly } from './assembly.entity';
import { AuthGuard } from '../auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { AgendaItem } from './agenda-item.entity';
import { AssemblyDocument } from './assembly-document.entity';
import { Attendee } from './attendee.entity';
import { Decision } from './decision.entity';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAssemblyDto {
  @ApiProperty({
    description: 'Title of the assembly',
    example: 'Annual General Meeting 2024',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Date of the assembly',
    example: '2024-03-15T14:00:00Z',
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: 'Type of assembly',
    enum: ['ordinary', 'extraordinary'],
    example: 'ordinary',
  })
  @IsEnum(['ordinary', 'extraordinary'])
  @IsNotEmpty()
  type: 'ordinary' | 'extraordinary';

  @ApiProperty({
    description: 'Location of the assembly',
    example: 'Meeting Room 1',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Status of the assembly',
    enum: ['upcoming', 'completed', 'cancelled'],
    example: 'upcoming',
  })
  @IsEnum(['upcoming', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'upcoming' | 'completed' | 'cancelled';

  @ApiProperty({
    description: 'ID of the copropriety',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  copropriety_id: string;
}

@ApiTags('assemblies')
@Controller('assemblies')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assemblies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all assemblies',
    type: [Assembly],
  })
  async findAll(): Promise<Assembly[]> {
    return this.assemblyService.findAll();
  }

  @Get('copropriete/:id')
  @ApiOperation({ summary: 'Get assemblies by copropriete ID' })
  @ApiParam({ name: 'id', description: 'Copropriete ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return assemblies for the specified copropriete',
    type: [Assembly],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No assemblies found for the specified copropriete',
  })
  async findByCopropriete(
    @Param('id') coproprieteId: string,
  ): Promise<Assembly[]> {
    return this.assemblyService.findByCopropriete(coproprieteId);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get assembly by id' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the assembly',
    type: Assembly,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async findOne(@Param('id') id: string): Promise<Assembly> {
    return this.assemblyService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new assembly',
    description: 'Creates a new assembly with the provided copropriety ID',
  })
  @ApiBody({
    type: CreateAssemblyDto,
    description: 'Assembly creation data including the copropriety ID',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Assembly has been created',
    type: Assembly,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  async create(@Body() assemblyData: CreateAssemblyDto): Promise<Assembly> {
    return this.assemblyService.create(assemblyData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiBody({ type: CreateAssemblyDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assembly has been updated',
    type: Assembly,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async update(
    @Param('id') id: string,
    @Body() assemblyData: Partial<CreateAssemblyDto>,
  ): Promise<Assembly> {
    return this.assemblyService.update(id, assemblyData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assembly has been deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.assemblyService.delete(id);
  }

  @Post(':id/agenda')
  @ApiOperation({ summary: 'Add agenda item to assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiBody({ type: AgendaItem })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Agenda item has been added',
    type: AgendaItem,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async addAgendaItem(
    @Param('id') id: string,
    @Body() agendaItemData: Partial<AgendaItem>,
  ): Promise<AgendaItem> {
    return this.assemblyService.addAgendaItem(id, agendaItemData);
  }

  @Delete(':id/agenda/:itemId')
  @ApiOperation({ summary: 'Delete agenda item from assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiParam({ name: 'itemId', description: 'Agenda Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agenda item has been deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly or Agenda item not found',
  })
  async deleteAgendaItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.assemblyService.deleteAgendaItem(id, itemId);
  }

  // In your assembly.controller.ts
  @Patch(':id/agenda/:itemId')
  async updateAgendaItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateAgendaItemDto: Partial<AgendaItem>,
  ) {
    return this.assemblyService.updateAgendaItem(
      id,
      itemId,
      updateAgendaItemDto,
    );
  }

  @Post(':id/decisions')
  @ApiOperation({ summary: 'Add decision to assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiBody({ type: Decision })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Decision has been added',
    type: Decision,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async addDecision(
    @Param('id') id: string,
    @Body() decisionData: Partial<Decision>,
  ): Promise<Decision> {
    return this.assemblyService.addDecision(id, decisionData);
  }

  @Post(':id/attendees')
  @ApiOperation({ summary: 'Add attendee to assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiBody({ type: Attendee })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attendee has been added',
    type: Attendee,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async addAttendee(
    @Param('id') id: string,
    @Body() attendeeData: Partial<Attendee>,
  ): Promise<Attendee> {
    return this.assemblyService.addAttendee(id, attendeeData);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Add document to assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiBody({ type: AssemblyDocument })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document has been added',
    type: AssemblyDocument,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async addDocument(
    @Param('id') id: string,
    @Body() documentData: Partial<AssemblyDocument>,
  ): Promise<AssemblyDocument> {
    return this.assemblyService.addDocument(id, documentData);
  }

  @Post(':id/generate-minutes')
  @ApiOperation({ summary: 'Generate minutes for assembly' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Minutes have been generated',
    type: Assembly,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async generateMinutes(@Param('id') id: string): Promise<Assembly> {
    return this.assemblyService.generateMinutes(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get assembly statistics' })
  @ApiParam({ name: 'id', description: 'Assembly ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return assembly statistics',
    schema: {
      type: 'object',
      properties: {
        totalAttendees: { type: 'number' },
        presentCount: { type: 'number' },
        proxyCount: { type: 'number' },
        participationRate: { type: 'number' },
        votingRate: { type: 'number' },
        approvedResolutions: { type: 'number' },
        totalResolutions: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assembly not found',
  })
  async getStatistics(@Param('id') id: string): Promise<any> {
    return this.assemblyService.getAssemblyStatistics(id);
  }
}
