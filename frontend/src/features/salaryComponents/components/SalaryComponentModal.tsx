// frontend/src/features/salaryComponents/components/SalaryComponentModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Textarea, // Added for description
  VStack,   // Added for layout
  NumberInput, // For numeric inputs
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
// Adjust the import path if your types file is, e.g., src/types/index.ts or src/types/salaryComponent.ts
import { SalaryComponent, SalaryComponentFormData } from '../../../types';

interface SalaryComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SalaryComponentFormData) => void;
  component?: SalaryComponent; // This is the component being edited, if any
}

const SalaryComponentModal: React.FC<SalaryComponentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  component,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'earning' | 'deduction'>('earning');
  const [calculationType, setCalculationType] = useState<'fixed' | 'percentage'>('fixed');
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [percentage, setPercentage] = useState<number | undefined>(undefined);
  const [isTaxable, setIsTaxable] = useState(false);
  const [payslipDisplayOrder, setPayslipDisplayOrder] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen) { // Only update form when modal is opened or component changes
      if (component) {
        setName(component.name);
        setDescription(component.description || '');
        setType(component.type);
        if (component.calculation_type === 'fixed' || component.calculation_type === 'percentage') {
          setCalculationType(component.calculation_type);
        } else {
          // Default to 'fixed' if backend sends 'formula', as modal doesn't support it yet
          setCalculationType('fixed');
        }
        setAmount(component.calculation_type === 'fixed' ? (component.amount ?? undefined) : undefined);
        setPercentage(component.calculation_type === 'percentage' ? (component.percentage ?? undefined) : undefined);
        setIsTaxable(component.is_taxable);
        setPayslipDisplayOrder(component.payslip_display_order ?? undefined);
      } else {
        // Reset form for "Add New"
        setName('');
        setDescription('');
        setType('earning');
        setCalculationType('fixed');
        setAmount(undefined);
        setPercentage(undefined);
        setIsTaxable(false);
        setPayslipDisplayOrder(undefined);
      }
    }
  }, [component, isOpen]); // Rerun effect if component or isOpen changes

  const handleSubmit = () => {
    const formData: SalaryComponentFormData = {
      // id: component?.id, // ID should not be part of FormData for create/update like this. Backend handles ID.
      // If it's for update, the ID is usually passed separately or as a URL param.
      // For now, assuming onSave knows if it's an update via the presence of 'component' prop.
      name,
      description: description.trim() === '' ? null : description.trim(),
      type,
      calculation_type: calculationType,
      is_taxable: isTaxable,
      payslip_display_order: payslipDisplayOrder,
      // amount and percentage are added conditionally below
    };

    if (calculationType === 'fixed') {
      formData.amount = amount ?? null;
      formData.percentage = null;
    } else if (calculationType === 'percentage') {
      formData.percentage = percentage ?? null;
      formData.amount = null;
    }

    onSave(formData);
    onClose();
  };

  const handleCalculationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCalcType = e.target.value as 'fixed' | 'percentage';
    setCalculationType(newCalcType);
    if (newCalcType === 'fixed') {
      setPercentage(undefined);
    } else {
      setAmount(undefined);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {component ? 'Edit Salary Component' : 'Add New Salary Component'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="e.g., Basic Salary, House Rent Allowance"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                placeholder="Brief description of the component"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Type</FormLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as 'earning' | 'deduction')}
              >
                <option value="earning">Earning</option>
                <option value="deduction">Deduction</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Calculation Type</FormLabel>
              <Select
                value={calculationType}
                onChange={handleCalculationTypeChange}
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
                {/* <option value="formula" disabled>Formula (Coming Soon)</option> */}
              </Select>
            </FormControl>

            {calculationType === 'fixed' && (
              <FormControl isRequired>
                <FormLabel>Default Amount</FormLabel>
                 <NumberInput
                    value={amount === undefined || amount === null ? '' : amount}
                    onChange={(_valueAsString, valueAsNumber) => setAmount(isNaN(valueAsNumber) ? undefined : valueAsNumber)}
                    min={0}
                  >
                    <NumberInputField placeholder="Enter fixed amount" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
              </FormControl>
            )}

            {calculationType === 'percentage' && (
              <FormControl isRequired>
                <FormLabel>Default Percentage (%)</FormLabel>
                 <NumberInput
                    value={percentage === undefined || percentage === null ? '' : percentage}
                    onChange={(_valueAsString, valueAsNumber) => setPercentage(isNaN(valueAsNumber) ? undefined : valueAsNumber)}
                    min={0} max={100} precision={2} step={0.01} // Max 100%
                  >
                    <NumberInputField placeholder="Enter percentage (e.g., 10 for 10%)" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Payslip Display Order (Optional)</FormLabel>
              <NumberInput
                value={payslipDisplayOrder === undefined || payslipDisplayOrder === null ? '' : payslipDisplayOrder}
                onChange={(_valueAsString, valueAsNumber) => setPayslipDisplayOrder(isNaN(valueAsNumber) ? undefined : valueAsNumber)}
                min={0}
              >
                <NumberInputField placeholder="e.g., 1, 10, 100" />
                 <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Checkbox
                isChecked={isTaxable}
                onChange={(e) => setIsTaxable(e.target.checked)}
                mr={2}
              />
              <FormLabel mb="0">
                Is this component taxable?
              </FormLabel>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
            isDisabled={
              !name.trim() ||
              (calculationType === 'fixed' && (amount === undefined || amount === null)) ||
              (calculationType === 'percentage' && (percentage === undefined || percentage === null))
            }
          >
            Save Component
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SalaryComponentModal;
