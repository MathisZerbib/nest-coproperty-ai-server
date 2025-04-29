import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncidentDto } from './create-incident.dto';
import { Incident } from '@entity/incidents.entity';
import { UpdateIncidentDto } from './update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
  ) {}

  // Create a new incident
  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentsRepository.create(createIncidentDto);
    return this.incidentsRepository.save(incident);
  }

  // Retrieve all incidents
  async findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find({ relations: ['resident'] }); // Include related resident
  }

  // Retrieve a single incident by ID
  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({
      where: { id },
      relations: ['resident'], // Include related resident
    });
    if (!incident) {
      throw new Error(`Incident with ID ${id} not found`);
    }
    return incident;
  }

  // Retrieve incidents by resident ID
  async findByResidentId(residentId: string): Promise<Incident[]> {
    const incidents = await this.incidentsRepository.find({
      where: { resident: { id: residentId } },
      relations: ['resident'], // Include related resident
    });

    if (!incidents || incidents.length === 0) {
      return [];
    }

    return incidents;
  }

  // Update an incident
  async update(
    id: string,
    updateIncidentDto: UpdateIncidentDto,
  ): Promise<Incident> {
    const existingIncident = await this.findOne(id);
    const updatedIncident = { ...existingIncident, ...updateIncidentDto };
    await this.incidentsRepository.save(updatedIncident);
    return updatedIncident;
  }

  // Delete an incident
  async remove(id: string): Promise<void> {
    const incident = await this.findOne(id);
    await this.incidentsRepository.remove(incident);
  }
}
