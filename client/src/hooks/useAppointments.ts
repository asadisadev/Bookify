import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentAPI } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export const useAppointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all appointments
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments', user?._id],
    queryFn: appointmentAPI.getMyAppointments,
    enabled: !!user,
  });

  // Get single appointment
  const useAppointment = (id: string) => {
    return useQuery({
      queryKey: ['appointment', id],
      queryFn: () => appointmentAPI.getAppointmentById(id),
      enabled: !!id,
    });
  };

  // Create appointment
  const createMutation = useMutation({
    mutationFn: appointmentAPI.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Cancel appointment
  const cancelMutation = useMutation({
    mutationFn: appointmentAPI.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    appointments: data?.appointments || [],
    isLoading,
    error,
    refetch,
    useAppointment,
    createAppointment: createMutation.mutate,
    createAppointmentAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    cancelAppointment: cancelMutation.mutate,
    cancelAppointmentAsync: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
};