import { Resident } from '@entity/resident.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectRepository(Resident)
    private readonly residentsRepository: Repository<Resident>,
  ) {}

  // Retrieve all residents
  async findAll(): Promise<Resident[]> {
    return this.residentsRepository.find();
  }

  // Create a new resident
  async create(residentData: Partial<Resident>): Promise<Resident> {
    const resident = this.residentsRepository.create(residentData);
    return this.residentsRepository.save(resident);
  }

  // Retrieve a single resident by ID
  async findOne(id: string): Promise<Resident> {
    const resident = await this.residentsRepository.findOne({ where: { id } });
    if (!resident) {
      throw new Error(`Resident with ID ${id} not found`);
    }
    return resident;
  }

  // Update a resident
  async update(id: string, updateData: Partial<Resident>): Promise<Resident> {
    const resident = await this.findOne(id);
    const updatedResident = { ...resident, ...updateData };
    return this.residentsRepository.save(updatedResident);
  }

  // Delete a resident
  async remove(id: string): Promise<void> {
    const resident = await this.findOne(id);
    await this.residentsRepository.remove(resident);
  }
}
