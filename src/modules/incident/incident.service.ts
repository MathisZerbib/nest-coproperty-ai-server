import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncidentDto } from '../../entities/create-incident.entity';
import { Incident } from '@entity/incidents.entity';
import { UpdateIncidentDto } from '../../entities/update-incident.entity';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
  ) {}

  // Create a new incident
  async create(
    createIncidentDto: CreateIncidentDto,
    file?: Express.Multer.File,
  ): Promise<Incident> {
    const { ...incidentData } = createIncidentDto;

    let filePath: string | undefined;
    if (file) {
      // Save the file to the file system
      const uploadDir = path.join(__dirname, '../../../uploads/incident');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = `${Date.now()}-${file.originalname}`;
      const fileFullPath = path.join(uploadDir, fileName);
      const writeStream = fs.createWriteStream(fileFullPath);

      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        writeStream.end(file.buffer);
      });

      filePath = `/uploads/incident/${fileName}`;
    }

    // Create the incident with the file path if provided
    const incident = this.incidentsRepository.create({
      ...incidentData,
      photos: filePath ? [filePath] : [],
    });

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

  // async updateIncidentImage(
  //   id: string,
  //   image: Express.Multer.File,
  // ): Promise<Incident> {
  //   const incident = await this.findOne(id);

  //   if (!incident) {
  //     throw new BadRequestException(`Incident with ID ${id} not found`);
  //   }

  //   // Ensure the upload directory exists
  //   const uploadDir = path.join(__dirname, '../../../uploads/incident');
  //   if (!fs.existsSync(uploadDir)) {
  //     fs.mkdirSync(uploadDir, { recursive: true });
  //   }
  //   // Save the image using a stream
  //   const imagePath = path.join(uploadDir, image.originalname);
  //   const writeStream = fs.createWriteStream(imagePath);
  //   await new Promise<void>((resolve, reject) => {
  //     writeStream.on('finish', resolve);
  //     writeStream.on('error', (error) => {
  //       reject(new Error(`Failed to write file: ${error.message}`));
  //     });
  //     // Write the file buffer to the stream
  //     writeStream.end(image.buffer);
  //   });

  //   // Update the incident with the image path
  //   const relativePath = `/uploads/incident/${image.originalname}`;
  //   incident.photos = [...(incident.photos || []), relativePath];
  //   return this.incidentsRepository.save(incident);
  // }
  // Delete an incident
  async remove(id: string): Promise<void> {
    const incident = await this.findOne(id);
    await this.incidentsRepository.remove(incident);
  }
}
