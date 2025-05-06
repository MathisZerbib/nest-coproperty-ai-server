import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResidentsService } from './residents.service';
import { Resident } from '@entity/resident.entity';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(AuthGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all residents' })
  @ApiResponse({
    status: 200,
    description: 'List of residents retrieved successfully',
  })
  async findAll(): Promise<Resident[]> {
    return this.residentsService.findAll();
  }

  // Get all residents for a specific copropriete
  @Get('copropriete/:id')
  @ApiOperation({
    summary: 'Retrieve all residents for a specific copropriete',
  })
  @ApiParam({ name: 'id', description: 'Copropriete ID' })
  @ApiResponse({
    status: 200,
    description: 'List of residents for the specified copropriete',
  })
  async findByCopropriete(@Param('id') id: string): Promise<Resident[]> {
    return this.residentsService.findByCopropriete(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resident' })
  @ApiResponse({ status: 201, description: 'Resident created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() residentData: Partial<Resident>): Promise<Resident> {
    return this.residentsService.create(residentData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single resident by ID' })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponse({ status: 200, description: 'Resident retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  async findOne(@Param('id') id: string): Promise<Resident> {
    return this.residentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a resident by ID' })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponse({ status: 200, description: 'Resident updated successfully' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<Resident>,
  ): Promise<Resident> {
    return this.residentsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resident by ID' })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponse({ status: 200, description: 'Resident deleted successfully' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.residentsService.remove(id);
  }
}
