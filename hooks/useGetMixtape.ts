import { useState, useEffect } from "react";
import getMixtape from "../services/supabase/getMixtape";

function useGetMixtape(username: string) {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchMixtape() {
            try {
                const mixtapeData = await getMixtape(username); 
                setData(mixtapeData.filter(entry => entry.username === username));
                setIsLoading(false);
            } catch (err: any) {
                setError(new Error(err.message || "Ocurrió un error al obtener la mixtape"));
                setIsLoading(false);
            }
        }

        fetchMixtape();
    }, [username]);

    return { data, isLoading, error };
}

export default useGetMixtape;
