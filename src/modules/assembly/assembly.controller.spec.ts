import { Test, TestingModule } from '@nestjs/testing';
import { AssemblyController } from './assembly.controller';
import { AssemblyService } from './assembly.service';
import { AuthGuard } from '../auth/auth.guard';
import { Assembly } from './assembly.entity';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    copropriety_id: string;
  };
}

describe('AssemblyController', () => {
  let controller: AssemblyController;
  let assemblyService: jest.Mocked<AssemblyService>;
  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAssembly: Partial<Assembly> = {
    id: '1',
    title: 'Test Assembly',
    date: new Date(),
    type: 'ordinary',
    status: 'upcoming',
    copropriety_id: 'copro-1',
    created_at: new Date(),
    updated_at: new Date(),
    location: 'Meeting Room 1',
    minutes: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssemblyController],
      providers: [
        {
          provide: AssemblyService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            addAgendaItem: jest.fn(),
            addDecision: jest.fn(),
            addAttendee: jest.fn(),
            addDocument: jest.fn(),
            generateMinutes: jest.fn(),
            getAssemblyStatistics: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AssemblyController>(AssemblyController);
    assemblyService = module.get<AssemblyService>(
      AssemblyService,
    ) as jest.Mocked<AssemblyService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of assemblies', async () => {
      const mockAssemblies = [mockAssembly as Assembly];
      assemblyService.findAll.mockResolvedValue(mockAssemblies);

      const result = await controller.findAll();
      expect(result).toEqual(mockAssemblies);
      expect(assemblyService.findAll).toHaveBeenCalled();
    });

    it('should handle empty array', async () => {
      assemblyService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(assemblyService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single assembly', async () => {
      assemblyService.findOne.mockResolvedValue(mockAssembly as Assembly);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockAssembly);
      expect(assemblyService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when assembly not found', async () => {
      assemblyService.findOne.mockRejectedValue(
        new Error('Assembly not found'),
      );

      await expect(controller.findOne('1')).rejects.toThrow(
        'Assembly not found',
      );
      expect(assemblyService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a new assembly', async () => {
      const mockAssemblyData: Partial<Assembly> = {
        title: 'New Assembly',
        date: new Date(),
        type: 'ordinary',
      };
      const mockCreatedAssembly = {
        ...mockAssembly,
        ...mockAssemblyData,
      };
      const mockReq = {
        user: { copropriety_id: 'copro-1' },
      } as RequestWithUser;

      assemblyService.create.mockResolvedValue(mockCreatedAssembly as Assembly);

      const result = await controller.create(mockAssemblyData, mockReq);
      expect(result).toEqual(mockCreatedAssembly);
      expect(assemblyService.create).toHaveBeenCalledWith({
        ...mockAssemblyData,
        copropriety_id: 'copro-1',
      });
    });
  });

  describe('update', () => {
    it('should update an assembly', async () => {
      const mockUpdateData: Partial<Assembly> = { title: 'Updated Assembly' };
      const mockUpdatedAssembly = {
        ...mockAssembly,
        ...mockUpdateData,
      };

      assemblyService.update.mockResolvedValue(mockUpdatedAssembly as Assembly);

      const result = await controller.update('1', mockUpdateData);
      expect(result).toEqual(mockUpdatedAssembly);
      expect(assemblyService.update).toHaveBeenCalledWith('1', mockUpdateData);
    });

    it('should throw NotFoundException when assembly not found', async () => {
      const mockUpdateData: Partial<Assembly> = { title: 'Updated Assembly' };
      assemblyService.update.mockRejectedValue(new Error('Assembly not found'));

      await expect(controller.update('1', mockUpdateData)).rejects.toThrow(
        'Assembly not found',
      );
      expect(assemblyService.update).toHaveBeenCalledWith('1', mockUpdateData);
    });
  });

  describe('delete', () => {
    it('should delete an assembly', async () => {
      assemblyService.delete.mockResolvedValue();

      await controller.delete('1');
      expect(assemblyService.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when assembly not found', async () => {
      assemblyService.delete.mockRejectedValue(new Error('Assembly not found'));

      await expect(controller.delete('1')).rejects.toThrow(
        'Assembly not found',
      );
      expect(assemblyService.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('addAgendaItem', () => {
    it('should add an agenda item to an assembly', async () => {
      const mockAgendaItem = {
        title: 'New Agenda Item',
        order: 1,
        requires_vote: true,
        description: 'Agenda item description',
        status: 'pending' as const,
      };
      const mockCreatedAgendaItem = {
        id: '1',
        ...mockAgendaItem,
        assembly_id: '1',
        created_at: new Date(),
        updated_at: new Date(),
        assembly: mockAssembly as Assembly,
      };

      assemblyService.addAgendaItem.mockResolvedValue(mockCreatedAgendaItem);

      const result = await controller.addAgendaItem('1', mockAgendaItem);
      expect(result).toEqual(mockCreatedAgendaItem);
      expect(assemblyService.addAgendaItem).toHaveBeenCalledWith(
        '1',
        mockAgendaItem,
      );
    });
  });

  describe('addDecision', () => {
    it('should add a decision to an assembly', async () => {
      const mockDecision = {
        title: 'New Decision',
        description: 'Decision description',
        result: 'approved' as const,
      };
      const mockCreatedDecision = {
        id: '1',
        ...mockDecision,
        assembly_id: '1',
        votes_for: 0,
        votes_against: 0,
        abstentions: 0,
        created_at: new Date(),
        updated_at: new Date(),
        agenda_item_id: '',
        assembly: mockAssembly as Assembly,
        voters: [],
      };

      assemblyService.addDecision.mockResolvedValue(mockCreatedDecision);

      const result = await controller.addDecision('1', mockDecision);
      expect(result).toEqual(mockCreatedDecision);
      expect(assemblyService.addDecision).toHaveBeenCalledWith(
        '1',
        mockDecision,
      );
    });
  });

  describe('addAttendee', () => {
    it('should add an attendee to an assembly', async () => {
      const mockAttendee = {
        name: 'John Doe',
        role: 'owner' as const,
        present: true,
      };
      const mockCreatedAttendee = {
        id: '1',
        ...mockAttendee,
        assembly_id: '1',
        created_at: new Date(),
        updated_at: new Date(),
        proxy_name: '',
        proxy_document: '',
        assembly: mockAssembly as Assembly,
      };

      assemblyService.addAttendee.mockResolvedValue(mockCreatedAttendee);

      const result = await controller.addAttendee('1', mockAttendee);
      expect(result).toEqual(mockCreatedAttendee);
      expect(assemblyService.addAttendee).toHaveBeenCalledWith(
        '1',
        mockAttendee,
      );
    });
  });

  describe('addDocument', () => {
    it('should add a document to an assembly', async () => {
      const mockDocument = {
        name: 'Meeting Minutes',
        type: 'pdf' as const,
        url: 'https://example.com/document.pdf',
      };
      const mockCreatedDocument = {
        id: '1',
        ...mockDocument,
        assembly_id: '1',
        uploaded_by: 'user-1',
        created_at: new Date(),
        updated_at: new Date(),
        assembly: mockAssembly as Assembly,
      };

      assemblyService.addDocument.mockResolvedValue(mockCreatedDocument);

      const result = await controller.addDocument('1', mockDocument);
      expect(result).toEqual(mockCreatedDocument);
      expect(assemblyService.addDocument).toHaveBeenCalledWith(
        '1',
        mockDocument,
      );
    });
  });

  describe('generateMinutes', () => {
    it('should generate minutes for an assembly', async () => {
      const mockAssemblyWithMinutes = {
        ...mockAssembly,
        minutes: 'Generated minutes content',
      };

      assemblyService.generateMinutes.mockResolvedValue(
        mockAssemblyWithMinutes as Assembly,
      );

      const result = await controller.generateMinutes('1');
      expect(result).toEqual(mockAssemblyWithMinutes);
      expect(assemblyService.generateMinutes).toHaveBeenCalledWith('1');
    });
  });

  describe('getStatistics', () => {
    it('should return assembly statistics', async () => {
      const mockStatistics = {
        totalAttendees: 10,
        presentCount: 8,
        proxyCount: 2,
        participationRate: 80,
        votingRate: 75,
        approvedResolutions: 5,
        totalResolutions: 6,
      };

      assemblyService.getAssemblyStatistics.mockResolvedValue(mockStatistics);

      const result = await controller.getStatistics('1');
      expect(result).toEqual(mockStatistics);
      expect(assemblyService.getAssemblyStatistics).toHaveBeenCalledWith('1');
    });
  });
});
