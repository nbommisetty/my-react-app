// src/buildYupSchema.ts
import * as yup from 'yup';
import { parseISO, isFuture, startOfDay, isEqual as isEqualDates, isValid as isValidDateFns } from 'date-fns';
import { isPublicHoliday, isWeekend } from './holidays'; // Import holiday checking functions

// --- Type Definitions for JSON Configuration ---

interface JsonRule {
  type: 'string' | 'number' | 'date' | 'boolean';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedValues?: string[] | number[];
  minValue?: number;
  maxValue?: number;
  customRule?: string;
  minDate?: 'today' | string;
  errorMessageRequired?: string;
  errorMessageMinLength?: string;
  errorMessageMaxLength?: string;
  errorMessagePattern?: string;
  errorMessageAllowedValues?: string;
  errorMessageType?: string;
  errorMessageMinValue?: string;
  errorMessageMaxValue?: string;
  errorMessageMinDate?: string;
  errorMessageCustomRule?: string;
  $ref?: string;
}

export interface JsonFieldConfig {
  [fieldName: string]: JsonRule;
}

export interface JsonDefinitions {
  [definitionName: string]: JsonRule;
}

// --- Yup Schema Builder Function ---

export function buildYupSchema(
  configSection: JsonFieldConfig,
  definitions: JsonDefinitions = {}
): yup.ObjectSchema<any> {
  let schemaObjectShape: yup.ObjectShape = {};

  for (const fieldName in configSection) {
    let rules: JsonRule = { ...configSection[fieldName] };

    if (rules.$ref && definitions) {
      const refPath = rules.$ref.replace('#/definitions/', '');
      if (definitions[refPath]) {
        rules = { ...definitions[refPath], ...rules };
        delete rules.$ref;
      } else {
        console.warn(`Validation definition not found for $ref: ${rules.$ref}`);
        continue;
      }
    }

    let fieldValidator: yup.AnySchema | undefined;
    const requiredMessage = rules.errorMessageRequired || `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;

    let baseValidator = yup.mixed(); // Start with mixed for all types to handle required/optional first

    switch (rules.type) {
      case 'string':
        if (rules.required) {
          baseValidator = baseValidator
            .transform(value => (typeof value === 'string' && value.trim() === "") || value === null || value === undefined ? undefined : value)
            .required(requiredMessage);
        } else {
          baseValidator = baseValidator
            .transform(value => (typeof value === 'string' && value.trim() === "") || value === null || value === undefined ? null : value)
            .nullable();
        }

        fieldValidator = baseValidator.test({
          name: `is-string-and-valid-${fieldName}`,
          test: (value, ctx) => {
            if (value === null || value === undefined) return true; // Already handled by required/nullable

            let tempStringValidator = yup.string().typeError(rules.errorMessageType || 'Invalid value, must be a string.');
            
            // Apply trim before further string validations
            const trimmedValue = typeof value === 'string' ? value.trim() : value;


            if (rules.minLength !== undefined) {
              tempStringValidator = tempStringValidator.min(rules.minLength, (rules.errorMessageMinLength || 'Minimum length is {minLength}').replace('{minLength}', String(rules.minLength)));
            }
            if (rules.maxLength !== undefined) {
              tempStringValidator = tempStringValidator.max(rules.maxLength, (rules.errorMessageMaxLength || 'Maximum length is {maxLength}').replace('{maxLength}', String(rules.maxLength)));
            }
            if (rules.pattern) {
              try {
                tempStringValidator = tempStringValidator.matches(new RegExp(rules.pattern), rules.errorMessagePattern || 'Invalid format');
              } catch (e) { console.error(`Invalid regex pattern for field ${fieldName}: ${rules.pattern}`, e); }
            }
            if (rules.allowedValues && Array.isArray(rules.allowedValues)) {
              tempStringValidator = tempStringValidator.oneOf(rules.allowedValues as string[], (rules.errorMessageAllowedValues || 'Must be one of: {allowedValues}').replace('{allowedValues}', rules.allowedValues.join(', ')));
            }
            
            try {
              tempStringValidator.validateSync(trimmedValue); // Validate the (potentially trimmed) value
              return true;
            } catch (err: any) {
              return ctx.createError({ message: err.message });
            }
          }
        });
        break;

      case 'number':
        if (rules.required) {
          baseValidator = baseValidator
            .transform(value => (value === "" || value === null || value === undefined ? undefined : value))
            .required(requiredMessage);
        } else {
          baseValidator = baseValidator
            .transform(value => (value === "" || value === null || value === undefined ? null : value))
            .nullable();
        }

        fieldValidator = baseValidator.test({
          name: `is-number-and-valid-${fieldName}`,
          test: (value, ctx) => {
            if (value === null || value === undefined) return true; // Handled by required/nullable

            let tempNumValidator = yup.number().typeError(rules.errorMessageType || 'Must be a valid number');
            if (rules.minValue !== undefined) {
              tempNumValidator = tempNumValidator.min(rules.minValue, (rules.errorMessageMinValue || 'Minimum value is {minValue}').replace('{minValue}', String(rules.minValue)));
            }
            if (rules.maxValue !== undefined) {
              tempNumValidator = tempNumValidator.max(rules.maxValue, (rules.errorMessageMaxValue || 'Maximum value is {maxValue}').replace('{maxValue}', String(rules.maxValue)));
            }

            try {
              tempNumValidator.validateSync(value);
              return true;
            } catch (err: any) {
              return ctx.createError({ message: err.message });
            }
          }
        });
        break;

      case 'date':
        let dateBaseStringValidator: yup.MixedSchema = yup.mixed();

        if (rules.required) {
            dateBaseStringValidator = dateBaseStringValidator
                .transform(value => (value === "" || value === null || value === undefined ? undefined : value)) // Treat empty string as undefined for required
                .required(requiredMessage);
        } else {
            dateBaseStringValidator = dateBaseStringValidator
                .transform(value => (value === "" || value === null || value === undefined ? null : value)) // Treat empty string as null for optional
                .nullable();
        }
        
        fieldValidator = dateBaseStringValidator.test({
            name: `is-date-and-valid-${fieldName}`,
            test: (value, ctx) => {
                if (value === null || value === undefined) return true; // Handled by required/nullable

                // Value should be a string here if provided, or it's an error from previous transform if not string/null/undefined
                if (typeof value !== 'string') {
                     // This case should ideally not be hit if transforms are correct, but as a safeguard:
                     return ctx.createError({ message: rules.errorMessageType || 'Date must be a valid string input.' });
                }

                const parsedDate = parseISO(value);
                if (!isValidDateFns(parsedDate)) {
                    return ctx.createError({ message: rules.errorMessageType || 'Please enter a valid date.' });
                }

                let tempDateValidator = yup.date(); // Base for date-specific rules

                if (rules.minDate === 'today') {
                    tempDateValidator = tempDateValidator.min(startOfDay(new Date()), rules.errorMessageMinDate || 'Date cannot be in the past.');
                }
                // Add more specific date string minDate logic if needed (e.g., rules.minDate = "2025-01-01")

                if (rules.customRule === 'noWeekendOrHoliday') {
                    if (isWeekend(parsedDate) || isPublicHoliday(parsedDate)) {
                        return ctx.createError({ message: rules.errorMessageCustomRule || 'Date cannot be a weekend or public holiday.' });
                    }
                }
                
                try {
                    // We've already parsed and validated the date object (parsedDate)
                    // The tempDateValidator here is more for applying chained rules like min/max on Date objects
                    // For custom rules like noWeekendOrHoliday, we check directly.
                    // If minDate was the only yup date rule, we can simplify.
                    // Let's ensure minDate is checked via yup's mechanism if present.
                    let finalDateCheckSchema = yup.date().typeError(rules.errorMessageType || 'Please enter a valid date.'); // Should not hit if parseISO worked
                     if (rules.minDate === 'today') {
                        finalDateCheckSchema = finalDateCheckSchema.min(startOfDay(new Date()), rules.errorMessageMinDate || 'Date cannot be in the past.');
                     }
                    finalDateCheckSchema.validateSync(parsedDate); // Validate the Date object
                    return true;
                } catch (err: any) {
                    return ctx.createError({ message: err.message });
                }
            }
        });
        break;
      
      default:
        console.warn(`Unsupported validation type "${rules.type}" for field "${fieldName}". Using mixed().`);
        let mixedValidatorDefault = yup.mixed();
        if (rules.required) {
            mixedValidatorDefault = mixedValidatorDefault
                .transform(value => (value === "" || value === null || value === undefined ? undefined : value))
                .required(requiredMessage);
        } else {
            mixedValidatorDefault = mixedValidatorDefault
                .transform(value => (value === "" || value === null || value === undefined ? null : value))
                .nullable();
        }
        fieldValidator = mixedValidatorDefault;
    }

    if (fieldValidator) {
      schemaObjectShape[fieldName] = fieldValidator;
    }
  }
  return yup.object().shape(schemaObjectShape);
}
