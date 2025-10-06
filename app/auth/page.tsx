import { redirectIfAuthenticated } from "@/utils/redirectUtil";

const Page = async () => {
  await redirectIfAuthenticated('/builder')
  return <div className='text-6xl animate-pulse'>REDIRECTING....</div>;
};

export default Page;
