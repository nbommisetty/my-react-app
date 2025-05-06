// src/validation/validationConfigLoader.ts

import definitionsJson from './validationDefinitions.json'; // Reusable definitions (can also be fetched)

// Assuming types are exported from buildYupSchema.ts or defined globally/locally
import type { JsonFieldConfig, JsonDefinitions } from './buildYupSchema';

// Interface for the return type of our loader functions
export interface ValidationSetup {
  configSection: JsonFieldConfig;
  definitions: JsonDefinitions;
}

// --- Mock API Endpoint for demonstration ---
const MOCK_API_BASE_URL = '/api/validation-config'; // Example base URL

/**
 * Simulates fetching validation configuration for a specific form from a "database" via an API.
 * @param formKey The key identifying the form configuration (e.g., "wireTransferRequest").
 * @returns {Promise<JsonFieldConfig>} A promise that resolves to the form-specific validation rules.
 */
async function fetchFormSpecificConfigFromDB(formKey: string): Promise<JsonFieldConfig> {
  console.log(`Fetching validation config for: ${formKey}`);
  // In a real app, this would be an actual fetch call:
  // const response = await fetch(`${MOCK_API_BASE_URL}/${formKey}`);
  // if (!response.ok) {
  //   throw new Error(`Failed to fetch validation config for ${formKey}: ${response.statusText}`);
  // }
  // return await response.json() as JsonFieldConfig;

  // --- Mocking the fetch ---
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (formKey === 'wireTransferRequest') {
        // Simulate fetching the content of wireTransferValidationConfig.json
        const mockWireConfig = {
          beneficiaryName: {
            $ref: '#/definitions/nonEmptyString',
            maxLength: 100,
            errorMessageMaxLength: 'Beneficiary name cannot exceed {maxLength} characters.',
          },
          beneficiaryAccountNumber: {
            $ref: '#/definitions/accountNumber',
          },
          routingNumber: {
            type: 'string',
            required: true,
            pattern: '^[0-9]{9}$',
            errorMessageRequired: 'Routing number is required.',
            errorMessagePattern: 'Routing number must be exactly 9 digits.',
          },
          amount: {
            $ref: '#/definitions/positiveAmount',
          },
          currency: {
            type: 'string',
            required: true,
            allowedValues: ['USD', 'CAD', 'EUR', 'GBP'], // Example: GBP added via "DB"
            errorMessageRequired: 'Currency is required.',
            errorMessageAllowedValues: 'Invalid currency. Allowed: {allowedValues}.',
          },
          transferDate: {
            $ref: '#/definitions/validDate',
          },
          memo: {
            type: 'string',
            required: false,
            maxLength: 140,
            errorMessageMaxLength: 'Memo cannot exceed {maxLength} characters.',
          },
        };
        resolve(mockWireConfig as JsonFieldConfig);
      } else {
        reject(new Error(`No mock validation config found for key: ${formKey}`));
      }
    }, 1000); // Simulate network delay
  });
}

/**
 * Asynchronously retrieves the validation configuration section (from a "DB")
 * and definitions (local or also fetched) specifically for the Wire Transfer form.
 * @returns {Promise<ValidationSetup>} A promise that resolves to an object containing the configSection and definitions.
 */
export async function getWireTransferValidationSetup(): Promise<ValidationSetup> {
  try {
    const formKey = 'wireTransferRequest';
    const specificConfig = await fetchFormSpecificConfigFromDB(formKey);

    if (!definitionsJson.definitions) {
      throw new Error("'definitions' not found in local validationDefinitions.json");
    }

    return {
      configSection: specificConfig,
      definitions: definitionsJson.definitions as JsonDefinitions,
    };
  } catch (error) {
    console.error('Error fetching wire transfer validation setup:', error);
    // Depending on requirements, you might re-throw, or return a default/fallback config,
    // or a state that indicates an error to the consuming component.
    throw error; // Re-throw for the component to handle
  }
}

/**
 * Example for another form, if you had one, also fetching its specific config.
 */
// export async function getLoanApplicationValidationSetup(): Promise<ValidationSetup> {
//   try {
//     const formKey = 'loanApplication'; // Assuming this is the key for loan app config in DB
//     const specificConfig = await fetchFormSpecificConfigFromDB(formKey);
//
//     if (!definitionsJson.definitions) {
//       throw new Error("'definitions' not found in local validationDefinitions.json");
//     }
//
//     return {
//       configSection: specificConfig,
//       definitions: definitionsJson.definitions as JsonDefinitions,
//     };
//   } catch (error) {
//     console.error('Error fetching loan application validation setup:', error);
//     throw error;
//   }
// }
