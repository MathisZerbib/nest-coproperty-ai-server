import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assembly } from './assembly.entity';
import { AgendaItem } from './agenda-item.entity';
import { AssemblyDocument } from './assembly-document.entity';
import { Attendee } from './attendee.entity';
import { Decision } from './decision.entity';
import { Voter } from './voter.entity';

@Injectable()
export class AssemblyService {
  constructor(
    @InjectRepository(Assembly)
    private assemblyRepository: Repository<Assembly>,
    @InjectRepository(AgendaItem)
    private agendaItemRepository: Repository<AgendaItem>,
    @InjectRepository(Decision)
    private decisionRepository: Repository<Decision>,
    @InjectRepository(Attendee)
    private attendeeRepository: Repository<Attendee>,
    @InjectRepository(AssemblyDocument)
    private documentRepository: Repository<AssemblyDocument>,
    @InjectRepository(Voter)
    private voterRepository: Repository<Voter>,
  ) {}

  async findAll(): Promise<Assembly[]> {
    return this.assemblyRepository.find({
      relations: ['agenda', 'decisions', 'documents', 'attendees'],
    });
  }

  async findOne(id: string): Promise<Assembly> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id },
      relations: ['agenda', 'decisions', 'documents', 'attendees'],
    });

    if (!assembly) {
      throw new NotFoundException(`Assembly with ID ${id} not found`);
    }

    return assembly;
  }

  async create(assemblyData: Partial<Assembly>): Promise<Assembly> {
    const assembly = this.assemblyRepository.create(assemblyData);
    return this.assemblyRepository.save(assembly);
  }

  async update(id: string, assemblyData: Partial<Assembly>): Promise<Assembly> {
    const assembly = await this.findOne(id);
    Object.assign(assembly, assemblyData);
    return this.assemblyRepository.save(assembly);
  }

  async delete(id: string): Promise<void> {
    const result = await this.assemblyRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Assembly with ID ${id} not found`);
    }
  }

  async addAgendaItem(
    id: string,
    agendaItemData: Partial<AgendaItem>,
  ): Promise<AgendaItem> {
    await this.findOne(id); // Verify assembly exists
    const agendaItem = this.agendaItemRepository.create({
      ...agendaItemData,
      assembly_id: id,
    });
    return this.agendaItemRepository.save(agendaItem);
  }

  async addDecision(
    id: string,
    decisionData: Partial<Decision>,
  ): Promise<Decision> {
    await this.findOne(id); // Verify assembly exists
    const decision = this.decisionRepository.create({
      ...decisionData,
      assembly_id: id,
    });
    return this.decisionRepository.save(decision);
  }

  async addAttendee(
    id: string,
    attendeeData: Partial<Attendee>,
  ): Promise<Attendee> {
    await this.findOne(id); // Verify assembly exists
    const attendee = this.attendeeRepository.create({
      ...attendeeData,
      assembly_id: id,
    });
    return this.attendeeRepository.save(attendee);
  }

  async addDocument(
    id: string,
    documentData: Partial<AssemblyDocument>,
  ): Promise<AssemblyDocument> {
    await this.findOne(id); // Verify assembly exists
    const document = this.documentRepository.create({
      ...documentData,
      assembly_id: id,
    });
    return this.documentRepository.save(document);
  }

  async generateMinutes(id: string): Promise<Assembly> {
    const assembly = await this.findOne(id);
    // Here you would implement the logic to generate minutes
    // This could involve AI processing, template filling, etc.
    assembly.minutes = 'Generated minutes content'; // Placeholder
    return this.assemblyRepository.save(assembly);
  }

  async getAssemblyStatistics(id: string): Promise<any> {
    const assembly = await this.findOne(id);
    const attendees = assembly.attendees || [];
    const decisions = assembly.decisions || [];

    return {
      totalAttendees: attendees.length,
      presentCount: attendees.filter((a) => a.present).length,
      proxyCount: attendees.filter((a) => a.proxy_name).length,
      participationRate:
        attendees.length > 0
          ? (attendees.filter((a) => a.present).length / attendees.length) * 100
          : 0,
      votingRate:
        decisions.length > 0
          ? decisions.reduce(
              (acc, d) => acc + d.votes_for + d.votes_against + d.abstentions,
              0,
            ) / decisions.length
          : 0,
      approvedResolutions: decisions.filter((d) => d.result === 'approved')
        .length,
      totalResolutions: decisions.length,
    };
  }
}
