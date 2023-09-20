import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Chip, FormControl, InputLabel, Select, MenuItem, TextField, IconButton } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import useGetUserData from "@/hooks/useGetUserData";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { getWantlistItemsUser, WantlistEntry } from "@/services/supabase/getWantlistItemsUser";


function Wantlist() {
  const { data: userData } = useGetUserData();
  const username = userData?.userProfile?.username;
  const [wantlistItems, setWantlistItems] = useState<WantlistEntry[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"name" | "album">("name");
  const [orderAsc, setOrderAsc] = useState(true);

  const filteredItems = (wantlistItems || [])
    .filter((item) => {
      switch (filter) {
        case "name":
          return item.artista.toLowerCase().includes(searchTerm.toLowerCase());
        case "album":
          return item.album.toLowerCase().includes(searchTerm.toLowerCase());
        default:
          return true;
      }
    })
    .sort((a, b) => {
      const valueA = filter === "name" ? a.artista : a.album;
      const valueB = filter === "name" ? b.artista : b.album;
      return orderAsc
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

  useEffect(() => {
    getWantlistItemsUser(username)
      .then((data) => {
        setWantlistItems(data);
        setError(null);
      })
      .catch((err) => {
        setWantlistItems(null);
        setError(err);
      });
  }, [username]);

  const isLoading = !wantlistItems && !error;

  if (isLoading) {
    return (
      <Layout>
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          <CustomCircularProgress />
        </div>
      </Layout>
    );
  }

  if (error || !wantlistItems) {
    return <Layout>Error al cargar la wantlist.</Layout>;
  }

  return (
    <Layout centeredContent={false}
    title="Wantlist - Diskogs +"
    description="Discos de tu wantlist">
      <div className="tw-container tw-mx-auto tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Mi Wantlist</h1>
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
          {filteredItems.map((item: WantlistEntry) => (
            <Link
              key={item.disco_id}
              href={`/albums/${item.disco_id}?from=compare`}
              passHref
            >
              <div className="tw-relative tw-bg-white tw-p-0 tw-rounded-xl tw-shadow-md hover:tw-shadow-dark tw-cursor-pointer tw-overflow-hidden tw-inner-border-2">
                <Image
                  src={item.image_url}
                  alt={item.album}
                  width={500}
                  height={240}
                  className="tw-w-full tw-h-48 tw-object-cover tw-rounded tw-transform hover:tw-scale-110 hover:tw-opacity-90 tw-transition tw-duration-300 tw-ease-in-out"
                />
                <Chip
                  className="tw-absolute tw-bottom-4 tw-left-4 tw-text-xs"
                  label={item.album}
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
                  label={<span className="tw-font-bold">{item.artista}</span>}
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
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Wantlist;
