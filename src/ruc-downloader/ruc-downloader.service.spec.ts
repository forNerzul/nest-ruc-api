import { Test, TestingModule } from '@nestjs/testing';
import { RucDownloaderService } from './ruc-downloader.service';

describe('RucDownloaderService', () => {
  let service: RucDownloaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RucDownloaderService],
    }).compile();

    service = module.get<RucDownloaderService>(RucDownloaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
