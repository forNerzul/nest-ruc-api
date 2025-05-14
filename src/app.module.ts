import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RucDownloaderModule } from './ruc-downloader/ruc-downloader.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { RucParserService } from './ruc-parser/ruc-parser.service';
import { RucParserModule } from './ruc-parser/ruc-parser.module';
import { ContribuyentesModule } from './contribuyentes/contribuyentes.module';

@Module({
  imports: [
    RucDownloaderModule,
    PrismaModule,
    RucParserModule,
    ContribuyentesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RucParserService],
})
export class AppModule {}
