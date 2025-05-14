import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Prisma } from '@prisma/client';

interface ContribuyenteData {
  ruc: string;
  nombre: string;
  digitoVerif: string;
  rucAnterior: string | null;
  estado: string;
  fuente: string;
}

@Injectable()
export class RucParserService {
  private readonly logger = new Logger(RucParserService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Procesa un archivo RUC txt y almacena los contribuyentes en la base de datos
   * @param filePath Ruta del archivo a procesar
   * @param source Fuente del archivo (ruc0, ruc1, etc.)
   */
  async processRucFile(
    filePath: string,
    source: string,
  ): Promise<{ processed: number; errors: number }> {
    this.logger.log(`Procesando archivo: ${filePath}`);
    let processed = 0;
    let errors = 0;

    if (!fs.existsSync(filePath)) {
      this.logger.error(`Archivo no encontrado: ${filePath}`);
      return { processed, errors: 1 };
    }

    // Crear stream de lectura para procesar el archivo línea por línea
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const batchSize = 1000; // Procesar en lotes para mejor rendimiento
    let batch: ContribuyenteData[] = [];

    for await (const line of rl) {
      // Ignorar líneas vacías
      if (!line.trim()) continue;

      try {
        // Parsear línea (formato: RUC|NOMBRE|DÍGITO|RUC_ANTERIOR|ESTADO)
        const parts = line.split('|');
        if (parts.length < 3) {
          this.logger.warn(`Formato inválido en línea: ${line}`);
          errors++;
          continue;
        }

        const contribuyente: ContribuyenteData = {
          ruc: parts[0],
          nombre: parts[1],
          digitoVerif: parts[2],
          rucAnterior: parts.length > 3 ? parts[3] : null,
          estado: parts.length > 4 ? parts[4] : 'DESCONOCIDO',
          fuente: source,
        };

        batch.push(contribuyente);
        processed++;

        // Procesar en lotes para mejor rendimiento
        if (batch.length >= batchSize) {
          await this.saveBatch(batch);
          batch = [];
        }
      } catch (error) {
        this.logger.error(`Error procesando línea: ${error.message}`);
        errors++;
      }
    }

    // Guardar el último lote
    if (batch.length > 0) {
      await this.saveBatch(batch);
    }

    this.logger.log(
      `Procesamiento completado: ${processed} contribuyentes procesados, ${errors} errores`,
    );
    return { processed, errors };
  }

  /**
   * Procesa todos los archivos TXT en una carpeta de RUC específica
   * @param rucDir Directorio que contiene los archivos TXT (ejemplo: data/ruc0)
   */
  async processRucDirectory(
    rucDir: string,
  ): Promise<{ processed: number; errors: number }> {
    let totalProcessed = 0;
    let totalErrors = 0;

    if (!fs.existsSync(rucDir)) {
      this.logger.error(`Directorio no encontrado: ${rucDir}`);
      return { processed: 0, errors: 1 };
    }

    const source = path.basename(rucDir); // ruc0, ruc1, etc.
    const files = fs
      .readdirSync(rucDir)
      .filter((file) => file.endsWith('.txt'));

    this.logger.log(`Procesando ${files.length} archivos en ${rucDir}`);

    for (const file of files) {
      const filePath = path.join(rucDir, file);
      const stats = await this.processRucFile(filePath, source);
      totalProcessed += stats.processed;
      totalErrors += stats.errors;
    }

    return { processed: totalProcessed, errors: totalErrors };
  }

  /**
   * Procesa todas las carpetas de RUC extraídas
   * @param dataDir Directorio raíz que contiene las carpetas de RUC (ejemplo: data/)
   */
  async processAllRucDirectories(
    dataDir: string = path.join(process.cwd(), 'data'),
  ): Promise<{
    processed: number;
    errors: number;
  }> {
    let totalProcessed = 0;
    let totalErrors = 0;

    if (!fs.existsSync(dataDir)) {
      this.logger.error(`Directorio de datos no encontrado: ${dataDir}`);
      return { processed: 0, errors: 1 };
    }

    const dirs = fs
      .readdirSync(dataDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith('ruc'))
      .map((dirent) => dirent.name);

    this.logger.log(`Encontradas ${dirs.length} carpetas RUC en ${dataDir}`);

    for (const dir of dirs) {
      const stats = await this.processRucDirectory(path.join(dataDir, dir));
      totalProcessed += stats.processed;
      totalErrors += stats.errors;
    }

    return { processed: totalProcessed, errors: totalErrors };
  }

  /**
   * Guarda un lote de contribuyentes en la base de datos
   * @param batch Lote de contribuyentes a guardar
   */
  private async saveBatch(batch: ContribuyenteData[]): Promise<void> {
    try {
      // Usar transactions para garantizar la consistencia
      await this.prisma.$transaction(async (tx) => {
        for (const contribuyente of batch) {
          await tx.contribuyente.upsert({
            where: { ruc: contribuyente.ruc },
            update: {
              nombre: contribuyente.nombre,
              digitoVerif: contribuyente.digitoVerif,
              rucAnterior: contribuyente.rucAnterior,
              estado: contribuyente.estado,
              fuente: contribuyente.fuente,
            },
            create: contribuyente,
          });
        }
      });
    } catch (error) {
      this.logger.error(
        `Error al guardar lote en la base de datos: ${error.message}`,
      );
      throw error;
    }
  }
}
