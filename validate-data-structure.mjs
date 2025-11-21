#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { DeputadoResumoSchema } from './packages/shared/dist/schemas/deputado.schema.js';
import { FornecedorResumoSchema } from './packages/shared/dist/schemas/fornecedor.schema.js';

/**
 * Data Structure Validation Script (ESM Version)
 * Validates that the main cache files used by the frontend server actions
 * conform to the Zod schemas defined in the shared package.
 */

const CACHE_DIR = path.resolve(process.cwd(), 'bancoDados', 'monitordespesas', 'congressoNacional', 'cache');

class DataValidator {
  constructor() {
    this.results = [];
  }

  async validate() {
    console.log('🚀 Starting data structure validation using Zod schemas...');
    
    await this.validateFile(
      'deputados-cache.json',
      DeputadoResumoSchema.array(),
      (data) => data.deputados
    );

    await this.validateFile(
      'suppliers-cache.json',
      FornecedorResumoSchema.array(),
      (data) => data.fornecedores
    );

    this.printReport();

    if (this.results.some(r => !r.success)) {
      console.error('\n❌ Validation failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All validations passed successfully!');
    }
  }

  async validateFile(fileName, schema, dataExtractor) {
    const filePath = path.join(CACHE_DIR, fileName);
    console.log(`\n🔍 Validating ${fileName}...`);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      const dataToValidate = dataExtractor(jsonData);

      if (!dataToValidate || !Array.isArray(dataToValidate)) {
        throw new Error(`Could not extract a data array from ${fileName}.`);
      }

      const result = schema.safeParse(dataToValidate);

      if (result.success) {
        this.results.push({
          file: fileName,
          success: true,
          count: dataToValidate.length,
        });
      } else {
        this.results.push({
          file: fileName,
          success: false,
          errors: result.error.issues,
        });
      }
    } catch (error) {
      this.results.push({
        file: fileName,
        success: false,
        errors: [{ message: `Failed to read or parse file: ${error.message}` }],
      });
    }
  }

  printReport() {
    console.log('\n📊 DATA STRUCTURE VALIDATION REPORT');
    console.log('=====================================');

    for (const result of this.results) {
      if (result.success) {
        console.log(`✅ ${result.file}: PASSED (${result.count} records validated)`);
      } else {
        console.log(`❌ ${result.file}: FAILED`);
        for (const error of result.errors) {
          const path = error.path?.join('.') || 'N/A';
          console.log(`  - Path: ${path}`);
          console.log(`    Error: ${error.message}`);
        }
      }
    }
  }
}

const validator = new DataValidator();
validator.validate().catch(console.error);
