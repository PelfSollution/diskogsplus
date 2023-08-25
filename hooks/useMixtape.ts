import { useState, useEffect } from 'react';

type TrackType = { position: string; title: string; duration: string };
type MixtapeType = { [key: string]: TrackType };

export const useMixtape = () => {
  const [mixtape, setMixtape] = useState<MixtapeType>({});
  useEffect(() => {
    console.log("Contenido actual de mixtape:", mixtape);
}, [mixtape]);

  const addToMixtape = (id: string, track: TrackType) => {
    const uniqueKey = `${id}-${track.position}`;
    setMixtape((prev: MixtapeType) => {
      const updatedMixtape = { ...prev, [uniqueKey]: track };
      console.log("Añadido al mixtape:", updatedMixtape);
      return updatedMixtape;
    });
  };

  const removeFromMixtape = (id: string, trackPosition: string) => {
    const uniqueKey = `${id}-${trackPosition}`;
    setMixtape((prev: MixtapeType) => {
      const updatedMixtape = { ...prev };
      delete updatedMixtape[uniqueKey];
      console.log("Actualización del mixtape después de borrar:", updatedMixtape);
      return updatedMixtape;
    });
  };

  const isTrackInMixtape = (id: string, trackPosition: string) => {
    const uniqueKey = `${id}-${trackPosition}`;
    return Boolean(mixtape[uniqueKey]);
  };

  return { mixtape, addToMixtape, removeFromMixtape, isTrackInMixtape };
};
