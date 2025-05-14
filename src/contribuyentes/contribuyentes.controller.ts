import { Controller, Get } from '@nestjs/common';

@Controller('contribuyentes')
export class ContribuyentesController {
  @Get()
  getContribuyentes() {
    const contribuyente = {
      ruc: '1234567890',
      nombre: 'Juan Perez',
      tipo_documento: 1,
      numero_documento: '1234567890',
      estado: 'activo',
      fecha_actualizacion: new Date(),
    };
    return contribuyente;
  }
}
