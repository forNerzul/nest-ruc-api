import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContribuyentesController } from './contribuyentes/contribuyentes.controller';
import { RucDownloaderModule } from './ruc-downloader/ruc-downloader.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { RucParserService } from './ruc-parser/ruc-parser.service';
import { RucParserModule } from './ruc-parser/ruc-parser.module';

@Module({
  imports: [RucDownloaderModule, PrismaModule, RucParserModule],
  controllers: [AppController, ContribuyentesController],
  providers: [AppService, PrismaService, RucParserService],
})
export class AppModule {}
