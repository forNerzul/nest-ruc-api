import { Module } from '@nestjs/common';
import { ContribuyentesController } from './contribuyentes.controller';
import { ContribuyentesService } from './contribuyentes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContribuyentesController],
  providers: [ContribuyentesService],
  exports: [ContribuyentesService],
})
export class ContribuyentesModule {}
