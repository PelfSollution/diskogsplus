// CustomCircularProgress.tsx
import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import TurnTable from "@/components/TurnTable";

const CustomCircularProgress: React.FC = () => {
    return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center min-h-screen">
            <div>  {/* Este div envuelve al TurnTable */}
                <TurnTable />
                <p className="tw-text-red-400 tw-mt-2">Cargando...</p>
            </div>
        </div>
    );
}

export default CustomCircularProgress;



