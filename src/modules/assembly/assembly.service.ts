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

  async findByCopropriete(id: string): Promise<Assembly[]> {
    // First get the assemblies
    const assemblies = await this.assemblyRepository.find({
      where: { copropriety_id: id },
      order: { date: 'DESC' },
    });

    // If no assemblies found, return empty array
    if (!assemblies.length) return [];

    // For each assembly, manually load its related entities
    for (const assembly of assemblies) {
      // Load agenda items
      assembly.agenda = await this.agendaItemRepository.find({
        where: { assembly_id: assembly.id },
        order: { order: 'ASC' },
      });
      // Load decisions
      assembly.decisions = await this.decisionRepository.find({
        where: { assembly_id: assembly.id },
      });

      // Load documents
      assembly.documents = await this.documentRepository.find({
        where: { assembly_id: assembly.id },
      });

      // Load attendees
      assembly.attendees = await this.attendeeRepository.find({
        where: { assembly_id: assembly.id },
      });
    }

    return assemblies;
  }

  async findOne(id: string): Promise<Assembly> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id },
      relations: ['agenda', 'decisions', 'documents', 'attendees'],
    });

    if (!assembly) {
      throw new NotFoundException(`Assembly with ID ${id} not found`);
    }
    console.log('Assembly found:', assembly);

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
  async checkAgendaItems(assemblyId: string): Promise<AgendaItem[]> {
    const agendaItems = await this.agendaItemRepository.find({
      where: { assembly_id: assemblyId },
    });
    console.log(
      `Found ${agendaItems.length} agenda items for assembly ${assemblyId}`,
    );
    return agendaItems;
  }

  async updateAgendaItem(
    assemblyId: string,
    agendaItemId: string,
    agendaItemData: Partial<AgendaItem>,
  ): Promise<AgendaItem> {
    // First verify the assembly exists
    await this.findOne(assemblyId);

    // Find the agenda item
    const agendaItem = await this.agendaItemRepository.findOne({
      where: {
        id: agendaItemId,
        assembly_id: assemblyId,
      },
    });

    if (!agendaItem) {
      throw new NotFoundException(
        `Agenda item with ID ${agendaItemId} not found in assembly ${assemblyId}`,
      );
    }

    // Update the agenda item
    Object.assign(agendaItem, agendaItemData);

    return this.agendaItemRepository.save(agendaItem);
  }

  async deleteAgendaItem(
    assemblyId: string,
    agendaItemId: string,
  ): Promise<void> {
    // First verify the assembly exists
    await this.findOne(assemblyId);

    // Find the agenda item to make sure it exists and belongs to the assembly
    const agendaItem = await this.agendaItemRepository.findOne({
      where: {
        id: agendaItemId,
        assembly_id: assemblyId,
      },
    });

    if (!agendaItem) {
      throw new NotFoundException(
        `Agenda item with ID ${agendaItemId} not found in assembly ${assemblyId}`,
      );
    }

    // Delete the agenda item
    const result = await this.agendaItemRepository.delete(agendaItemId);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Agenda item with ID ${agendaItemId} not found`,
      );
    }
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
    assembly.minutes = 'Generated minutes content';
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
