import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import { mkdirp } from 'mkdirp';
import * as cheerio from 'cheerio';
import { RucParserService } from '../ruc-parser/ruc-parser.service';

interface DownloadUrlInfo {
  url: string;
  filename: string;
}

@Injectable()
export class RucDownloaderService implements OnModuleInit {
  private readonly logger = new Logger(RucDownloaderService.name);

  private readonly config = {
    baseUrl:
      'https://www.dnit.gov.py/web/portal-institucional/listado-de-ruc-con-sus-equivalencias?maps=todos',
    downloadDir: path.join(process.cwd(), 'downloads'),
    extractDir: path.join(process.cwd(), 'data'),
    logFile: path.join(process.cwd(), 'download.log'),
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    // Time to run daily (default: 1:00 AM)
    scheduleTime: '0 1 * * *',
  };

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private rucParserService: RucParserService,
  ) {
    // Ensure directories exist
    mkdirp.sync(this.config.downloadDir);
    mkdirp.sync(this.config.extractDir);
  }

  async onModuleInit() {
    // Run immediately on startup
    try {
      await this.downloadAllRucFiles();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Initial download failed: ${errorMessage}`);
    }
  }

  @Cron('0 1 * * *') // Run at 1:00 AM every day
  async handleCron() {
    this.log('Running scheduled RUC files download');
    await this.downloadAllRucFiles();
  }

  // Logger function
  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    this.logger.log(message);
    fs.appendFileSync(this.config.logFile, logMessage);
  }

  // Get download URLs from the main page
  private async getDownloadUrls(): Promise<DownloadUrlInfo[]> {
    try {
      this.log('Fetching download URLs from main page...');

      const response = await axios.get(this.config.baseUrl);
      const $ = cheerio.load(response.data);

      // Find all download links on the page
      const downloadUrls: DownloadUrlInfo[] = [];
      const foundRucNumbers = new Set<string>();

      // Assuming the download links are anchor tags with download attributes or relevant classes
      $('a[download], a.button-download, a[href*="ruc"]').each(
        (index, element) => {
          const href = $(element).attr('href');
          if (href && href.includes('ruc') && /ruc[0-9]\.zip/i.test(href)) {
            // Extract the RUC number (0-9)
            const rucMatch = href.match(/ruc([0-9])\.zip/i);
            if (rucMatch && rucMatch[1]) {
              const rucNumber = rucMatch[1];

              // Skip if we already found this RUC number
              if (foundRucNumbers.has(rucNumber)) return;
              foundRucNumbers.add(rucNumber);

              // Check if it's a relative URL and make it absolute if needed
              const fullUrl = href.startsWith('http')
                ? href
                : new URL(href, 'https://www.dnit.gov.py').href;

              // Always use the standardized filename format
              downloadUrls.push({
                url: fullUrl,
                filename: `ruc${rucNumber}.zip`,
              });
            }
          }
        },
      );

      this.log(`Found ${downloadUrls.length} download URLs`);
      return downloadUrls;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Error fetching download URLs: ${errorMessage}`);
      throw error;
    }
  }

  // Download a single RUC zip file
  private async downloadFile(urlInfo: DownloadUrlInfo): Promise<string> {
    const { url, filename } = urlInfo;
    const outputPath = path.join(this.config.downloadDir, filename);

    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        this.log(`Downloading ${filename} from ${url}...`);

        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'arraybuffer', // Use arraybuffer to handle binary data properly
          headers: {
            Accept: 'application/zip',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        // Check if the content type is a ZIP file
        const contentType = response.headers['content-type'] as string;
        if (
          contentType &&
          !contentType.includes('zip') &&
          !contentType.includes('octet-stream')
        ) {
          this.log(
            `Warning: Content type is ${contentType}, not a ZIP file. Will attempt to process anyway.`,
          );
        }

        // Write the file to disk
        fs.writeFileSync(outputPath, response.data);

        // Validate the ZIP file
        try {
          // Just check if we can open it, don't actually extract yet
          new AdmZip(outputPath);
          this.log(`Successfully downloaded and verified ${filename}`);
          return outputPath;
        } catch (zipError) {
          const errorMessage =
            zipError instanceof Error ? zipError.message : String(zipError);
          this.log(`Downloaded file is not a valid ZIP: ${errorMessage}`);
          // Delete the invalid file
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
          throw new Error(`Invalid ZIP file: ${errorMessage}`);
        }
      } catch (error) {
        retries++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.log(
          `Error downloading ${filename}: ${errorMessage}. Retry ${retries}/${this.config.maxRetries}`,
        );

        if (retries >= this.config.maxRetries) {
          this.log(
            `Failed to download ${filename} after ${this.config.maxRetries} attempts`,
          );
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay),
        );
      }
    }

    // This should never be reached due to the error handling above, but TypeScript requires a return
    throw new Error(
      `Failed to download ${filename} after ${this.config.maxRetries} attempts`,
    );
  }

  // Extract a zip file
  private async extractZip(zipPath: string): Promise<string> {
    try {
      const fileName = path.basename(zipPath);
      this.log(`Extracting ${fileName}...`);

      const zip = new AdmZip(zipPath);
      const targetDir = path.join(
        this.config.extractDir,
        path.basename(zipPath, '.zip'),
      );

      // Ensure extract directory exists
      mkdirp.sync(targetDir);

      zip.extractAllTo(targetDir, true);
      this.log(`Successfully extracted ${fileName} to ${targetDir}`);
      
      // Return the target directory where files were extracted
      return targetDir;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Error extracting ${zipPath}: ${errorMessage}`);
      throw error;
    }
  }

  // Process extracted files and save to database
  private async processExtractedFiles(extractedDir: string): Promise<void> {
    try {
      this.log(`Procesando archivos extraídos en: ${extractedDir}`);
      
      // Usar el servicio RucParser para procesar los archivos
      const stats = await this.rucParserService.processRucDirectory(extractedDir);
      
      this.log(
        `Proceso de base de datos completado: ${stats.processed} contribuyentes procesados, ${stats.errors} errores`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Error procesando archivos extraídos: ${errorMessage}`);
      throw error;
    }
  }

  // Fallback method: If web scraping fails, try direct download with these patterns
  private async downloadWithDirectPatterns(): Promise<DownloadUrlInfo[]> {
    this.log('Using fallback direct download patterns...');

    // Añadimos una pequeña espera para asegurar que el método tenga un await
    await new Promise((resolve) => setTimeout(resolve, 100));

    const downloadUrls: DownloadUrlInfo[] = [];
    for (let i = 0; i <= 9; i++) {
      // Try multiple potential URL patterns but always use the standardized filename
      const rucFilename = `ruc${i}.zip`;

      // Add multiple potential URL patterns for each RUC file
      const urlPatterns = [
        `https://www.dnit.gov.py/docs/${rucFilename}`,
        `https://www.dnit.gov.py/web/portal-institucional/listado-de-ruc-con-sus-equivalencias/files/${rucFilename}`,
        `https://www.dnit.gov.py/web/portal-institucional/listado-de-ruc-con-sus-equivalencias?maps=todos&file=${rucFilename}`,
        `https://www.dnit.gov.py/web/portal-institucional/listado-de-ruc-con-sus-equivalencias/download/${rucFilename}`,
      ];

      // Add each pattern to the download URLs list
      for (const url of urlPatterns) {
        downloadUrls.push({
          url: url,
          filename: rucFilename,
        });
      }
    }

    this.log(`Generated ${downloadUrls.length} fallback URL patterns to try`);
    return downloadUrls;
  }

  // Main download function
  public async downloadAllRucFiles(): Promise<void> {
    const startTime = new Date();
    this.log('Starting RUC files download process');

    try {
      // Try to get URLs by scraping the page
      let downloadUrls: DownloadUrlInfo[] = [];
      try {
        downloadUrls = await this.getDownloadUrls();
        if (downloadUrls.length === 0) {
          this.log(
            'No download URLs found via scraping, using fallback method',
          );
          downloadUrls = await this.downloadWithDirectPatterns();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.log(
          `Error in web scraping: ${errorMessage}, using fallback method`,
        );
        downloadUrls = await this.downloadWithDirectPatterns();
      }

      // Organize URLs by RUC number to prevent duplicates
      const rucFileMap = new Map<string, DownloadUrlInfo>(); // Maps ruc number to url info
      for (const urlInfo of downloadUrls) {
        const match = urlInfo.filename.match(/ruc([0-9])\.zip/i);
        if (match && match[1]) {
          const rucNumber = match[1];
          // Only add if we haven't processed this RUC number yet
          if (!rucFileMap.has(rucNumber)) {
            rucFileMap.set(rucNumber, urlInfo);
          }
        }
      }

      this.log(`Organized ${rucFileMap.size} unique RUC files to download`);

      // Download each file and extract it
      const successfulDownloads: string[] = [];
      const failedDownloads: string[] = [];
      const processedDirs: string[] = [];

      for (const [rucNumber, urlInfo] of rucFileMap.entries()) {
        try {
          this.log(`Processing RUC${rucNumber} file...`);
          const zipPath = await this.downloadFile(urlInfo);
          const extractedDir = await this.extractZip(zipPath);
          processedDirs.push(extractedDir);
          successfulDownloads.push(rucNumber);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.log(`Error processing RUC${rucNumber}: ${errorMessage}`);
          failedDownloads.push(rucNumber);
        }
      }

      // Log summary
      this.log(
        `Download summary: ${successfulDownloads.length} successful, ${failedDownloads.length} failed`,
      );
      if (successfulDownloads.length > 0) {
        this.log(
          `Successfully processed RUC numbers: ${successfulDownloads.join(', ')}`,
        );
      }
      if (failedDownloads.length > 0) {
        this.log(
          `Failed to process RUC numbers: ${failedDownloads.join(', ')}`,
        );
      }

      // Procesar los archivos extraídos y guardarlos en la base de datos
      this.log('Iniciando procesamiento de datos para la base de datos...');
      for (const dir of processedDirs) {
        try {
          await this.processExtractedFiles(dir);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.log(`Error procesando directorio ${dir}: ${errorMessage}`);
        }
      }

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      this.log(
        `Completed RUC files download and extraction in ${duration} seconds`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Error in download process: ${errorMessage}`);
    }
  }
}
