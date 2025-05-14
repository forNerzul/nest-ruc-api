import { Test, TestingModule } from '@nestjs/testing';
import { RucParserService } from './ruc-parser.service';

describe('RucParserService', () => {
  let service: RucParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RucParserService],
    }).compile();

    service = module.get<RucParserService>(RucParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
