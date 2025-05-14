import { Module } from '@nestjs/common';
import { RucParserService } from './ruc-parser.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RucParserService],
  exports: [RucParserService],
})
export class RucParserModule {}
