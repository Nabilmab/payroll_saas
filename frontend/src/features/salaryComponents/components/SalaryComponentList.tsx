// frontend/src/features/salaryComponents/components/SalaryComponentList.tsx
import React, { FC } from 'react';
import { SalaryComponent } from '../../../types';
import formatFinancialValue from '../../../utils/formatAmount'; // Unchanged import

import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Text, Box, Switch, Badge, Tooltip, IconButton,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';

interface SalaryComponentListProps {
  components: SalaryComponent[];
  onEdit: (component: SalaryComponent) => void;
  onDelete: (id: string) => void;
  onToggleActive: (component: SalaryComponent) => void;
}

const SalaryComponentList: FC<SalaryComponentListProps> = ({ components, onEdit, onDelete, onToggleActive }) => {
  // In a real app, you'd get these from a global context/store, e.g.:
  // const { currentUser } = useAuth();
  // const locale = currentUser.tenant.jurisdiction.locale;
  // const currency = currentUser.tenant.jurisdiction.currency;
  const locale = 'fr-MA'; // Simulating for now
  const currency = 'MAD';   // Simulating for now

  if (!components || components.length === 0) {
    return null;
  }

  return (
    <TableContainer bg="white" boxShadow="sm" borderRadius="lg" p={4}>
      <Table variant="simple" size="md">
        <Thead bg="gray.50">
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Calculation</Th>
            <Th>Value</Th>
            <Th>Taxable</Th>
            <Th>Status</Th>
            <Th>Origin</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {components.map((component) => (
            <Tr key={component.id} _hover={{ bg: "gray.50" }}>
              <Td>
                <Text fontWeight="medium">{component.name}</Text>
                {component.description && <Text fontSize="sm" color="gray.500">{component.description}</Text>}
              </Td>
              <Td>
                <Badge
                  colorScheme={component.type === 'earning' ? 'green' : 'red'}
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
                </Badge>
              </Td>
              <Td textTransform="capitalize">
                {component.calculation_type ? component.calculation_type.replace('_', ' ') : 'N/A'}
              </Td>
              <Td fontWeight="medium">
                {component.calculation_type === 'formula'
                  ? 'Formula'
                  : formatFinancialValue(
                      component.calculation_type === 'fixed' ? component.amount : component.percentage,
                      component.calculation_type,
                      // ACTION: Pass the locale and currency to the formatter
                      locale,
                      currency
                    )}
              </Td>
              <Td>{component.is_taxable ? 'Yes' : 'No'}</Td>
              <Td>
                {!component.is_system_defined ? (
                  <Tooltip label={component.is_active ? "Deactivate Component" : "Activate Component"} placement="top">
                    <Switch
                      id={`active-switch-${component.id}`}
                      isChecked={component.is_active}
                      onChange={() => onToggleActive(component)}
                      colorScheme="teal"
                      size="md"
                    />
                  </Tooltip>
                ) : (
                  <Badge
                    colorScheme={component.is_active ? 'teal' : 'gray'}
                    variant="solid"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {component.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </Td>
              <Td>
                <Badge
                  colorScheme={component.is_system_defined ? 'blue' : 'purple'}
                  variant="outline"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {component.is_system_defined ? 'System' : 'Custom'}
                </Badge>
              </Td>
              <Td>
                <Box display="flex" gap={2}>
                  <Tooltip label="Edit Component" placement="top">
                    <IconButton
                      aria-label="Edit"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => onEdit(component)}
                      isDisabled={component.is_system_defined}
                    />
                  </Tooltip>
                  <Tooltip label="Delete Component" placement="top">
                    <IconButton
                      aria-label="Delete"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => onDelete(component.id)}
                      isDisabled={component.is_system_defined}
                    />
                  </Tooltip>
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