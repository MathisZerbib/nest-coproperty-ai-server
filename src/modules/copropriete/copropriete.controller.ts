import {
  Body,
  Controller,
  Get,
  Put,
  Delete,
  Param,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CoproprieteService } from './copropriete.service';
import { Copropriete } from '../../entities/copropriete.entity';
import { CoproprieteDto } from '../../entities/copropriete.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Coproprietes')
@ApiBearerAuth()
@Controller('coproprietes')
export class CoproprieteController {
  constructor(private readonly coproprieteService: CoproprieteService) {}

  @ApiOperation({ summary: 'Get all coproprietes for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of coproprietes retrieved successfully',
    type: [Copropriete],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Coproprietes not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseGuards(AuthGuard)
  @Get()
  async getCoproprietes(
    @Req() req: { user: { sub: string } },
  ): Promise<Copropriete[]> {
    const userId: string = req.user.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.coproprieteService.getCoproprietes(userId);
  }

  @ApiOperation({ summary: 'Create a new copropriete' })
  @ApiResponse({
    status: 201,
    description: 'Copropriete created successfully',
    type: Copropriete,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    description: 'Details of the copropriete to create',
    required: true,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Copropriete A' },
        address: { type: 'string', example: '123 Main St' },
        description: { type: 'string', example: 'A beautiful copropriete' },
        units: { type: 'number', example: 10 },
        advisor_name: { type: 'string', example: 'John Doe' },
        advisor_email: { type: 'string', example: 'advisor@example.com' },
        advisor_phone: { type: 'string', example: '+123456789' },
      },
    },
  })
  @UseGuards(AuthGuard)
  @Post()
  async createCopropriete(
    @Req() req: { user: { sub: string } }, // Extract user from the request
    @Body() body: CoproprieteDto,
  ): Promise<Copropriete> {
    const userId = req.user.sub; // Get userId from the JWT payload
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.coproprieteService.createCopropriete(userId, body);
  }

  @ApiOperation({ summary: 'Update an existing copropriete by ID' })
  @ApiResponse({
    status: 200,
    description: 'Copropriete updated successfully',
    type: Copropriete,
  })
  @ApiResponse({ status: 404, description: 'Copropriete not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({
    name: 'id',
    description: 'Copropriete ID',
    required: true,
    schema: { type: 'string' },
  })
  @UseGuards(AuthGuard)
  @Put(':id')
  async updateCopropriete(
    @Param('id') id: string,
    @Body() body: CoproprieteDto,
  ): Promise<Copropriete> {
    return this.coproprieteService.updateCopropriete(id, body);
  }

  @ApiOperation({ summary: 'Delete a copropriete by ID' })
  @ApiResponse({
    status: 200,
    description: 'Copropriete deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Copropriete not found' })
  @ApiParam({
    name: 'id',
    description: 'Copropriete ID',
    required: true,
    schema: { type: 'string' },
  })
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteCopropriete(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    try {
      await this.coproprieteService.deleteCopropriete(id);
      return { message: 'Copropriete deleted successfully' };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Copropriete not found') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to delete copropriete',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
