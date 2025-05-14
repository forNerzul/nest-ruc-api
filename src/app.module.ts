import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContribuyentesController } from './contribuyentes/contribuyentes.controller';
import { RucDownloaderModule } from './ruc-downloader/ruc-downloader.module';

@Module({
  imports: [RucDownloaderModule],
  controllers: [AppController, ContribuyentesController],
  providers: [AppService],
})
export class AppModule {}
