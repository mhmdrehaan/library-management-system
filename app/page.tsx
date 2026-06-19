import { redirect } from 'next/navigation';

export default function Home(): React.ReactElement {
  redirect('/login');
}
