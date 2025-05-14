import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ContribuyentesService } from './contribuyentes.service';

@Controller('contribuyentes')
export class ContribuyentesController {
  constructor(private readonly contribuyentesService: ContribuyentesService) {}

  @Get()
  async getContribuyentes(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const contribuyentes = await this.contribuyentesService.findAll(
      limitNum,
      offsetNum,
    );

    return {
      data: contribuyentes,
      metadata: {
        count: contribuyentes.length,
        limit: limitNum,
        offset: offsetNum,
        hasData: await this.contribuyentesService.hasContribuyentes(),
      },
    };
  }

  @Get('status')
  async getStatus() {
    const hasData = await this.contribuyentesService.hasContribuyentes();
    return {
      apiReady: true,
      dataLoaded: hasData,
      message: hasData
        ? 'La API está funcionando con datos cargados'
        : 'La API está funcionando pero los datos aún se están cargando',
    };
  }

  @Get('ruc/:ruc')
  async getContribuyenteByRuc(@Param('ruc') ruc: string) {
    const contribuyente = await this.contribuyentesService.findByRuc(ruc);
    if (!contribuyente) {
      throw new NotFoundException(
        `Contribuyente con RUC ${ruc} no encontrado (los datos podrían estar cargándose)`,
      );
    }
    return contribuyente;
  }

  @Get('cedula/:cedula')
  async getContribuyenteByCedula(@Param('cedula') cedula: string) {
    const contribuyente = await this.contribuyentesService.findByCedula(cedula);
    if (!contribuyente) {
      throw new NotFoundException(
        `Contribuyente con cédula ${cedula} no encontrado (los datos podrían estar cargándose)`,
      );
    }
    return contribuyente;
  }
}
