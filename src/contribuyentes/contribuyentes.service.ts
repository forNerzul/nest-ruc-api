import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContribuyentesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.contribuyente.findMany();
  }

  async findByRuc(ruc: string) {
    return this.prisma.contribuyente.findUnique({
      where: { ruc },
    });
  }

  async findByCedula(cedula: string) {
    // Asumiendo que el RUC en Paraguay tiene la estructura: Cédula + DV + 0
    // Por ejemplo, para cédula 1234567, el RUC sería 1234567X0 donde X es el dígito verificador
    // Buscamos todos los RUCs que comiencen con el número de cédula
    return this.prisma.contribuyente.findFirst({
      where: {
        ruc: {
          startsWith: cedula,
        },
      },
    });
  }
}
