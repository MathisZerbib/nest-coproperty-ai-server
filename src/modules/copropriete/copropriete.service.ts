import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Copropriete } from '../../entity/copropriete.entity';

@Injectable()
export class CoproprieteService {
  constructor(
    @InjectRepository(Copropriete)
    private readonly coproprieteRepository: Repository<Copropriete>,
  ) {}

  // Retrieve all coproprietes for a specific user
  async getCoproprietes(userId: string): Promise<Copropriete[]> {
    return this.coproprieteRepository.find({
      where: { user: { userId } }, // Match userId from the User entity
      relations: ['user'], // Include the user relationship if needed
    });
  }

  // Create a new copropriete for a specific user
  async createCopropriete(
    userId: string,
    data: Partial<Copropriete>,
  ): Promise<Copropriete> {
    const copropriete = this.coproprieteRepository.create({
      ...data,
      user: { userId }, // Associate the copropriete with the user
    });
    return this.coproprieteRepository.save(copropriete);
  }

  // Update an existing copropriete by ID
  async updateCopropriete(
    id: string,
    updates: Partial<Copropriete>,
  ): Promise<Copropriete> {
    const copropriete = await this.coproprieteRepository.findOne({
      where: { id },
    });
    if (!copropriete) {
      throw new NotFoundException('Copropriete not found');
    }
    Object.assign(copropriete, updates);
    return this.coproprieteRepository.save(copropriete);
  }

  // Delete a copropriete by ID
  async deleteCopropriete(id: string): Promise<void> {
    const copropriete = await this.coproprieteRepository.findOne({
      where: { id },
    });
    if (!copropriete) {
      throw new NotFoundException('Copropriete not found');
    }
    await this.coproprieteRepository.remove(copropriete);
  }
}
