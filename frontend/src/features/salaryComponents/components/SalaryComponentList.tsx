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
  onDelete: (id: string, name: string) => void;
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
            <Th isNumeric>Default Amount</Th>
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
                {component.default_amount != null ? component.default_amount.toFixed(2) : 'N/A'}
              </Td>
              <Td>{component.is_taxable ? 'Yes' : 'No'}</Td>
              <Td>
                {!component.is_system_defined ? (
                  <Switch
                    id={`active-switch-${component.id}`}
                    isChecked={component.is_active}
                    onChange={() => onToggleActive(component)}
                    colorScheme="green"
                  />
                ) : (
                  component.is_active ? 'Yes' : 'No'
                )}
              </Td>
              <Td>{component.is_system_defined ? 'System' : 'Custom'}</Td>
              <Td>
                {!component.is_system_defined && (
                  <Box display="flex" gap={2}>
                    <Button size="sm" colorScheme="blue" onClick={() => onEdit(component)}>
                      Edit
                    </Button>
                    <Button size="sm" colorScheme="red" onClick={() => onDelete(component.id, component.name)}>
                      Delete
                    </Button>
                  </Box>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default SalaryComponentList;