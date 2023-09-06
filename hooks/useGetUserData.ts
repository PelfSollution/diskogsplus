import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserObjectInterface {
  id: number;
  username: string;
  resource_url: string;
  consumer_name: string;
  location: string;
  profile: string;
  registered: string;
  num_collection: number;
  avatar_url: string;
  favorite_styles?: string;
}

export interface UserIdentityDataProps {
  data: {
    userProfile: UserObjectInterface;
  };
  error: boolean | undefined;
  isLoading: boolean | undefined;
  isValidating: boolean | undefined;
}


const useGetUserData = () => {
  const { data, error, isLoading, isValidating }: UserIdentityDataProps =
    useSWR(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/identity`, fetcher);
  return { data, error, isLoading, isValidating };
};

export default useGetUserData;

