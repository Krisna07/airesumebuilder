import { redirectIfAuthenticated } from "@/utils/redirectUtil";
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const Page = async () => {
  await redirectIfAuthenticated('/builder')
  return <div className='text-6xl animate-pulse'>REDIRECTING....</div>;
};

export default Page;
