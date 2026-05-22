'use client';

import LocationWithDate from '../LocationWithDate/LoactionWithDate';
import MissionWithNote from '../MissionWithNote/MissionWithNote';

export default function InformationsContainer() {
  return (
    <>
      <div>
        <LocationWithDate />
        <MissionWithNote />
      </div>
    </>
  );
}
