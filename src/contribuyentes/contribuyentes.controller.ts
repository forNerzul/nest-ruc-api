import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ContribuyentesService } from './contribuyentes.service';

@Controller('contribuyentes')
export class ContribuyentesController {
  constructor(private readonly contribuyentesService: ContribuyentesService) {}

  @Get()
  async getContribuyentes() {
    return this.contribuyentesService.findAll();
  }

  @Get('ruc/:ruc')
  async getContribuyenteByRuc(@Param('ruc') ruc: string) {
    const contribuyente = await this.contribuyentesService.findByRuc(ruc);
    if (!contribuyente) {
      throw new NotFoundException(`Contribuyente con RUC ${ruc} no encontrado`);
    }
    return contribuyente;
  }

  @Get('cedula/:cedula')
  async getContribuyenteByCedula(@Param('cedula') cedula: string) {
    const contribuyente = await this.contribuyentesService.findByCedula(cedula);
    if (!contribuyente) {
      throw new NotFoundException(
        `Contribuyente con cédula ${cedula} no encontrado`,
      );
    }
    return contribuyente;
  }
}
