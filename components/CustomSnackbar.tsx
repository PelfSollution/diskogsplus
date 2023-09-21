import {Snackbar} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

type SnackbarProps = {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

const CustomSnackbar: React.FC<SnackbarProps> = ({ isOpen, message, onClose }) => {
    return (
        <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            open={isOpen}
            autoHideDuration={3000}
            onClose={onClose}
            message={message}
            action={
                <IconButton size="small" color="inherit" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            }
        />
    );
}

export default CustomSnackbar;