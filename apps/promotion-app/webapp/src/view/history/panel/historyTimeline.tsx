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
                        flex: 1,
                        height: '70vh', 
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <CustomizedTimeline employeeEmail={user.userInfo.workEmail} />
                </Box>
            )}
        </>
    );
}

