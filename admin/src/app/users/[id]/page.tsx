import { UserDetailClient } from "./UserDetailClient";

interface IPageProps {
  params: { id: string };
}

export function generateMetadata({ params }: IPageProps) {
  return { title: `User ${params.id} — Cloud Clips Admin` };
}

export default function UserDetailPage({ params }: IPageProps) {
  return <UserDetailClient userId={params.id} />;
}
