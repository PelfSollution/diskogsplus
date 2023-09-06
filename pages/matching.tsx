import React, { useState, FormEvent } from "react";
import useCompareAlbumList from "@/hooks/useCompareAlbumList";
import useGetUserData from "@/hooks/useGetUserData";
import Layout from "@/components/Layout";
import { TextField, Button } from "@mui/material";
import Link from "next/link";
import Image from "next/image";

interface Artist {
  name: string;
}

interface Album {
  id: number;
  basic_information: {
    cover_image: string;
    artists: Artist[];
    title: string;
    created_at: string;
  };
}

export default function Comparador() {
  const { data: userData } = useGetUserData();
  const user1 = userData?.userProfile?.username;
  const [user2, setUser2] = useState("");
  const [comparePressed, setComparePressed] = useState(false);

  const {
    data: albumsDifference,
    isLoading,
    error,
    size,
    setSize,
  } = useCompareAlbumList(user2, user1);

  const handleLoadMore = () => {
    setSize(size + 1);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setComparePressed(true);
  };

  return (
    <Layout centeredContent={false}>
      <div className="tw-container tw-mx-auto tw-p-6 tw-mt-6">
        <form onSubmit={handleSubmit} className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-2">
            <TextField
              label="Usuario 1"
              variant="outlined"
              fullWidth
              value={user1}
              disabled={true}
              className="tw-mb-4"
              id="user1"
              autoComplete="off"
            />
          </div>
          <div>
            <p className="tw-mb-2 tw-font-bold">
              Comparar coleccion de vinilos con el usuario:
            </p>
          </div>
          <div className="tw-flex tw-flex-col tw-gap-2">
            <TextField
              label="Usuario 2"
              variant="outlined"
              fullWidth
              value={user2}
              onChange={(e) => setUser2(e.target.value)}
              className="tw-mb-4"
              id="user2"
            />
          </div>
          <Button type="submit" variant="contained" color="primary">
            Comparar
          </Button>
        </form>

        {comparePressed && !isLoading && albumsDifference && (
          <div>
            <p className="tw-mb-4 tw-mt-4">
              Vinilos que <span className="tw-font-bold">{user1}</span> tiene y{" "}
              <span className="tw-font-bold">{user2}</span> no tiene:{" "}
              <span className="tw-font-bold tw-text-blue-500">
                {albumsDifference[0].length}
              </span>
            </p>

            <ul>
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
                {Array.isArray(albumsDifference[0]) &&
                  albumsDifference[0].map((album: Album) => (
                    <li key={album.id}>
                      <Link href={`/albums/${album.id}?from=compare`} passHref>
                        <div className="tw-bg-white tw-p-4 tw-rounded tw-shadow tw-cursor-pointer">
                          <Image
                            src={album.basic_information.cover_image}
                            alt={album.basic_information.title}
                            width={500}
                            height={240}
                            className="tw-w-full tw-h-48 tw-object-cover tw-mb-2 tw-rounded"
                          />
                          <h2 className="tw-text-xl">
                            <span className="tw-font-bold">
                              {album.basic_information.artists &&
                              album.basic_information.artists.length > 0
                                ? album.basic_information.artists[0].name
                                : "Artista desconocido"}
                            </span>
                            - {album.basic_information.title}
                          </h2>
                        </div>
                      </Link>
                    </li>
                  ))}
              </div>
            </ul>
            {/* Mostrar el botón "Cargar más" si es necesario */}
            {albumsDifference[0] && albumsDifference[0].length === 48 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleLoadMore}
              >
                Cargar más
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
