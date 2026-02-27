import { useQuery, useMutation, useQueryClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export interface IAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  instructions?: string;
}

export interface IAddressInput {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  instructions?: string;
}

const mockAddresses: IAddress[] = [
  {
    id: 'addr_1',
    label: 'Home',
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'USA',
    isDefault: true,
    instructions: 'Ring doorbell twice',
  },
  {
    id: 'addr_2',
    label: 'Office',
    line1: '456 Market Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    country: 'USA',
    isDefault: false,
  },
];

export function useAddresses() {
  const queryClient = useQueryClient();

  const addressesData = useQuery(
    isDevMode ? 'skip' : api.addresses.getAddresses,
    isDevMode ? 'skip' : undefined
  );
  const defaultAddressData = useQuery(
    isDevMode ? 'skip' : api.addresses.getDefaultAddress,
    isDevMode ? 'skip' : undefined
  );

  const addresses = isDevMode ? mockAddresses : (addressesData ?? []);
  const defaultAddress = isDevMode
    ? mockAddresses.find((a) => a.isDefault) || null
    : defaultAddressData;

  const addAddress = useMutation(api.addresses.addAddress);
  const updateAddress = useMutation(api.addresses.updateAddress);
  const deleteAddress = useMutation(api.addresses.deleteAddress);
  const setDefaultAddress = useMutation(api.addresses.setDefaultAddress);

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: [api.addresses.getAddresses] });
    queryClient.invalidateQueries({ queryKey: [api.addresses.getDefaultAddress] });
  };

  const handleAddAddress = async (address: IAddressInput) => {
    await addAddress({ address });
    refetch();
  };

  const handleUpdateAddress = async (id: string, address: Partial<IAddressInput>) => {
    await updateAddress({ addressId: id as Id<'addresses'>, address });
    refetch();
  };

  const handleDeleteAddress = async (id: string) => {
    await deleteAddress({ addressId: id as Id<'addresses'> });
    refetch();
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress({ addressId: id as Id<'addresses'> });
    refetch();
  };

  return {
    addresses,
    defaultAddress,
    refetch,
    addAddress: handleAddAddress,
    updateAddress: handleUpdateAddress,
    deleteAddress: handleDeleteAddress,
    setDefaultAddress: handleSetDefault,
  };
}
