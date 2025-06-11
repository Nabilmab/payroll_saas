// frontend/src/features/salaryComponents/components/SalaryComponentList.tsx
import React, { FC } from 'react';
import { SalaryComponent } from '../../../types';

// These imports should now work because of the ChakraProvider setup
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Text,
  Box,
  Switch
} from '@chakra-ui/react';

interface SalaryComponentListProps {
  components: SalaryComponent[];
  onEdit: (component: SalaryComponent) => void;
  onDelete: (id: string) => void;
  onToggleActive: (component: SalaryComponent) => void;
}

const SalaryComponentList: FC<SalaryComponentListProps> = ({ components, onEdit, onDelete, onToggleActive }) => {
  if (!components || components.length === 0) {
    return <Text mt="4">No salary components found. Create one to get started!</Text>;
  }

  return (
    <TableContainer borderWidth="1px" borderRadius="md" mt="4">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th isNumeric>Value</Th>
            <Th>Taxable</Th>
            <Th>Active</Th>
            <Th>Origin</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {components.map((component) => (
            <Tr key={component.id}>
              <Td>{component.name}</Td>
              <Td textTransform="capitalize">{component.type}</Td>
              <Td isNumeric>
                {(() => {
                  if (component.calculation_type === 'fixed' && component.amount != null) {
                    return component.amount.toFixed(2);
                  } else if (component.calculation_type === 'percentage' && component.percentage != null) {
                    return `${component.percentage.toFixed(2)}%`;
                  }
                  return 'N/A';
                })()}
              </Td>
              <Td>{component.is_taxable ? 'Yes' : 'No'}</Td>
              <Td>
                <Switch
                  id={`active-switch-${component.id}`}
                  isChecked={component.is_active}
                  onChange={() => onToggleActive(component)}
                  colorScheme="green"
                  isDisabled={component.is_system_defined}
                />
              </Td>
              <Td>{component.is_system_defined ? 'System' : 'Custom'}</Td>
              <Td>
                <Box display="flex" gap={2}>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => onEdit(component)}
                    isDisabled={component.is_system_defined}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => onDelete(component.id)}
                    isDisabled={component.is_system_defined}
                  >
                    Delete
                  </Button>
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default SalaryComponentList;