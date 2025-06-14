// --- START OF UPDATED FILE ---
// ---
// frontend/src/features/employees/components/SalarySettingModal.tsx
// ---
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Select, Input, VStack, useToast, NumberInput,
  NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper
} from '@chakra-ui/react';
import { SalaryComponent, EmployeeSalarySetting, SalarySettingFormData } from '../../../types';
import { fetchSalaryComponents } from '../../../services/salaryComponentApi';

interface SalarySettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SalarySettingFormData) => void;
  employeeId: string;
  settingToEdit?: EmployeeSalarySetting;
}

const SalarySettingModal: React.FC<SalarySettingModalProps> = ({ isOpen, onClose, onSave, employeeId, settingToEdit }) => {
  // ... (state declarations are the same) ...
  const [allComponents, setAllComponents] = useState<SalaryComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [percentage, setPercentage] = useState<number | undefined>(undefined);
  const toast = useToast();

  useEffect(() => {
    const loadComponents = async () => {
      try {
        const components = await fetchSalaryComponents();
        setAllComponents(components.filter(c => !c.is_system_defined || c.calculation_type !== 'formula'));
      } catch (error) {
        toast({
          title: 'Failed to load components',
          description: 'Could not load salary component templates.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    if (isOpen) {
      loadComponents();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (settingToEdit && isOpen) {
      // FIX: Use camelCase properties to match the corrected type definition
      setSelectedComponentId(settingToEdit.salaryComponentId);
      setEffectiveDate(new Date(settingToEdit.effectiveDate).toISOString().split('T')[0]);
      setAmount(settingToEdit.amount ?? undefined);
      setPercentage(settingToEdit.percentage ?? undefined);
    } else {
      setSelectedComponentId('');
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setAmount(undefined);
      setPercentage(undefined);
    }
  }, [settingToEdit, isOpen]);

  // ... (the rest of the component is the same) ...
  const selectedComponentTemplate = allComponents.find(c => c.id === selectedComponentId);
  const calculationType = selectedComponentTemplate?.calculation_type;

  const handleSave = () => {
    if (!selectedComponentId) {
      toast({ title: 'Please select a component.', status: 'warning', duration: 3000 });
      return;
    }

    const formData: SalarySettingFormData = {
      id: settingToEdit?.id,
      salaryComponentId: selectedComponentId,
      effectiveDate,
      amount: calculationType === 'fixed' ? amount : null,
      percentage: calculationType === 'percentage' ? percentage : null,
    };
    onSave(formData);
  };

  const isSaveDisabled = !selectedComponentId ||
    (calculationType === 'fixed' && (amount === undefined || amount === null)) ||
    (calculationType === 'percentage' && (percentage === undefined || percentage === null));

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{settingToEdit ? 'Edit' : 'Add'} Salary Setting</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Salary Component</FormLabel>
              <Select
                placeholder="Select component"
                value={selectedComponentId}
                onChange={(e) => setSelectedComponentId(e.target.value)}
                isDisabled={!!settingToEdit}
              >
                {allComponents.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </Select>
            </FormControl>

            {calculationType === 'fixed' && (
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <NumberInput
                  value={amount ?? ''}
                  onChange={(_valStr, valNum) => setAmount(isNaN(valNum) ? undefined : valNum)}
                  min={0}
                >
                  <NumberInputField placeholder="Enter fixed amount" />
                  <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}

            {calculationType === 'percentage' && (
              <FormControl isRequired>
                <FormLabel>Percentage (%)</FormLabel>
                <NumberInput
                  value={percentage ?? ''}
                  onChange={(_valStr, valNum) => setPercentage(isNaN(valNum) ? undefined : valNum)}
                  min={0} max={100} precision={2}
                >
                  <NumberInputField placeholder="Enter percentage (e.g., 10 for 10%)" />
                  <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}

            <FormControl isRequired>
              <FormLabel>Effective Date</FormLabel>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="teal" onClick={handleSave} isDisabled={isSaveDisabled}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SalarySettingModal;