// src/components/WireTransferForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { SubmitHandler, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Import the async setup function from your validation folder
import { getWireTransferValidationSetup } from '../validation/validationConfigLoader';
import type { ValidationSetup } from '../validation/validationConfigLoader'; // Import the interface
import { buildYupSchema } from '../validation/buildYupSchema';
import type { JsonFieldConfig } from '../validation/buildYupSchema'; // Assuming this type is exported

// --- Type Definitions ---
interface WireTransferFormData {
  beneficiaryName: string;
  beneficiaryAccountNumber: string;
  routingNumber: string;
  amount: number | '';
  currency: string;
  transferDate: string;
  memo?: string;
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  name: keyof WireTransferFormData;
  label: string;
  register: UseFormRegister<WireTransferFormData>;
  errors: FieldErrors<WireTransferFormData>;
  options?: string[];
}

interface SubmitStatus {
  type: 'success' | 'error';
  message: string;
}

const InputField: React.FC<InputFieldProps> = ({ name, label, register, errors, type = "text", options, ...rest }) => (
  <div className="mb-6">
    <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-900">
      {label}
    </label>
    {type === "select" ? (
      <select
        id={name}
        {...register(name)}
        className={`bg-gray-50 border ${errors[name] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} text-gray-900 text-sm rounded-lg block w-full p-2.5`}
        {...rest}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : type === "textarea" ? (
      <textarea
        id={name}
        {...register(name)}
        rows={3}
        className={`bg-gray-50 border ${errors[name] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} text-gray-900 text-sm rounded-lg block w-full p-2.5`}
        {...rest}
      />
    ) : (
      <input
        type={type}
        id={name}
        {...register(name)}
        className={`bg-gray-50 border ${errors[name] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} text-gray-900 text-sm rounded-lg block w-full p-2.5`}
        {...rest}
      />
    )}
    {errors[name] && <p className="mt-2 text-xs text-red-600">{errors[name]?.message}</p>}
  </div>
);


const WireTransferForm: React.FC = (): JSX.Element => {
  const [validationSchema, setValidationSchema] = useState<yup.ObjectSchema<WireTransferFormData> | null>(null);
  const [formConfigSection, setFormConfigSection] = useState<JsonFieldConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const loadValidation = async () => {
      try {
        setIsLoadingConfig(true);
        setConfigError(null);
        const { configSection, definitions } = await getWireTransferValidationSetup();
        const schema = buildYupSchema(configSection, definitions) as yup.ObjectSchema<WireTransferFormData>;
        setValidationSchema(schema);
        setFormConfigSection(configSection); // Store for dynamic parts like dropdown options
      } catch (error: any) {
        console.error("Failed to load validation configuration:", error);
        setConfigError(error.message || "Could not load form configuration.");
        // Optionally set a fallback schema or disable the form
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadValidation();
  }, []); // Empty dependency array: load config once on mount

  const { register, handleSubmit, formState: { errors, isSubmitting, isValid }, reset } = useForm<WireTransferFormData>({
    resolver: validationSchema ? yupResolver(validationSchema) : undefined, // Pass resolver only when schema is ready
    mode: 'onTouched', // Or 'onChange' for more immediate feedback
    defaultValues: {
        beneficiaryName: '',
        beneficiaryAccountNumber: '',
        routingNumber: '',
        amount: '',
        currency: '',
        transferDate: '',
        memo: ''
    }
  });

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);

  const onSubmit: SubmitHandler<WireTransferFormData> = async (data) => {
    setSubmitStatus(null);
    console.log('Form Data:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (typeof data.amount === 'number' && data.amount > 500000) {
         setSubmitStatus({ type: 'error', message: 'Simulated backend error: Amount too high for this demo.' });
    } else {
        setSubmitStatus({ type: 'success', message: 'Wire transfer initiated successfully! (Demo)' });
        reset();
    }
  };

  const currencyAllowedValues = useMemo(() => {
    if (formConfigSection?.currency && Array.isArray(formConfigSection.currency.allowedValues)) {
      return formConfigSection.currency.allowedValues as string[];
    }
    return [];
  }, [formConfigSection]); // Recompute if formConfigSection changes


  if (isLoadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
        <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-semibold mb-4">Error</h2>
            <p>{configError}</p>
            <p className="mt-2 text-sm text-gray-600">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  // Only render the form if the schema is loaded
  if (!validationSchema) {
      // This case might be hit briefly if config loads but schema isn't set in the same render cycle,
      // or if configError is not set but schema somehow fails to build.
      // A more robust loading state might be needed if this flicker is an issue.
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
            <p className="text-xl">Preparing form...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">
          Initiate Wire Transfer
        </h1>

        {submitStatus && (
          <div className={`p-4 mb-6 rounded-md text-sm ${
            submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* InputFields remain the same */}
          <InputField name="beneficiaryName" label="Beneficiary Name" register={register} errors={errors} placeholder="John Doe"/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField name="beneficiaryAccountNumber" label="Beneficiary Account Number" register={register} errors={errors} placeholder="123456789"/>
            <InputField name="routingNumber" label="Routing Number (ABA)" register={register} errors={errors} placeholder="987654321"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField name="amount" label="Amount" type="number" register={register} errors={errors} placeholder="1000.00" step="0.01"/>
            <InputField name="currency" label="Currency" type="select" register={register} errors={errors} options={currencyAllowedValues}/>
          </div>
          <InputField name="transferDate" label="Transfer Date" type="date" register={register} errors={errors} min={new Date().toISOString().split("T")[0]}/>
          <InputField name="memo" label="Memo (Optional)" type="textarea" register={register} errors={errors} placeholder="Payment for invoice #123"/>

          <button
            type="submit"
            // Changed: Button is now only disabled when isSubmitting is true.
            // This means it will be enabled even if the form is invalid or schema is not loaded.
            // Consider the UX implications of this change.
            disabled={isSubmitting}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            {isSubmitting ? (
                <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </div>
            ) : "Submit Transfer"}
          </button>
        </form>
      </div>
       <footer className="text-center mt-8 text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} Secure Wire Transfers Inc. All rights reserved.</p>
        <p className="text-xs mt-1">This is a demo application. Do not enter real financial information.</p>
      </footer>
    </div>
  );
}

export default WireTransferForm;
