import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IncidentsService } from './incident.service';
import { CreateIncidentDto } from '../../entities/create-incident.entity';
import { UpdateIncidentDto } from '../../entities/update-incident.entity';
import { Incident } from '@entity/incidents.entity';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(AuthGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // Intercept file uploads
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @UploadedFile() file?: Express.Multer.File, // Detect if a file is uploaded
  ): Promise<Incident> {
    console.log('Creating incident:', createIncidentDto);
    return this.incidentsService.create(createIncidentDto, file);
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

  // get all incidents by copropriete id
  @Get('copropriete/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Retrieve incidents by copropriete ID' })
  @ApiParam({ name: 'id', description: 'Copropriete ID' })
  @ApiResponse({
    status: 200,
    description:
      'List of incidents for the specified copropriete retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No incidents found for the specified copropriete',
  })
  async findByCoproprieteId(@Param('id') id: string): Promise<Incident[]> {
    return this.incidentsService.findByCoproprieteId(id);
  }

  // @Patch(':id/image')
  // @UseGuards(AuthGuard)
  // @UseInterceptors(FileInterceptor('image'))
  // @ApiOperation({ summary: 'Update the image of an incident' })
  // @ApiParam({ name: 'id', description: 'Incident ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Incident image updated successfully',
  // })
  // @ApiResponse({ status: 404, description: 'Incident not found' })
  // async updateIncidentImage(
  //   @Param('id') id: string,
  //   @UploadedFile() image: Express.Multer.File,
  // ): Promise<Incident> {
  //   return await this.incidentsService.updateIncidentImage(id, image);
  // }

  @Get('resident/:residentId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Retrieve incidents by resident ID' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiResponse({
    status: 200,
    description:
      'List of incidents for the specified resident retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No incidents found for the specified resident',
  })
  async findByResidentId(
    @Param('residentId') residentId: string,
  ): Promise<Incident[]> {
    return this.incidentsService.findByResidentId(residentId);
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
