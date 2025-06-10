import React from 'react';
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
} from '@chakra-ui/react';

interface SalaryComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: any) => void; // Replace 'any' with a more specific type
  component?: any; // Replace 'any' with a more specific type
}

const SalaryComponentModal: React.FC<SalaryComponentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  component,
}) => {
  // State for form fields - initialize with component data if editing
  const [name, setName] = React.useState(component?.name || '');
  const [type, setType] = React.useState(component?.type || 'earning');
  const [calculationType, setCalculationType] = React.useState(
    component?.calculationType || 'fixed'
  );
  const [value, setValue] = React.useState(component?.value || '');
  const [isTaxable, setIsTaxable] = React.useState(component?.isTaxable || false);
  const [isCalculatedInCtc, setIsCalculatedInCtc] = React.useState(
    component?.isCalculatedInCtc || false
  );

  const handleSubmit = () => {
    const newComponent = {
      name,
      type,
      calculationType,
      value: parseFloat(value), // Ensure value is a number
      isTaxable,
      isCalculatedInCtc,
      // Add other fields as necessary
    };
    onSave(newComponent);
    onClose(); // Close modal after saving
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {component ? 'Edit Salary Component' : 'Add Salary Component'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              placeholder="Enter component name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
          </FormControl>

          <FormControl mt={4} isRequired>
            <FormLabel>Type</FormLabel>
            <Select
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setType(e.target.value)
              }
              placeholder="Select type"
            >
              <option value="earning">Earning</option>
              <option value="deduction">Deduction</option>
            </Select>
          </FormControl>

          <FormControl mt={4} isRequired>
            <FormLabel>Calculation Type</FormLabel>
            <Select
              value={calculationType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCalculationType(e.target.value)
              }
              placeholder="Select calculation type"
            >
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
              {/* Add other calculation types as needed */}
            </Select>
          </FormControl>

          <FormControl mt={4} isRequired>
            <FormLabel>Value</FormLabel>
            <Input
              type="number"
              placeholder="Enter value"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value)
              }
            />
          </FormControl>

          <FormControl mt={4}>
            <Checkbox
              isChecked={isTaxable}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIsTaxable(e.target.checked)
              }
            >
              Taxable
            </Checkbox>
          </FormControl>

          <FormControl mt={4}>
            <Checkbox
              isChecked={isCalculatedInCtc}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIsCalculatedInCtc(e.target.checked)
              }
            >
              Calculated in CTC
            </Checkbox>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SalaryComponentModal;
