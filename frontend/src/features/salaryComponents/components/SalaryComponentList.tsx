import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  useDisclosure, // For managing modal state
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import SalaryComponentModal from './SalaryComponentModal'; // Import the modal

// Define a type for salary components (replace 'any' with this type)
interface SalaryComponent {
  id: string; // Or number, depending on your data
  name: string;
  type: 'earning' | 'deduction';
  calculationType: 'fixed' | 'percentage'; // Add other types if any
  value: number;
  isTaxable: boolean;
  isCalculatedInCtc: boolean;
  // Add other relevant fields
}

interface SalaryComponentListProps {
  components: SalaryComponent[];
  onEdit: (component: SalaryComponent) => void;
  onDelete: (id: string) => void; // Or number, depending on your data
  onAddNew: (component: SalaryComponent) => void; // For adding a new component
}

const SalaryComponentList: React.FC<SalaryComponentListProps> = ({
  components,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure(); // Hook for modal state
  const [editingComponent, setEditingComponent] = React.useState<SalaryComponent | undefined>(undefined);

  const handleEdit = (component: SalaryComponent) => {
    setEditingComponent(component);
    onOpen(); // Open modal for editing
  };

  const handleAddNew = () => {
    setEditingComponent(undefined); // Ensure no component data is pre-filled
    onOpen(); // Open modal for adding
  };

  const handleSave = (componentData: any) => { // Consider a more specific type than 'any'
    if (editingComponent) {
      onEdit({ ...editingComponent, ...componentData }); // Merge and save
    } else {
      onAddNew(componentData); // Save as new component
    }
    onClose(); // Close modal after saving
  };

  return (
    <>
      <Button onClick={handleAddNew} colorScheme="blue" mb={4}>
        Add New Component
      </Button>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Calculation Type</Th>
            <Th isNumeric>Value</Th>
            <Th>Taxable</Th>
            <Th>In CTC</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {components.map((component) => (
            <Tr key={component.id}>
              <Td>{component.name}</Td>
              <Td>{component.type}</Td>
              <Td>{component.calculationType}</Td>
              <Td isNumeric>{component.value}</Td>
              <Td>{component.isTaxable ? 'Yes' : 'No'}</Td>
              <Td>{component.isCalculatedInCtc ? 'Yes' : 'No'}</Td>
              <Td>
                <IconButton
                  aria-label="Edit component"
                  icon={<EditIcon />}
                  onClick={() => handleEdit(component)}
                  mr={2}
                />
                <IconButton
                  aria-label="Delete component"
                  icon={<DeleteIcon />}
                  onClick={() => onDelete(component.id)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Modal for Add/Edit */}
      <SalaryComponentModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        component={editingComponent}
      />
    </>
  );
};

export default SalaryComponentList;
