// frontend/src/features/salaryComponents/pages/SalaryComponentsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // ACTION: Import useTranslation
import { Box, Heading, Button, useDisclosure, useToast, Spinner, Text, Flex } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import SalaryComponentList from '../components/SalaryComponentList';
import SalaryComponentModal from '../components/SalaryComponentModal';
import { SalaryComponent, SalaryComponentFormData } from '../../../types';
import {
  fetchSalaryComponents,
  addSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
  toggleSalaryComponentActive,
} from '../../../services/salaryComponentApi';

const SalaryComponentsPage: React.FC = () => {
  const { t } = useTranslation(); // ACTION: Initialize t function
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | undefined>(undefined);

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const toast = useToast();

  const loadComponents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSalaryComponents();
      setComponents(data);
    } catch (err: any) {
      const errorMessage = err?.message || t('salaryComponents.loadingErrorDesc');
      setError(errorMessage);
      toast({
        title: t('salaryComponents.loadingError'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]); // ACTION: Add t to dependency array

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  const handleOpenAddModal = () => {
    setEditingComponent(undefined);
    onModalOpen();
  };

  const handleOpenEditModal = (componentToEdit: SalaryComponent) => {
    setEditingComponent(componentToEdit);
    onModalOpen();
  };

  const handleSaveComponent = async (data: SalaryComponentFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      let savedComponent;
      if (data.id) {
        savedComponent = await updateSalaryComponent(data.id, data);
        toast({
          title: t('salaryComponents.updateSuccess'),
          description: t('salaryComponents.updateSuccessDesc', { name: savedComponent.name }),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        savedComponent = await addSalaryComponent(data);
        toast({
          title: t('salaryComponents.addSuccess'),
          description: t('salaryComponents.addSuccessDesc', { name: savedComponent.name }),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onModalClose();
      await loadComponents();
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || (data.id ? t('salaryComponents.updateFail') : t('salaryComponents.addFail'));
      setError(errorMessage);
      toast({
        title: data.id ? t('salaryComponents.updateFail') : t('salaryComponents.addFail'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (componentToToggle: SalaryComponent) => {
    // This function logic remains the same, but toasts could be translated too.
    setIsLoading(true);
    setError(null);
    try {
      const updatedComponent = await toggleSalaryComponentActive(componentToToggle);
      setComponents((prevComponents) =>
        prevComponents.map((c) => (c.id === updatedComponent.id ? updatedComponent : c))
      );
      toast({
        title: 'Status Updated',
        description: `Component ${updatedComponent.name} is now ${updatedComponent.is_active ? 'active' : 'inactive'}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'Failed to update component status.';
      setError(errorMessage);
      toast({
        title: 'Status Update Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('salaryComponents.deleteConfirm'))) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await deleteSalaryComponent(id);
      setComponents((prevComponents) => prevComponents.filter((c) => c.id !== id));
      toast({
        title: t('salaryComponents.deleteSuccess'),
        description: t('salaryComponents.deleteSuccessDesc'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || t('salaryComponents.deleteFail');
      setError(errorMessage);
      toast({
        title: t('salaryComponents.deleteFail'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">{t('salaryComponents.pageTitle')}</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={handleOpenAddModal}
        >
          {t('salaryComponents.addNew')}
        </Button>
      </Flex>

      {isLoading && components.length === 0 && (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {error && (
        <Box color="red.500" mb={4} p={3} borderWidth="1px" borderRadius="md" borderColor="red.300" bg="red.50">
          <Text fontWeight="bold">An error occurred:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      {!isLoading && !error && components.length === 0 && (
         <Text mt="4">{t('salaryComponents.noComponents')}</Text>
      )}

      {components.length > 0 && (
        <SalaryComponentList
          components={components}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      <SalaryComponentModal
        isOpen={isModalOpen}
        onClose={() => {
          onModalClose();
          setEditingComponent(undefined);
        }}
        onSave={handleSaveComponent}
        component={editingComponent}
      />
    </Box>
  );
};

export default SalaryComponentsPage;