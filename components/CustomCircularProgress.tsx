// CustomCircularProgress.tsx
import React from 'react';
import TurnTable from "@/components/TurnTable";

const CustomCircularProgress: React.FC = () => {
    return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center min-h-screen">
            <div>
                <TurnTable />
                <p className="tw-text-xs tw-text-red-400 tw-mt-2">Cargando...</p>
            </div>
        </div>
    );
}

export default CustomCircularProgress;



