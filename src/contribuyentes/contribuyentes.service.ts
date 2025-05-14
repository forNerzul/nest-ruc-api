import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContribuyentesService {
  private readonly logger = new Logger(ContribuyentesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(limit = 100, offset = 0) {
    try {
      const contribuyentes = await this.prisma.contribuyente.findMany({
        take: limit,
        skip: offset,
      });
      return contribuyentes;
    } catch (error) {
      this.logger.error(`Error al buscar contribuyentes: ${error.message}`);
      return []; // Devolver array vacío en caso de error
    }
  }

  async findByRuc(ruc: string) {
    try {
      return await this.prisma.contribuyente.findUnique({
        where: { ruc },
      });
    } catch (error) {
      this.logger.error(
        `Error al buscar contribuyente por RUC ${ruc}: ${error.message}`,
      );
      return null;
    }
  }

  async findByCedula(cedula: string) {
    try {
      // Asumiendo que el RUC en Paraguay tiene la estructura: Cédula + DV + 0
      // Por ejemplo, para cédula 1234567, el RUC sería 1234567X0 donde X es el dígito verificador
      // Buscamos todos los RUCs que comiencen con el número de cédula
      return await this.prisma.contribuyente.findFirst({
        where: {
          ruc: {
            startsWith: cedula,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error al buscar contribuyente por cédula ${cedula}: ${error.message}`,
      );
      return null;
    }
  }

  async hasContribuyentes(): Promise<boolean> {
    try {
      const count = await this.prisma.contribuyente.count({
        take: 1,
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Error al verificar si hay contribuyentes: ${error.message}`,
      );
      return false;
    }
  }
}
