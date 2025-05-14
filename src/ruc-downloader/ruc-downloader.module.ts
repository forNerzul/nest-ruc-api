import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RucDownloaderService } from './ruc-downloader.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RucDownloaderService],
  exports: [RucDownloaderService],
})
export class RucDownloaderModule {}
