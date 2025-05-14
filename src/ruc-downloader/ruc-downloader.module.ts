import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RucDownloaderService } from './ruc-downloader.service';
import { RucParserModule } from '../ruc-parser/ruc-parser.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RucParserModule,
  ],
  providers: [RucDownloaderService],
  exports: [RucDownloaderService],
})
export class RucDownloaderModule {}
