import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IncidentsService } from './incident.service';
import { CreateIncidentDto } from './create-incident.dto';
import { UpdateIncidentDto } from './update-incident.dto';
import { Incident } from '@entity/incidents.entity';

@ApiTags('Incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
  ): Promise<Incident> {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all incidents' })
  @ApiResponse({
    status: 200,
    description: 'List of incidents retrieved successfully',
  })
  async findAll(): Promise<Incident[]> {
    return this.incidentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single incident by ID' })
  @ApiParam({ name: 'id', description: 'Incident ID' })
  @ApiResponse({ status: 200, description: 'Incident retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  async findOne(@Param('id') id: string): Promise<Incident> {
    return this.incidentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an incident by ID' })
  @ApiParam({ name: 'id', description: 'Incident ID' })
  @ApiResponse({ status: 200, description: 'Incident updated successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  async update(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<Incident> {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an incident by ID' })
  @ApiParam({ name: 'id', description: 'Incident ID' })
  @ApiResponse({ status: 200, description: 'Incident deleted successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.incidentsService.remove(id);
  }
}
