import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Button, Chip, FormControl, InputLabel, MenuItem, Select, IconButton, TextField, Snackbar 
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloseIcon from "@mui/icons-material/Close";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import useGetAlbumList from "@/hooks/useGetAlbumList";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";



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

function Albums() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hasMoreDiscs, setHasMoreDiscs] = useState(true);
  const { data: albums, isLoading, error, size, setSize } = useGetAlbumList();
  const allAlbums = albums ? albums.flatMap((page) => page.releases) : [];
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"name" | "album">("name");
  const [orderAsc, setOrderAsc] = useState(true);

  const filteredAlbums = (allAlbums || [])
    .filter((album) => {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const titleMatches = album.basic_information.title
        .toLowerCase()
        .includes(lowercasedSearchTerm);
      const artistMatches = album.basic_information.artists.some(
        (artist: Artist) =>
          artist.name.toLowerCase().includes(lowercasedSearchTerm)
      );
      return titleMatches || artistMatches;
    })
    .sort((a, b) => {
      switch (filter) {
        case "name":
          const artistA = a.basic_information.artists[0]?.name || "";
          const artistB = b.basic_information.artists[0]?.name || "";
          return orderAsc
            ? artistA.localeCompare(artistB)
            : artistB.localeCompare(artistA);
        case "album":
          const titleA = a.basic_information.title;
          const titleB = b.basic_information.title;
          return orderAsc
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        default:
          return 0;
      }
    });

  const loadMoreAlbums = () => {
    setSize(size + 1);
  };

  const allAlbumsAreValid = filteredAlbums.every(
    (album) => album && album.id && album.basic_information
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          <CustomCircularProgress />
        </div>
      </Layout>
    );
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const mostrarMensaje = (mensaje: string) => {
    setSnackbarMessage(mensaje);
    setSnackbarOpen(true);
  };

  if (error || !allAlbums) {
    mostrarMensaje("Error al cargar los álbumes.");
    return <Layout>Error al cargar los álbumes.</Layout>;
  }

  return (
    <Layout centeredContent={false}>
      <div className="tw-container tw-mx-auto tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Discos</h1>
        <div className="tw-flex tw-items-center tw-gap-4 tw-my-4">
          <FormControl variant="outlined" size="small">
            <InputLabel>Filtrar por:</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "name" | "album")}
              label="Filtrar por:"
              className="tw-min-w-[110%] tw-mr-20 sm:tw-mr-20"
            >
              <MenuItem value="name">Artista</MenuItem>
              <MenuItem value="album">Disco</MenuItem>
            </Select>
          </FormControl>

          <TextField
            placeholder="Buscar..."
            variant="outlined"
            value={searchTerm}
            fullWidth
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            className="tw-min-w-[60%] tw-ml-4"
          />

          <IconButton
            onClick={() => setOrderAsc(!orderAsc)}
            className="tw-min-w-[2%] tw-ml-4"
          >
            {orderAsc ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
          </IconButton>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
          {filteredAlbums.map((album: Album) => {
            if (!album || !album.id || !album.basic_information) {
              return null;
            }
            return (
              <Link key={album.id} href={`/albums/${album.id}`} passHref>
                <div className="tw-relative tw-bg-white tw-p-0 tw-rounded-xl tw-shadow-md hover:tw-shadow-dark tw-cursor-pointer tw-overflow-hidden tw-inner-border-2">
                  <Image
                    src={album.basic_information.cover_image}
                    alt={album.basic_information.title}
                    width={500}
                    height={240}
                    className="tw-w-full tw-h-48 tw-object-cover tw-rounded tw-transform hover:tw-scale-110 hover:tw-opacity-90 tw-transition tw-duration-300 tw-ease-in-out"
                  />
                  <Chip
                    className="tw-absolute tw-bottom-4 tw-left-4 tw-text-xs"
                    label={album.basic_information.title}
                    style={{
                      backgroundColor: "#282828",
                      color: "white",
                      padding: "0",
                      fontSize: "12px",
                      height: "28px",
                    }}
                  />
                  <Chip
                    className="tw-absolute tw-bottom-10 tw-left-4 tw-text-xs"
                    label={
                      <>
                        <span className="tw-font-bold">
                          {album.basic_information.artists &&
                          album.basic_information.artists.length > 0
                            ? removeAllSubstringsInParenthesis(
                                album.basic_information.artists[0].name
                              )
                            : "Artista desconocido"}
                        </span>
                      </>
                    }
                    style={{
                      backgroundColor: "#f87171",
                      color: "white",
                      padding: "0",
                      fontSize: "12px",
                      height: "28px",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {searchTerm === "" && allAlbumsAreValid && (
          <div className="tw-flex tw-flex-col tw-gap-2 tw-mt-8">
            <Button type="submit" variant="outlined" onClick={loadMoreAlbums}>
              Cargar más Discos
            </Button>
          </div>
        )}

        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={snackbarOpen}
          autoHideDuration={3000} // Duración en milisegundos
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon />
            </IconButton>
          }
        />
      </div>
    </Layout>
  );
}

export default Albums;
