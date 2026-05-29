import { Suspense } from 'react';
import HomeContainer from '@/domain/Home/HomeContainer';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContainer />
    </Suspense>
  );
}
