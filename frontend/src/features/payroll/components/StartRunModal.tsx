// --- START OF NEW FILE ---
// ---
// frontend/src/features/payroll/components/StartRunModal.tsx
// ---
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Select, Input, VStack, useToast, Text,
} from '@chakra-ui/react';
import { PaySchedule } from '../../../types';
import { fetchPaySchedules } from '../../../services/payScheduleApi';
import { StartPayrollRunPayload } from '../../../services/payrollRunApi';

interface StartRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: StartPayrollRunPayload) => void;
  isStarting: boolean;
}

const StartRunModal: React.FC<StartRunModalProps> = ({ isOpen, onClose, onConfirm, isStarting }) => {
  const [paySchedules, setPaySchedules] = useState<PaySchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const loadSchedules = async () => {
        try {
          const data = await fetchPaySchedules();
          setPaySchedules(data);
        } catch (error: any) {
          toast({
            title: 'Failed to load pay schedules',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      loadSchedules();
      // Reset form state when modal opens
      setSelectedScheduleId('');
      setPeriodEndDate('');
      setPaymentDate('');
    }
  }, [isOpen, toast]);

  const handleConfirm = () => {
    if (!selectedScheduleId || !periodEndDate || !paymentDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select a pay schedule and specify both dates.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onConfirm({
      payScheduleId: selectedScheduleId,
      periodEndDate,
      paymentDate,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Start New Payroll Run</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
            <Text mb={4}>Select the pay schedule and dates for this payroll run.</Text>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Pay Schedule</FormLabel>
              <Select
                placeholder="Select a pay schedule"
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
              >
                {paySchedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name} ({schedule.frequency})
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Pay Period End Date</FormLabel>
              <Input
                type="date"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
              />
            </FormControl>
             <FormControl isRequired>
              <FormLabel>Payment Date</FormLabel>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isStarting}>
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleConfirm}
            isLoading={isStarting}
            loadingText="Processing..."
          >
            Start Run
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StartRunModal;