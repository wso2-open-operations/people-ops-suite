import CustomizedTimeline from '@component/common/TimeLine';
import { Box } from '@mui/material';
import { useAppSelector, RootState } from "@slices/store";

export default function History() {

    const user = useAppSelector((state: RootState) => state.user);

    return (
        <>
            {user.userInfo?.workEmail && (
                <Box
                    sx={{
                        height: '70vh',
                        position: 'relative',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '100%',
                        }}
                    >
                        <CustomizedTimeline employeeEmail={user.userInfo.workEmail} />
                    </Box>
                </Box>
            )}
        </>
    );
}

